// Browser-only CodeMirror instance. Never statically imported by a route.
import { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { sql, PostgreSQL, MySQL, SQLite, type SQLNamespace } from "@codemirror/lang-sql";
import { keymap, EditorView } from "@codemirror/view";
import { Prec } from "@codemirror/state";
import { useUIStore } from "@/lib/stores/ui-store";
import type { DsType } from "@/lib/datasources/types";

export type SqlEditorProps = {
  value: string;
  onChange: (value: string) => void;
  dsType: DsType | null;
  /** table name -> column names, used for autocomplete. */
  schemaHints?: Record<string, string[]>;
  onRun?: () => void;
  onSave?: () => void;
  onFormat?: () => void;
  height?: string;
  readOnly?: boolean;
};

function dialectFor(type: DsType | null) {
  if (type === "mysql" || type === "mariadb") return MySQL;
  if (type === "sqlite") return SQLite;
  return PostgreSQL;
}

export default function SqlEditorImpl(props: SqlEditorProps) {
  const theme = useUIStore((s) => s.theme);
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const extensions = useMemo(() => {
    const schema = (props.schemaHints ?? {}) as unknown as SQLNamespace;
    return [
      sql({ dialect: dialectFor(props.dsType), schema, upperCaseKeywords: true }),
      EditorView.lineWrapping,
      Prec.highest(
        keymap.of([
          {
            key: "Mod-Enter",
            preventDefault: true,
            run: () => {
              props.onRun?.();
              return true;
            },
          },
          {
            key: "Mod-s",
            preventDefault: true,
            run: () => {
              props.onSave?.();
              return true;
            },
          },
          {
            key: "Mod-Shift-f",
            preventDefault: true,
            run: () => {
              props.onFormat?.();
              return true;
            },
          },
        ]),
      ),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.dsType, props.schemaHints, props.onRun, props.onSave, props.onFormat]);

  return (
    <CodeMirror
      value={props.value}
      onChange={props.onChange}
      height={props.height ?? "280px"}
      theme={isDark ? "dark" : "light"}
      readOnly={props.readOnly}
      basicSetup={{
        lineNumbers: true,
        highlightActiveLine: true,
        foldGutter: true,
        autocompletion: true,
        searchKeymap: true,
        history: true,
        bracketMatching: true,
        closeBrackets: true,
        indentOnInput: true,
        tabSize: 2,
      }}
      extensions={extensions}
      className="overflow-hidden rounded-md border text-sm"
    />
  );
}