import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import {
  Eye,
  Code2,
  Columns2,
  Save,
  Search,
  Undo2,
  Redo2,
  Download,
  AlertTriangle,
  FileType2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useThemeStore } from "@/stores/theme.store";
import { fileType, isBinaryNode, formatBytes } from "@/lib/file-types";
import { storageService } from "@/services/storage.service";
import { MarkdownView } from "./markdown-view";
import { cn } from "@/lib/utils";
import type { ExplorerNode } from "@/types/explorer";

type Monaco = Parameters<OnMount>[0];
type SaveState = "idle" | "saving" | "saved" | "error" | "conflict";
type Mode = "editor" | "preview" | "split";

export interface SaveOptions {
  expectedUpdatedAt: number;
  force?: boolean;
}

function BinaryViewer({ node }: { node: ExplorerNode }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const info = fileType(node.extension);

  useEffect(() => {
    let cancelled = false;
    setUrl(null);
    setError(null);
    if (!node.storagePath) return;
    storageService
      .signedUrl(node.storagePath)
      .then((u) => !cancelled && setUrl(u))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "Erro ao gerar link"));
    return () => {
      cancelled = true;
    };
  }, [node.storagePath]);

  const isImage = (node.mimeType ?? "").startsWith("image/");
  const isPdf = node.mimeType === "application/pdf" || node.extension === "pdf";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-xs text-muted-foreground">
        <FileType2 className="h-4 w-4" />
        <span>{info.label}</span>
        <Badge variant="secondary" className="text-[10px]">{formatBytes(node.sizeBytes)}</Badge>
        <div className="flex-1" />
        {url && (
          <Button asChild variant="ghost" size="sm">
            <a href={url} target="_blank" rel="noopener noreferrer" download>
              <Download className="mr-1 h-4 w-4" /> Baixar
            </a>
          </Button>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-4">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!error && !url && <p className="text-sm text-muted-foreground">Gerando link seguro…</p>}
        {url && isImage && <img src={url} alt={node.name} className="mx-auto max-w-full rounded-md border border-border" />}
        {url && isPdf && <iframe src={url} title={node.name} className="h-full min-h-[600px] w-full rounded-md border border-border" />}
        {url && !isImage && !isPdf && (
          <p className="text-sm text-muted-foreground">
            Pré-visualização não disponível para este formato. Use o botão de download.
          </p>
        )}
      </div>
    </div>
  );
}

