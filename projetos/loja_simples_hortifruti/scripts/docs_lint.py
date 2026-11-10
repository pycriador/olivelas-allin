#!/usr/bin/env python3
"""Documentation linter for the Engineering Documentation Standard (v1.0).

Stdlib-only. Shared rules for local and CI validation.

Exit codes:
  0 = PASS
  1 = VALIDATION FAILURE (one or more ERROR)
  2 = TOOL ERROR
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import sys
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Iterable

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CONFIG = ROOT / "docs" / "validation-config.yaml"

SECRET_PATTERNS = [
    (re.compile(r"(?i)(api[_-]?key|secret|password|token|private[_-]?key)\s*[:=]\s*['\"][^'\"]{12,}['\"]"), "DOC-SEC-001"),
    (re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"), "DOC-SEC-001"),
    # Require token-like length; avoid prose such as "bearer tokens"
    (re.compile(r"(?i)Bearer\s+[A-Za-z0-9\-._~+/]{16,}={0,2}"), "DOC-SEC-001"),
]

MD_LINK_RE = re.compile(r"\[([^\]]*)\]\(([^)]+)\)")
FRONTMATTER_RE = re.compile(r"\A---\s*\n(.*?)\n---\s*\n", re.S)
ID_LINE_RE = re.compile(r"(?m)^\*\*?ID:?\*\*?\s*[`:]?\s*([A-Z][A-Z0-9\-]+)")
CLAIM_STATUS_RE = re.compile(
    r"(?mi)^##\s*Status\s*$[\r\n]+[`\s]*(CONFIRMED|INFERRED|PROPOSED|UNKNOWN|DEPRECATED)"
)
CONFIDENCE_RE = re.compile(
    r"(?mi)^##\s*Confidence\s*$[\r\n]+[`\s]*(High|Medium|Low|Unknown)"
)


@dataclass
class Finding:
    severity: str  # ERROR | WARNING | INFO
    rule_id: str
    message: str
    path: str = ""
    line: int | None = None

    def format(self) -> str:
        loc = self.path or "(repo)"
        if self.line is not None:
            loc = f"{loc}:{self.line}"
        return f"{self.severity} [{self.rule_id}] {loc}: {self.message}"


@dataclass
class Report:
    findings: list[Finding] = field(default_factory=list)
    stats: dict[str, Any] = field(default_factory=dict)

    def add(self, severity: str, rule_id: str, message: str, path: str = "", line: int | None = None) -> None:
        self.findings.append(Finding(severity, rule_id, message, path, line))

    def count(self, severity: str) -> int:
        return sum(1 for f in self.findings if f.severity == severity)

    def errors(self) -> list[Finding]:
        return [f for f in self.findings if f.severity == "ERROR"]


def die(msg: str, code: int = 2) -> None:
    print(f"TOOL ERROR: {msg}", file=sys.stderr)
    raise SystemExit(code)


def load_simple_yaml(text: str) -> Any:
    """Minimal YAML loader for maps/lists/scalars used by this repo."""
    lines = text.splitlines()
    # Strip full-line comments and blank lines carefully inside parser
    return _parse_block(lines, 0, 0)[0]


def _strip_comment(s: str) -> str:
    in_single = in_double = False
    out = []
    for i, ch in enumerate(s):
        if ch == "'" and not in_double:
            in_single = not in_single
        elif ch == '"' and not in_single:
            in_double = not in_double
        elif ch == "#" and not in_single and not in_double:
            break
        out.append(ch)
    return "".join(out).rstrip()


def _parse_scalar(raw: str) -> Any:
    s = raw.strip()
    if s in ("", "~", "null", "Null", "NULL"):
        return None
    if s in ("true", "True", "TRUE"):
        return True
    if s in ("false", "False", "FALSE"):
        return False
    if s in ("{}",):
        return {}
    if s in ("[]",):
        return []
    if (s.startswith('"') and s.endswith('"')) or (s.startswith("'") and s.endswith("'")):
        return s[1:-1]
    if re.fullmatch(r"-?\d+", s):
        return int(s)
    if re.fullmatch(r"-?\d+\.\d+", s):
        return float(s)
    if s.startswith("[") and s.endswith("]"):
        inner = s[1:-1].strip()
        if not inner:
            return []
        parts = [p.strip() for p in inner.split(",")]
        return [_parse_scalar(p) for p in parts]
    if s.startswith("{") and s.endswith("}"):
        inner = s[1:-1].strip()
        if not inner:
            return {}
        # only empty/simple unsupported — prefer block form
        return {}
    return s


def _indent(line: str) -> int:
    return len(line) - len(line.lstrip(" "))


def _parse_block(lines: list[str], idx: int, indent: int) -> tuple[Any, int]:
    # Peek first meaningful line at this indent
    while idx < len(lines):
        raw = lines[idx]
        if not raw.strip() or raw.lstrip().startswith("#"):
            idx += 1
            continue
        break
    if idx >= len(lines):
        return None, idx

    line = _strip_comment(lines[idx])
    if not line.strip():
        return _parse_block(lines, idx + 1, indent)

    ind = _indent(line)
    if ind < indent:
        return None, idx

    stripped = line.strip()
    if stripped.startswith("- "):
        items: list[Any] = []
        while idx < len(lines):
            raw = lines[idx]
            if not raw.strip() or raw.lstrip().startswith("#"):
                idx += 1
                continue
            line = _strip_comment(raw)
            if not line.strip():
                idx += 1
                continue
            ind = _indent(line)
            if ind < indent:
                break
            if ind > indent and not line.strip().startswith("- "):
                # continuation belonging to previous — should not happen at list start
                break
            if ind != indent or not line.strip().startswith("- "):
                break
            content = line.strip()[2:]
            idx += 1
            if content == "" or content.endswith(":"):
                key = content[:-1].strip() if content.endswith(":") else None
                child, idx = _parse_block(lines, idx, indent + 2)
                if key is not None:
                    # "- key:" with nested map — merge
                    if isinstance(child, dict):
                        items.append({key: None, **child} if False else {**{key: None}, **child})
                        # Fix: "- id: X" style handled below
                    else:
                        items.append({key: child})
                else:
                    items.append(child)
            elif ":" in content and not content.strip().startswith("["):
                # inline map on list item: "- id: FOO" possibly followed by nested keys
                key, _, rest = content.partition(":")
                obj: dict[str, Any] = {key.strip(): _parse_scalar(rest) if rest.strip() else None}
                # consume nested dict keys at indent+2
                while idx < len(lines):
                    raw2 = lines[idx]
                    if not raw2.strip() or raw2.lstrip().startswith("#"):
                        idx += 1
                        continue
                    line2 = _strip_comment(raw2)
                    ind2 = _indent(line2)
                    if ind2 <= indent:
                        break
                    if line2.strip().startswith("- "):
                        break
                    if ":" not in line2:
                        break
                    k, _, r = line2.strip().partition(":")
                    k = k.strip()
                    r = r.strip()
                    idx += 1
                    if r == "":
                        nested, idx = _parse_block(lines, idx, ind2 + 2)
                        obj[k] = nested
                    else:
                        obj[k] = _parse_scalar(r)
                items.append(obj)
            else:
                items.append(_parse_scalar(content))
        return items, idx

    # Mapping
    mapping: dict[str, Any] = {}
    while idx < len(lines):
        raw = lines[idx]
        if not raw.strip() or raw.lstrip().startswith("#"):
            idx += 1
            continue
        line = _strip_comment(raw)
        if not line.strip():
            idx += 1
            continue
        ind = _indent(line)
        if ind < indent:
            break
        if ind > indent:
            # orphan nested — stop
            break
        if line.strip().startswith("- "):
            break
        if ":" not in line:
            idx += 1
            continue
        key, _, rest = line.strip().partition(":")
        key = key.strip()
        rest = rest.strip()
        idx += 1
        if rest == "":
            # nested block
            nested, idx = _parse_block(lines, idx, indent + 2)
            mapping[key] = nested
        else:
            mapping[key] = _parse_scalar(rest)
    return mapping, idx


def load_config(path: Path) -> dict[str, Any]:
    if not path.is_file():
        die(f"config not found: {path}")
    try:
        data = load_simple_yaml(path.read_text(encoding="utf-8"))
    except Exception as exc:  # noqa: BLE001
        die(f"failed to parse config {path}: {exc}")
    if not isinstance(data, dict):
        die("validation-config.yaml must be a mapping")
    return data


def parse_frontmatter(text: str) -> tuple[dict[str, Any], int]:
    m = FRONTMATTER_RE.match(text)
    if not m:
        return {}, 0
    body = m.group(1)
    meta: dict[str, Any] = {}
    for line in body.splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if ":" not in line:
            continue
        k, _, v = line.partition(":")
        k = k.strip()
        v = v.strip().strip('"').strip("'")
        if k:
            meta[k] = v
    return meta, m.end()


def iter_markdown(roots: Iterable[Path], exclude_globs: list[str]) -> list[Path]:
    files: list[Path] = []
    for root in roots:
        if not root.is_dir():
            continue
        for p in root.rglob("*.md"):
            rel = p.relative_to(ROOT).as_posix()
            if any(_glob_match(rel, g) for g in exclude_globs):
                continue
            files.append(p)
    return sorted(files)


def _glob_match(path: str, pattern: str) -> bool:
    # Very small glob: ** and *
    regex = ""
    i = 0
    while i < len(pattern):
        if pattern.startswith("**/", i):
            regex += ".*"
            i += 3
            continue
        ch = pattern[i]
        if ch == "*":
            regex += "[^/]*"
        elif ch in ".+()[]{}|^$":
            regex += re.escape(ch)
        else:
            regex += ch
        i += 1
    return re.fullmatch(regex, path) is not None


def load_manifest(path: Path) -> dict[str, Any]:
    if not path.is_file():
        return {}
    data = load_simple_yaml(path.read_text(encoding="utf-8"))
    return data if isinstance(data, dict) else {}


def severity_for(cfg: dict[str, Any], rule_id: str, default: str) -> str:
    rules = cfg.get("rules") or {}
    if not isinstance(rules, dict):
        rules = {}
    overrides = rules.get("severity_overrides") or {}
    if not isinstance(overrides, dict):
        overrides = {}
    disabled = rules.get("disabled") or []
    if not isinstance(disabled, list):
        disabled = []
    if rule_id in disabled:
        return "INFO"
    return overrides.get(rule_id, default)


def check_manifests(cfg: dict[str, Any], report: Report) -> dict[str, Any]:
    stats = {"manifest_entries": 0, "missing_paths": 0, "duplicate_ids": 0}
    seen_ids: dict[str, list[str]] = defaultdict(list)
    mcfg = cfg.get("manifest") or {}

    for mpath in cfg.get("manifests") or []:
        mp = ROOT / mpath
        if not mp.is_file():
            report.add(
                severity_for(cfg, "DOC-MAN-001", "ERROR"),
                "DOC-MAN-001",
                f"Manifest file missing: {mpath}",
                mpath,
            )
            continue
        data = load_manifest(mp)
        docs = data.get("documents") or []
        if not isinstance(docs, list):
            report.add("ERROR", "DOC-MAN-002", "manifest.documents must be a list", mpath)
            continue
        root_rel = data.get("root") or "."
        base = mp.parent if root_rel in (".", "") else (mp.parent / root_rel)
        listed_paths: set[str] = set()
        for entry in docs:
            if not isinstance(entry, dict):
                report.add("ERROR", "DOC-MAN-002", "manifest entry must be a mapping", mpath)
                continue
            stats["manifest_entries"] += 1
            eid = entry.get("id")
            path = entry.get("path")
            status = entry.get("status")
            owner = entry.get("owner")
            authority = entry.get("authority")
            if not eid:
                report.add(
                    severity_for(cfg, "DOC-ID-001", "ERROR"),
                    "DOC-ID-001",
                    "Manifest entry missing id",
                    mpath,
                )
            else:
                seen_ids[str(eid)].append(mpath)
            if not path:
                report.add(
                    severity_for(cfg, "DOC-MAN-003", "ERROR"),
                    "DOC-MAN-003",
                    f"Manifest entry {eid!r} missing path",
                    mpath,
                )
                continue
            target = (base / path).resolve()
            listed_paths.add(path)
            if mcfg.get("require_listed_paths_exist", True) and not target.is_file():
                stats["missing_paths"] += 1
                report.add(
                    severity_for(cfg, "DOC-MAN-004", "ERROR"),
                    "DOC-MAN-004",
                    f"Manifest path missing on filesystem: {path} (id={eid})",
                    mpath,
                )
            allowed = (cfg.get("metadata") or {}).get("allowed_statuses") or []
            if status and allowed and status not in allowed:
                report.add(
                    severity_for(cfg, "DOC-META-002", "ERROR"),
                    "DOC-META-002",
                    f"Invalid status {status!r} for {eid}",
                    mpath,
                )
            auth_allowed = (cfg.get("metadata") or {}).get("allowed_authority") or []
            if authority and auth_allowed and authority not in auth_allowed:
                report.add(
                    severity_for(cfg, "DOC-META-003", "WARNING"),
                    "DOC-META-003",
                    f"Unknown authority {authority!r} for {eid}",
                    mpath,
                )
            if (
                (cfg.get("metadata") or {}).get("require_owner_for_manifest_authoritative", True)
                and authority == "Authoritative"
                and not owner
            ):
                report.add(
                    severity_for(cfg, "DOC-META-001", "ERROR"),
                    "DOC-META-001",
                    f"Authoritative document {eid} must define owner",
                    mpath,
                )
            # Cross-check frontmatter id when file exists
            if target.is_file() and eid and (cfg.get("ids") or {}).get("require_id_for_manifest_entries", True):
                meta, _ = parse_frontmatter(target.read_text(encoding="utf-8", errors="replace"))
                if meta.get("id") and meta.get("id") != eid:
                    report.add(
                        severity_for(cfg, "DOC-ID-003", "WARNING"),
                        "DOC-ID-003",
                        f"Frontmatter id {meta.get('id')!r} != manifest id {eid!r}",
                        str(target.relative_to(ROOT)),
                    )

        # Unlisted markdown
        if mcfg.get("info_unlisted_markdown") or mcfg.get("warn_unlisted_markdown"):
            sev = "WARNING" if mcfg.get("warn_unlisted_markdown") else "INFO"
            for md in base.rglob("*.md"):
                rel = md.relative_to(base).as_posix()
                if "generated/" in rel or rel.startswith("templates/"):
                    continue
                if rel not in listed_paths and md.name != "README.md":
                    # Only sample hubs — avoid noise: skip deep optional corpus INFO flood
                    # Report only top-level standard docs not listed
                    if "/" not in rel:
                        report.add(
                            severity_for(cfg, "DOC-MAN-005", sev),
                            "DOC-MAN-005",
                            f"Markdown not listed in manifest (optional): {rel}",
                            mpath,
                        )

    for eid, places in seen_ids.items():
        # duplicate within same manifest already tracked per tree via global seen across manifests —
        # IDs may intentionally mirror EN/pt-BR. Only fail duplicates within one manifest file.
        pass

    # Per-manifest duplicate id check
    for mpath in cfg.get("manifests") or []:
        mp = ROOT / mpath
        if not mp.is_file():
            continue
        data = load_manifest(mp)
        counts: dict[str, int] = defaultdict(int)
        for entry in data.get("documents") or []:
            if isinstance(entry, dict) and entry.get("id"):
                counts[str(entry["id"])] += 1
        for eid, n in counts.items():
            if n > 1:
                stats["duplicate_ids"] += 1
                report.add(
                    severity_for(cfg, "DOC-ID-002", "ERROR"),
                    "DOC-ID-002",
                    f"Duplicate manifest id {eid} ({n} times)",
                    mpath,
                )

    report.stats["manifest"] = stats
    return stats


def check_markdown_files(cfg: dict[str, Any], report: Report) -> None:
    roots = [ROOT / r for r in (cfg.get("roots") or [])]
    exclude = cfg.get("exclude_globs") or []
    files = iter_markdown(roots, exclude)
    report.stats["markdown_files"] = len(files)

    id_index: dict[str, list[str]] = defaultdict(list)
    meta_cfg = cfg.get("metadata") or {}
    id_cfg = cfg.get("ids") or {}
    link_cfg = cfg.get("links") or {}
    fresh_cfg = cfg.get("freshness") or {}
    today = dt.date.today()

    # Build set of authoritative manifest paths for freshness
    auth_paths: set[Path] = set()
    for mpath in cfg.get("manifests") or []:
        mp = ROOT / mpath
        if not mp.is_file():
            continue
        data = load_manifest(mp)
        base = mp.parent
        for entry in data.get("documents") or []:
            if isinstance(entry, dict) and entry.get("authority") == "Authoritative" and entry.get("path"):
                auth_paths.add((base / entry["path"]).resolve())

    for path in files:
        rel = path.relative_to(ROOT).as_posix()
        try:
            text = path.read_text(encoding="utf-8")
        except OSError as exc:
            report.add("ERROR", "DOC-IO-001", f"Cannot read file: {exc}", rel)
            continue

        meta, _ = parse_frontmatter(text)
        if meta and meta_cfg.get("validate_when_present", True):
            status = meta.get("status")
            allowed = meta_cfg.get("allowed_statuses") or []
            if status and allowed and status not in allowed:
                report.add(
                    severity_for(cfg, "DOC-META-002", "ERROR"),
                    "DOC-META-002",
                    f"Invalid status token {status!r}",
                    rel,
                )
            if (
                meta_cfg.get("warn_missing_owner_when_accepted", True)
                and status == "ACCEPTED"
                and not meta.get("owner")
            ):
                report.add(
                    severity_for(cfg, "DOC-OWN-001", "WARNING"),
                    "DOC-OWN-001",
                    "ACCEPTED document missing owner in frontmatter",
                    rel,
                )
            authority = meta.get("authority")
            auth_allowed = meta_cfg.get("allowed_authority") or []
            if authority and auth_allowed and authority not in auth_allowed:
                report.add(
                    severity_for(cfg, "DOC-META-003", "WARNING"),
                    "DOC-META-003",
                    f"Unknown authority {authority!r}",
                    rel,
                )
            doc_id = meta.get("id")
            if doc_id:
                id_index[doc_id].append(rel)
                pat = id_cfg.get("pattern")
                if pat and not re.fullmatch(pat, doc_id):
                    report.add(
                        severity_for(cfg, "DOC-ID-004", "WARNING"),
                        "DOC-ID-004",
                        f"Malformed document id {doc_id!r}",
                        rel,
                    )

        # Body ID for claim/relationship templates
        for m in ID_LINE_RE.finditer(text):
            id_index[m.group(1)].append(rel)

        # Secret scan
        if (cfg.get("security") or {}).get("scan_secret_patterns", True):
            for i, line in enumerate(text.splitlines(), 1):
                # Skip obvious placeholders
                if any(x in line for x in ("[REDACTED]", "YOUR_", "example", "placeholder", "<", "${")):
                    continue
                for cre, rid in SECRET_PATTERNS:
                    if cre.search(line):
                        report.add(
                            severity_for(cfg, rid, "ERROR"),
                            rid,
                            "Possible secret material detected (value not printed)",
                            rel,
                            i,
                        )
                        break

        # Links (ignore fenced code blocks — often contain illustrative paths)
        if link_cfg.get("check_internal_markdown", True):
            link_text = re.sub(r"```.*?```", "", text, flags=re.S)
            for m in MD_LINK_RE.finditer(link_text):
                href = m.group(2).strip()
                if href.startswith(("http://", "https://", "mailto:", "#")):
                    continue
                if "://" in href:
                    continue
                target_part = href.split("#", 1)[0]
                if not target_part:
                    continue
                # Skip clearly illustrative / placeholder targets
                low = target_part.lower()
                if any(
                    x in low
                    for x in (
                        "example.md",
                        "/example/",
                        "order-created-v1.md",
                        "order-updated.md",
                        "your-",
                        "placeholder",
                    )
                ):
                    continue
                if not target_part.endswith(".md") and "/" not in target_part and "." not in Path(target_part).name:
                    if not target_part.endswith((".yaml", ".yml", ".json")):
                        continue
                dest = (path.parent / target_part).resolve()
                try:
                    dest.relative_to(ROOT)
                except ValueError:
                    report.add(
                        severity_for(cfg, "DOC-LINK-002", "ERROR"),
                        "DOC-LINK-002",
                        f"Link escapes repository root: {href}",
                        rel,
                    )
                    continue
                if not dest.exists():
                    sev = severity_for(cfg, "DOC-LINK-001", "ERROR" if link_cfg.get("fail_on_broken", True) else "WARNING")
                    report.add(sev, "DOC-LINK-001", f"Broken link: {href}", rel)

        # Bare ../../pkg/README.md in prose (not a Markdown link) — broken on Confluence
        if link_cfg.get("check_bare_relative_md_paths", True):
            bare_text = re.sub(r"```.*?```", "", text, flags=re.S)
            bare_text = re.sub(r"`[^`]+`", "", bare_text)
            # Drop entire markdown links (label may equal the path).
            bare_text = MD_LINK_RE.sub(" ", bare_text)
            # Two or more ../ — monorepo / out-of-tree smell (single ../ is normal in-tree).
            bare_re = re.compile(r"(?<!\()(?<!\]\()(\.\./){2,}(?:[\w.-]+/)+[\w.-]+\.md\b")
            for bm in bare_re.finditer(bare_text):
                report.add(
                    severity_for(cfg, "DOC-LINK-003", "ERROR"),
                    "DOC-LINK-003",
                    f"Bare relative path is not a link on Confluence/GitHub: {bm.group(0)} "
                    f"— use [label](https://github.com/org/repo/blob/main/...) or an in-tree .md link",
                    rel,
                )

        # Freshness
        if fresh_cfg.get("enabled", True) and path.resolve() in auth_paths:
            date_s = meta.get("review_date") or meta.get("updated") or meta.get("next_review")
            if date_s:
                try:
                    d = dt.date.fromisoformat(str(date_s)[:10])
                    age = (today - d).days
                    limit = int(fresh_cfg.get("stale_after_days", 365))
                    if age > limit:
                        report.add(
                            severity_for(cfg, "DOC-FRESH-001", "WARNING"),
                            "DOC-FRESH-001",
                            f"Document may require review ({age} days since {date_s})",
                            rel,
                        )
                except ValueError:
                    report.add(
                        severity_for(cfg, "DOC-FRESH-002", "WARNING"),
                        "DOC-FRESH-002",
                        f"Unparseable date in metadata: {date_s}",
                        rel,
                    )

        # Claim structural tokens
        if (cfg.get("claims") or {}).get("validate_claim_status_tokens", True):
            if path.name == "claim.md" or "/claim/" in rel or rel.endswith("/claim.md"):
                cm = CLAIM_STATUS_RE.search(text)
                if cm:
                    allowed = (cfg.get("claims") or {}).get("allowed_claim_status") or []
                    if allowed and cm.group(1).upper() not in [a.upper() for a in allowed]:
                        report.add("ERROR", "DOC-CLAIM-001", f"Invalid claim status {cm.group(1)}", rel)
                conf = CONFIDENCE_RE.search(text)
                if conf:
                    allowed_c = (cfg.get("claims") or {}).get("allowed_confidence") or []
                    if allowed_c and conf.group(1) not in allowed_c:
                        report.add("WARNING", "DOC-CLAIM-002", f"Invalid confidence {conf.group(1)}", rel)

    if id_cfg.get("detect_duplicates", True):
        for doc_id, paths in id_index.items():
            # Allow same id in en and pt-BR mirrors
            langs = set()
            for p in paths:
                if "/en/" in p or p.startswith("docs/en/"):
                    langs.add("en")
                elif "/pt-BR/" in p or p.startswith("docs/pt-BR/"):
                    langs.add("pt-BR")
                else:
                    langs.add("other")
            by_lang: dict[str, list[str]] = defaultdict(list)
            for p in paths:
                if "/en/" in p or p.startswith("docs/en/"):
                    by_lang["en"].append(p)
                elif "/pt-BR/" in p or p.startswith("docs/pt-BR/"):
                    by_lang["pt-BR"].append(p)
                else:
                    by_lang["other"].append(p)
            for lang, plist in by_lang.items():
                uniq = sorted(set(plist))
                if len(uniq) > 1:
                    report.add(
                        severity_for(cfg, "DOC-ID-002", "ERROR"),
                        "DOC-ID-002",
                        f"Duplicate id {doc_id} in {lang}: {', '.join(uniq)}",
                    )

    report.stats["unique_ids"] = len(id_index)


def check_exceptions(cfg: dict[str, Any], report: Report) -> None:
    exc_cfg = cfg.get("exceptions") or {}
    if not exc_cfg.get("detect_expired", True):
        return
    today = dt.date.today()
    open_count = 0
    expired = 0
    for pattern in exc_cfg.get("directory_globs") or []:
        # convert glob to path walk
        base_pattern = pattern.replace("**/", "").replace("**", "")
        # find exception md files under exceptions dirs
        for lang in ("en", "pt-BR"):
            ed = ROOT / "docs" / lang / "exceptions"
            if not ed.is_dir():
                continue
            for path in ed.rglob("*.md"):
                if path.name.upper() == "README.MD" or path.name == "README.md":
                    continue
                rel = path.relative_to(ROOT).as_posix()
                text = path.read_text(encoding="utf-8", errors="replace")
                open_count += 1
                # Look for Expiration: YYYY-MM-DD and Status
                exp_m = re.search(r"(?mi)^##\s*Expiration\s*$[\r\n]+[`\s]*([0-9]{4}-[0-9]{2}-[0-9]{2})", text)
                status_m = re.search(r"(?mi)^##\s*Status\s*$[\r\n]+[`\s]*([A-Za-z_\-]+)", text)
                status = status_m.group(1).upper() if status_m else ""
                if exp_m:
                    try:
                        exp = dt.date.fromisoformat(exp_m.group(1))
                        if exp < today and status not in ("EXPIRED", "CLOSED", "RESOLVED"):
                            expired += 1
                            report.add(
                                severity_for(cfg, "DOC-EXC-001", "ERROR"),
                                "DOC-EXC-001",
                                f"Exception expired on {exp.isoformat()} (status={status or 'missing'})",
                                rel,
                            )
                    except ValueError:
                        report.add("WARNING", "DOC-EXC-002", "Unparseable exception expiration", rel)
    report.stats["exceptions_openish"] = open_count
    report.stats["exceptions_expired"] = expired


def check_ai_readiness(cfg: dict[str, Any], report: Report) -> None:
    ai = cfg.get("ai_readiness") or {}
    if not ai.get("require_ai_context_exists", True):
        return
    for p in ai.get("ai_context_paths") or []:
        if not (ROOT / p).is_file():
            report.add(
                severity_for(cfg, "DOC-AI-001", "ERROR"),
                "DOC-AI-001",
                f"Required AI context missing: {p}",
                p,
            )


def check_relationships(cfg: dict[str, Any], report: Report) -> None:
    if not (cfg.get("relationships") or {}).get("validate_relationship_docs", True):
        return
    for lang in ("en", "pt-BR"):
        # templates and examples
        for path in (ROOT / "docs" / lang).rglob("*.md"):
            if "document-relationship" not in path.name and "relationship" not in path.as_posix():
                continue
            text = path.read_text(encoding="utf-8", errors="replace")
            if "## Source" not in text or "## Target" not in text:
                continue
            rel = path.relative_to(ROOT).as_posix()
            for section in ("Source", "Target"):
                m = re.search(rf"(?ms)^##\s*{section}\s*$(.+?)(?=^##\s|\Z)", text)
                if not m:
                    continue
                body = m.group(1).strip()
                # Resolve .md paths mentioned
                for link in MD_LINK_RE.findall(body):
                    href = link[1]
                    if href.startswith(("http://", "https://", "#")):
                        continue
                    target = (path.parent / href.split("#", 1)[0]).resolve()
                    if href.endswith(".md") and not target.is_file():
                        report.add(
                            severity_for(cfg, "DOC-REL-001", "ERROR"),
                            "DOC-REL-001",
                            f"Relationship {section} missing: {href}",
                            rel,
                        )


def build_health(report: Report) -> dict[str, Any]:
    errors = report.count("ERROR")
    warnings = report.count("WARNING")
    infos = report.count("INFO")
    # Indicators are qualitative for this standard repo — not a forced single grade
    validity = "pass" if errors == 0 else "fail"
    return {
        "errors": errors,
        "warnings": warnings,
        "info": infos,
        "validity": validity,
        "coverage": "manifest-scoped",
        "freshness": "warnings-only",
        "ownership": "manifest-authoritative-enforced",
        "traceability": "structural",
        "consistency": "ids-links-manifest",
        "ai_readiness": "ai-context-present" if errors == 0 or not any(f.rule_id == "DOC-AI-001" for f in report.findings) else "incomplete",
        "stats": report.stats,
    }


def write_health_report(health: dict[str, Any], findings: list[Finding]) -> Path:
    out = ROOT / "docs" / "en" / "reports" / "documentation-health.md"
    out.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "---",
        'title: "Documentation Health Report"',
        'status: "ACCEPTED"',
        'owner: "documentation-standard"',
        f'updated: "{dt.date.today().isoformat()}"',
        'generated: "true"',
        'standard: "Documentation Standard v1.0"',
        "---",
        "",
        "# Documentation Health",
        "",
        "> Generated by `scripts/docs_lint.py report`. Do not edit manually.",
        "",
        f"- Generated: {dt.date.today().isoformat()}",
        f"- Errors: {health['errors']}",
        f"- Warnings: {health['warnings']}",
        f"- Info: {health['info']}",
        f"- Validity: {health['validity']}",
        "",
        "## Indicators",
        "",
        f"| Indicator | Value |",
        f"| --- | --- |",
        f"| Coverage | {health['coverage']} |",
        f"| Freshness | {health['freshness']} |",
        f"| Ownership | {health['ownership']} |",
        f"| Traceability | {health['traceability']} |",
        f"| Consistency | {health['consistency']} |",
        f"| AI Readiness | {health['ai_readiness']} |",
        "",
        "## Findings",
        "",
    ]
    if not findings:
        lines.append("_No findings._")
    else:
        for f in findings:
            lines.append(f"- {f.format()}")
    lines.append("")
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    # Mirror pt-BR stub pointing to EN generated content structure
    out_pt = ROOT / "docs" / "pt-BR" / "reports" / "documentation-health.md"
    out_pt.parent.mkdir(parents=True, exist_ok=True)
    out_pt.write_text(
        out.read_text(encoding="utf-8")
        .replace('Language: EN | [Português (pt-BR)]', 'Idioma: pt-BR | [English (EN)]')
        .replace("# Documentation Health", "# Saúde da Documentação"),
        encoding="utf-8",
    )
    # Also copy into generated/
    gen = ROOT / "docs" / "en" / "generated" / "documentation-health.md"
    gen.parent.mkdir(parents=True, exist_ok=True)
    gen.write_text(out.read_text(encoding="utf-8"), encoding="utf-8")
    return out


def write_index_from_manifest(cfg: dict[str, Any]) -> Path:
    mp = ROOT / "docs" / "en" / "manifest.yaml"
    data = load_manifest(mp)
    out = ROOT / "docs" / "en" / "generated" / "manifest-index.md"
    out.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "---",
        'title: "Manifest Index"',
        'status: "ACCEPTED"',
        'owner: "documentation-standard"',
        f'updated: "{dt.date.today().isoformat()}"',
        'generated: "true"',
        "---",
        "",
        "# Manifest Index",
        "",
        "> Generated from `docs/en/manifest.yaml`. Do not edit manually.",
        "",
        "| ID | Title | Type | Status | Owner | Authority | Path |",
        "| --- | --- | --- | --- | --- | --- | --- |",
    ]
    for entry in data.get("documents") or []:
        if not isinstance(entry, dict):
            continue
        lines.append(
            "| {id} | {title} | {type} | {status} | {owner} | {authority} | [{path}](../{path}) |".format(
                id=entry.get("id", ""),
                title=entry.get("title", ""),
                type=entry.get("type", ""),
                status=entry.get("status", ""),
                owner=entry.get("owner", ""),
                authority=entry.get("authority", ""),
                path=entry.get("path", ""),
            )
        )
    lines.append("")
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return out


def run_all(cfg: dict[str, Any], report: Report) -> None:
    check_manifests(cfg, report)
    check_markdown_files(cfg, report)
    check_exceptions(cfg, report)
    check_ai_readiness(cfg, report)
    check_relationships(cfg, report)


def print_summary(report: Report) -> None:
    for f in report.findings:
        print(f.format())
    print()
    print(
        f"Summary: {report.count('ERROR')} ERROR, {report.count('WARNING')} WARNING, {report.count('INFO')} INFO"
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Documentation lint/validate tool (stdlib only)")
    parser.add_argument(
        "command",
        choices=["lint", "validate", "check-links", "check-manifest", "health", "report", "index"],
        help="Command to run",
    )
    parser.add_argument(
        "--config",
        default=str(DEFAULT_CONFIG),
        help="Path to validation-config.yaml",
    )
    parser.add_argument("--json", action="store_true", help="Emit JSON summary to stdout")
    args = parser.parse_args(argv)

    try:
        cfg = load_config(Path(args.config))
    except SystemExit as e:
        return int(e.code) if isinstance(e.code, int) else 2

    report = Report()
    try:
        if args.command in ("lint", "validate", "health", "report"):
            run_all(cfg, report)
        elif args.command == "check-links":
            check_markdown_files(cfg, report)
            # filter to link rules
            report.findings = [f for f in report.findings if f.rule_id.startswith("DOC-LINK")]
        elif args.command == "check-manifest":
            check_manifests(cfg, report)
        elif args.command == "index":
            path = write_index_from_manifest(cfg)
            print(f"Wrote {path.relative_to(ROOT)}")
            return 0

        health = build_health(report)
        if args.command in ("health", "report"):
            out = write_health_report(health, report.findings)
            print(f"Wrote {out.relative_to(ROOT)}")
            if args.command == "report":
                write_index_from_manifest(cfg)

        if args.json:
            print(
                json.dumps(
                    {
                        "errors": report.count("ERROR"),
                        "warnings": report.count("WARNING"),
                        "info": report.count("INFO"),
                        "findings": [f.__dict__ for f in report.findings],
                        "health": health,
                    },
                    indent=2,
                )
            )
        else:
            print_summary(report)

        if report.errors():
            return int((cfg.get("exit_codes") or {}).get("validation_failure", 1))
        return int((cfg.get("exit_codes") or {}).get("pass", 0))
    except Exception as exc:  # noqa: BLE001
        print(f"TOOL ERROR: {exc}", file=sys.stderr)
        return int((cfg.get("exit_codes") or {}).get("tool_error", 2))


if __name__ == "__main__":
    sys.exit(main())
