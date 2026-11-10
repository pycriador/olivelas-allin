// Browser-safe read-only SQL guard. The SAME module runs on the server before
// execution, so the UI feedback and the enforcement can never disagree.
// Phase 1.3 allows read statements only. Write support will be introduced later
// through an explicit capability flag (see `GuardOptions.allowWrites`).

export type GuardOptions = {
  /** Reserved for a future phase; always false in Phase 1.3. */
  allowWrites?: boolean;
  /** Multiple statements are rejected by default. */
  allowMultipleStatements?: boolean;
};

export type GuardFailure = {
  ok: false;
  code:
    | "empty"
    | "multiple_statements"
    | "forbidden_command"
    | "not_read_only"
    | "writes_disabled";
  message: string;
  keyword?: string;
};

export type GuardSuccess = {
  ok: true;
  statement: string;
  command: string;
};

export type GuardResult = GuardSuccess | GuardFailure;

/** Read commands allowed in this phase, across all supported engines. */
export const READ_COMMANDS = [
  "select",
  "with",
  "show",
  "describe",
  "desc",
  "explain",
  "table",
  "values",
  "pragma",
] as const;

/** Never allowed in this phase — not even for Administrator or DBA. */
export const FORBIDDEN_KEYWORDS = [
  "insert",
  "update",
  "delete",
  "drop",
  "alter",
  "truncate",
  "create",
  "grant",
  "revoke",
  "rename",
  "merge",
  "upsert",
  "replace",
  "call",
  "do",
  "copy",
  "vacuum",
  "reindex",
  "cluster",
  "attach",
  "detach",
  "lock",
  "listen",
  "notify",
  "begin",
  "commit",
  "rollback",
  "savepoint",
  "set",
  "reset",
  "load",
  "install",
  "prepare",
  "deallocate",
  "refresh",
  "comment",
  "analyze",
  "checkpoint",
  "shutdown",
] as const;

/** Removes comments and string/identifier literals so keyword scanning is safe. */
export function stripNonCode(sql: string): string {
  let out = "";
  let i = 0;
  while (i < sql.length) {
    const two = sql.slice(i, i + 2);
    if (two === "--") {
      const end = sql.indexOf("\n", i);
      i = end === -1 ? sql.length : end;
      continue;
    }
    if (two === "/*") {
      const end = sql.indexOf("*/", i + 2);
      i = end === -1 ? sql.length : end + 2;
      out += " ";
      continue;
    }
    const ch = sql[i]!;
    if (ch === "'" || ch === '"' || ch === "`") {
      i += 1;
      while (i < sql.length) {
        if (sql[i] === "\\") {
          i += 2;
          continue;
        }
        if (sql[i] === ch) {
          // doubled quote escape
          if (sql[i + 1] === ch) {
            i += 2;
            continue;
          }
          i += 1;
          break;
        }
        i += 1;
      }
      out += ch === "'" ? "''" : " ";
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

/** Splits on top-level semicolons after literals/comments were stripped. */
export function splitStatements(sql: string): string[] {
  const clean = stripNonCode(sql);
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < clean.length; i += 1) {
    const ch = clean[i];
    if (ch === "(") depth += 1;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    else if (ch === ";" && depth === 0) {
      parts.push(clean.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(clean.slice(start));
  return parts.map((p) => p.trim()).filter((p) => p.length > 0);
}

function tokens(sql: string): string[] {
  return sql.toLowerCase().match(/[a-z_][a-z0-9_]*/g) ?? [];
}

/**
 * Validates a SQL string for read-only execution.
 * Returns the single trimmed statement (without the trailing semicolon).
 */
export function guardReadOnlySql(rawSql: string, options: GuardOptions = {}): GuardResult {
  const trimmed = (rawSql ?? "").trim();
  if (!trimmed) {
    return { ok: false, code: "empty", message: "Informe uma consulta SQL." };
  }

  if (options.allowWrites) {
    return {
      ok: false,
      code: "writes_disabled",
      message: "Operações de escrita não estão habilitadas nesta versão da plataforma.",
    };
  }

  const statements = splitStatements(trimmed);
  if (statements.length === 0) {
    return { ok: false, code: "empty", message: "Informe uma consulta SQL." };
  }
  if (statements.length > 1 && !options.allowMultipleStatements) {
    return {
      ok: false,
      code: "multiple_statements",
      message:
        "Execute uma instrução por vez. Múltiplas instruções separadas por ponto e vírgula não são permitidas.",
    };
  }

  // Keep the original text (with literals) for the statement actually executed.
  const originalSingle = trimmed.replace(/;\s*$/, "");
  const scan = statements[0]!;
  const list = tokens(scan);
  const command = list[0] ?? "";

  if (!(READ_COMMANDS as readonly string[]).includes(command)) {
    return {
      ok: false,
      code: "not_read_only",
      message: `Apenas comandos de leitura são permitidos (${READ_COMMANDS.map((c) => c.toUpperCase()).join(", ")}).`,
      keyword: command.toUpperCase(),
    };
  }

  const forbidden = list.find((tk) => (FORBIDDEN_KEYWORDS as readonly string[]).includes(tk));
  if (forbidden) {
    return {
      ok: false,
      code: "forbidden_command",
      message: `O comando "${forbidden.toUpperCase()}" é bloqueado. Nesta fase o SQL Studio é somente leitura.`,
      keyword: forbidden.toUpperCase(),
    };
  }

  return { ok: true, statement: originalSingle, command: command.toUpperCase() };
}

/** True when the statement can safely be wrapped for row limiting. */
export function isRowReturningCommand(command: string): boolean {
  return ["SELECT", "WITH", "TABLE", "VALUES"].includes(command.toUpperCase());
}