export function FileEditor({
  node,
  onSave,
}: {
  node: ExplorerNode;
  onSave: (content: string, opts: SaveOptions) => Promise<unknown>;
}) {
  const [value, setValue] = useState(node.content ?? "");
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const isMarkdown = node.extension === "md";
  const supportsPreview = isMarkdown || node.extension === "mmd";
  const [mode, setMode] = useState<Mode>(isMarkdown ? "split" : "editor");
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  /** Server version this buffer is based on — used for conflict detection. */
  const baseRef = useRef(node.updatedAt);
  const themeMode = useThemeStore((s) => s.mode);
  const info = useMemo(() => fileType(node.extension), [node.extension]);
  const binary = isBinaryNode(node);

  useEffect(() => {
    setValue(node.content ?? "");
    setDirty(false);
    setSaveState("idle");
    setSaveError(null);
    setMode(node.extension === "md" ? "split" : "editor");
    baseRef.current = node.updatedAt;
    // Only reset when switching documents — never clobber in-flight typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.id]);

  const persist = useCallback(
    async (content: string, force?: boolean) => {
      setSaveState("saving");
      try {
        const saved = (await onSave(content, { expectedUpdatedAt: baseRef.current, force })) as
          | ExplorerNode
          | undefined;
        baseRef.current = saved?.updatedAt ?? Date.now();
        setDirty(false);
        setSaveError(null);
        setSaveState("saved");
      } catch (e) {
        const message = e instanceof Error ? e.message : "Erro ao salvar";
        const conflict = e instanceof Error && e.name === "ConflictError";
        setSaveState(conflict ? "conflict" : "error");
        setSaveError(message);
      }
    },
    [onSave],
  );

  // Auto save (debounced)
  useEffect(() => {
    if (!dirty || binary || saveState === "conflict") return;
    const t = setTimeout(() => void persist(value), 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, dirty, binary]);

  // Never lose typed content silently on navigation away.
  useEffect(() => {
    if (!dirty && saveState !== "error" && saveState !== "conflict") return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty, saveState]);

  // ⌘S / Ctrl+S
  useEffect(() => {
    if (binary) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void persist(value, saveState === "conflict");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [value, persist, binary, saveState]);

  if (binary) return <BinaryViewer node={node} />;

  const statusLabel =
    saveState === "saving"
      ? "Salvando…"
      : saveState === "conflict"
        ? "Conflito"
        : saveState === "error"
          ? "Erro ao salvar"
          : dirty
            ? "Alterações não salvas"
            : "Salvo";

  const run = (id: string) => editorRef.current?.trigger("toolbar", id, null);
  const showEditor = mode === "editor" || mode === "split";
  const showPreview = supportsPreview && (mode === "preview" || mode === "split");

  const modeButton = (m: Mode, label: string, Icon: typeof Eye) => (
    <Button
      variant={mode === m ? "secondary" : "ghost"}
      size="sm"
      onClick={() => setMode(m)}
      title={label}
      className="h-7 px-2"
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-1 border-b border-border px-2 py-1.5">
        <span className="mr-2 truncate text-xs text-muted-foreground">{info.label}</span>
        <Button variant="ghost" size="sm" onClick={() => run("undo")} title="Desfazer">
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => run("redo")} title="Refazer">
          <Redo2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => run("actions.find")} title="Localizar">
          <Search className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => run("editor.action.startFindReplaceAction")}
          title="Substituir"
        >
          <span className="text-xs">R</span>
        </Button>
        <div className="flex-1" />
        {supportsPreview && (
          <div className="mr-1 flex items-center gap-0.5 rounded-md border border-border p-0.5">
            {modeButton("editor", "Editor", Code2)}
            {modeButton("split", "Split", Columns2)}
            {modeButton("preview", "Preview", Eye)}
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={() => void persist(value)} title={saveError ?? undefined}>
          <Save className={saveState === "error" || saveState === "conflict" ? "h-4 w-4 text-destructive" : "h-4 w-4"} />
          <span
            className={cn(
              "ml-1 text-xs",
              saveState === "error" || saveState === "conflict" ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {statusLabel}
          </span>
        </Button>
      </div>

      {saveState === "conflict" && (
        <div className="flex flex-wrap items-center gap-2 border-b border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <span>Este documento foi alterado por outra sessão. Recarregue ou sobrescreva.</span>
          <div className="flex-1" />
          <Button
            size="sm"
            variant="outline"
            className="h-7"
            onClick={() => {
              setValue(node.content ?? "");
              baseRef.current = node.updatedAt;
              setDirty(false);
              setSaveState("idle");
            }}
          >
            Recarregar
          </Button>
          <Button size="sm" variant="destructive" className="h-7" onClick={() => void persist(value, true)}>
            Sobrescrever
          </Button>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {showEditor && (
          <div className={cn("min-h-0", showPreview ? "w-1/2 border-r border-border" : "flex-1")}>
            <Editor
              height="100%"
              language={info.language}
              theme={themeMode === "dark" ? "vs-dark" : "light"}
              value={value}
              onMount={(editor, monaco) => {
                editorRef.current = editor;
                monacoRef.current = monaco;
              }}
              onChange={(v) => {
                setValue(v ?? "");
                setDirty(true);
              }}
              options={{
                lineNumbers: "on",
                minimap: { enabled: false },
                fontSize: 13,
                wordWrap: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>
        )}
        {showPreview && (
          <div className={cn("min-h-0 overflow-auto p-6", showEditor ? "w-1/2" : "flex-1")}>
            <MarkdownView content={node.extension === "mmd" ? `\`\`\`mermaid\n${value}\n\`\`\`` : value} />
          </div>
        )}
      </div>
    </div>
  );
}
