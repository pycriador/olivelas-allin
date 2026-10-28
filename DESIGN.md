# DESIGN.md — Olivelas Allin (Fundação Mock V1)

## 1. Visual Direction & Architectural Philosophy

**Direction:** *Registro Corporativo & Atlas de Despacho (Notarial Registry & Dispatch Atlas)*

Olivelas Allin is a multi-tenant B2B SaaS platform designed for small and mid-sized companies that contract and operate only the management modules they need. Its interface rejects AI-template tropes (neon gradients, thick colored side-tabs, floating decorative glass cards, or meaningless charts) in favor of **notarial clarity**, **ledger-grade tabular precision**, and **unambiguous multi-tenant scope awareness**.

### Core Design Principles
1. **Explicit Scope & Tenant Isolation:** Every administrative view displays an explicit operational scope badge (`Console Global` vs `Empresa: <Nome Fantasia>`), breadcrumb hierarchy, and when applicable, a persistent audited support-impersonation ribbon.
2. **Ledger-Grade Data Density:** Administrative tables use `font-variant-numeric: tabular-nums`, sticky headers, URL-persisted query filters (`?status=...&search=...&page=...&pageSize=...&sort=...&order=...&includeArchived=...`), and container-query responsive transformations.
3. **Zero Physical Deletion & Forensic Traceability:** Destructive buttons are replaced with audited logical archiving (`ArchiveRecordDialog`) requiring an explicit justification and recording actor, timestamp, and before/after diffs.
4. **Native Light/Dark Adaptive Tokens:** Built on CSS `light-dark()` with `<meta name="color-scheme" content="light dark">` for instant, flash-free theme switching across `light`, `dark`, and `system` modes.

---

## 2. Typography Scale & Roles

| Role | Token / Font Stack | Size / Line Height | Weight / Numeric Variant |
| :--- | :--- | :--- | :--- |
| **Sans UI & Editorial** | `--font-sans` (`Inter`, `-apple-system`, `BlinkMacSystemFont`, sans-serif) | `0.875rem` (14px) base / `1.5` | `400` regular, `500` medium, `600` semibold, `700` bold |
| **Monospace / Technical IDs** | `--font-mono` (`JetBrains Mono`, `SFMono-Regular`, `Menlo`, monospace) | `0.75rem`–`0.8125rem` / `1.45` | `500` medium, `tabular-nums` |
| **Page Title (`h1`)** | `--font-sans` | `1.35rem` (21.6px) / `1.25` | `600`, letter-spacing `-0.02em` |
| **Section Header (`h2`, `.card-title`)** | `--font-sans` | `0.9375rem` (15px) / `1.3` | `600` |
| **KPI Metric Value (`.kpi-value`)** | `--font-sans` | `1.5rem` (24px) / `1.2` | `700`, `font-variant-numeric: tabular-nums` |
| **Table Header (`th`)** | `--font-sans` | `0.75rem` (12px) / `1.35` | `600`, uppercase, letter-spacing `0.04em` |

---

## 3. Color Palette & Adaptive `light-dark()` Tokens

All color tokens are centralized in [src/styles/index.css](file:///Users/willian.jesus/Downloads/olivelas-allin/src/styles/index.css) using CSS `light-dark()`:

| Token | Light Mode Value | Dark Mode Value | Semantic Purpose |
| :--- | :--- | :--- | :--- |
| `--bg-canvas` | `#f8fafc` | `#0b0f17` | Primary application background canvas |
| `--bg-surface` | `#ffffff` | `#111827` | Cards, tables, dialogs, and form containers |
| `--bg-surface-raised` | `#f1f5f9` | `#1e293b` | Table headers, code blocks, and subtle panels |
| `--bg-sidebar` | `#0f172a` | `#090d16` | High-contrast compact navigation rail |
| `--text-primary` | `#0f172a` | `#f8fafc` | Primary body copy, headings, and values |
| `--text-secondary` | `#334155` | `#cbd5e1` | Table cells, labels, and secondary metadata |
| `--text-muted` | `#64748b` | `#94a3b8` | Hints, timestamps, and empty state captions |
| `--border-subtle` | `#e2e8f0` | `#1e293b` | Hairline structural dividers and row borders |
| `--border-strong` | `#cbd5e1` | `#334155` | Input borders, active cards, and focus containers |
| `--accent-primary` | `#1d4ed8` | `#3b82f6` | Primary interactive action & focus ring |
| `--status-success` | `#15803d` | `#4ade80` | Active status, paid charges, valid states |
| `--status-warning` | `#b45309` | `#fbbf24` | Pending states, trial subscriptions, warnings |
| `--status-danger` | `#b91c1c` | `#f87171` | Overdue charges, revoked tokens, HBAC denials |
| `--status-info` | `#1d4ed8` | `#60a5fa` | Simulated operation badges & global scope |

---

## 4. Layout, Spacing & Core Components

- **Compact Navigation Shell (`.app-shell`):** `264px` fixed left sidebar on desktop (`1024px+`) with collapsible drawer on tablet/mobile, paired with a `56px` sticky operational topbar containing the scope badge, mock role switcher, language selector (`PT-BR`, `EN`, `ES`), theme switcher (`Light`, `Dark`, `System`), and demo database reset action.
- **Responsive Container-Query Tables (`.table-wrapper`):** Uses `container-type: inline-size` with sticky headers on desktop and automatic card-row stacking (`@container (width < 600px)`) using `--label-N` CSS custom properties for mobile legibility.
- **Light-Dismiss Native Modals (`<dialog closedby="any">`):** Used strictly for quick confirmations, logical archiving justifications, and inspector modals while keeping all entity creation, editing, and detail views on dedicated routable URLs.
