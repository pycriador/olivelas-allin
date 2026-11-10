// Browser-safe SQL snippet templates offered inside the SQL Studio.
export type SqlTemplate = {
  id: string;
  label: string;
  group: "basic" | "aggregate" | "advanced";
  sql: string;
};

export const SQL_TEMPLATES: SqlTemplate[] = [
  { id: "select", label: "SELECT básico", group: "basic", sql: "SELECT *\nFROM schema.table\nLIMIT 100;" },
  {
    id: "select-where",
    label: "SELECT com WHERE",
    group: "basic",
    sql: "SELECT column_a, column_b\nFROM schema.table\nWHERE column_a = 'valor'\nLIMIT 100;",
  },
  {
    id: "distinct",
    label: "DISTINCT",
    group: "basic",
    sql: "SELECT DISTINCT column_a\nFROM schema.table\nORDER BY column_a;",
  },
  {
    id: "order-by",
    label: "ORDER BY",
    group: "basic",
    sql: "SELECT *\nFROM schema.table\nORDER BY created_at DESC\nLIMIT 100;",
  },
  {
    id: "group-by",
    label: "GROUP BY",
    group: "aggregate",
    sql: "SELECT column_a, COUNT(*) AS total\nFROM schema.table\nGROUP BY column_a\nORDER BY total DESC;",
  },
  { id: "count", label: "COUNT", group: "aggregate", sql: "SELECT COUNT(*) AS total\nFROM schema.table;" },
  {
    id: "sum",
    label: "SUM",
    group: "aggregate",
    sql: "SELECT SUM(amount) AS total_amount\nFROM schema.table;",
  },
  { id: "avg", label: "AVG", group: "aggregate", sql: "SELECT AVG(amount) AS avg_amount\nFROM schema.table;" },
  { id: "min", label: "MIN", group: "aggregate", sql: "SELECT MIN(amount) AS min_amount\nFROM schema.table;" },
  { id: "max", label: "MAX", group: "aggregate", sql: "SELECT MAX(amount) AS max_amount\nFROM schema.table;" },
  {
    id: "join",
    label: "JOIN",
    group: "advanced",
    sql:
      "SELECT a.id, a.name, b.description\nFROM schema.table_a AS a\nJOIN schema.table_b AS b ON b.a_id = a.id\nLIMIT 100;",
  },
  {
    id: "date-filter",
    label: "Filtro por data",
    group: "advanced",
    sql:
      "SELECT *\nFROM schema.table\nWHERE created_at >= '2026-01-01'\n  AND created_at < '2026-02-01'\nORDER BY created_at DESC\nLIMIT 100;",
  },
  {
    id: "exists",
    label: "EXISTS",
    group: "advanced",
    sql:
      "SELECT a.*\nFROM schema.table_a AS a\nWHERE EXISTS (\n  SELECT 1 FROM schema.table_b AS b WHERE b.a_id = a.id\n)\nLIMIT 100;",
  },
  {
    id: "cte",
    label: "CTE (WITH)",
    group: "advanced",
    sql:
      "WITH base AS (\n  SELECT column_a, COUNT(*) AS total\n  FROM schema.table\n  GROUP BY column_a\n)\nSELECT *\nFROM base\nORDER BY total DESC\nLIMIT 100;",
  },
];