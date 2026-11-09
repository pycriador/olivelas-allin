// File extension registry: icons, colors, monaco languages, binary handling.
import {
  FileText,
  FileCode2,
  FileJson,
  Database,
  Braces,
  Workflow,
  Image as ImageIcon,
  Link as LinkIcon,
  File,
  FileType2,
  Folder,
  FolderOpen,
  type LucideIcon,
} from "lucide-react";

export interface FileTypeInfo {
  label: string;
  language: string;
  icon: LucideIcon;
  /** Tailwind text color class (semantic-safe chart tokens). */
  color: string;
  /** Binary artifacts live in Storage and have no text editor. */
  binary?: boolean;
  mime?: string;
}

export const FILE_TYPES: Record<string, FileTypeInfo> = {
  md: { label: "Markdown", language: "markdown", icon: FileText, color: "text-chart-1", mime: "text/markdown" },
  txt: { label: "Text", language: "plaintext", icon: FileText, color: "text-muted-foreground", mime: "text/plain" },
  json: { label: "JSON", language: "json", icon: FileJson, color: "text-chart-4", mime: "application/json" },
  yaml: { label: "YAML", language: "yaml", icon: Braces, color: "text-chart-4" },
  yml: { label: "YAML", language: "yaml", icon: Braces, color: "text-chart-4" },
  sql: { label: "SQL", language: "sql", icon: Database, color: "text-chart-2" },
  py: { label: "Python", language: "python", icon: FileCode2, color: "text-chart-3" },
  js: { label: "JavaScript", language: "javascript", icon: FileCode2, color: "text-chart-4" },
  ts: { label: "TypeScript", language: "typescript", icon: FileCode2, color: "text-chart-1" },
  tsx: { label: "TypeScript React", language: "typescript", icon: FileCode2, color: "text-chart-1" },
  jsx: { label: "JavaScript React", language: "javascript", icon: FileCode2, color: "text-chart-4" },
  html: { label: "HTML", language: "html", icon: FileCode2, color: "text-chart-5" },
  css: { label: "CSS", language: "css", icon: FileCode2, color: "text-chart-2" },
  xml: { label: "XML", language: "xml", icon: FileCode2, color: "text-chart-5" },
  csv: { label: "CSV", language: "plaintext", icon: FileText, color: "text-chart-2" },
  mmd: { label: "Mermaid", language: "markdown", icon: Workflow, color: "text-chart-3" },
  puml: { label: "PlantUML", language: "plaintext", icon: Workflow, color: "text-chart-3" },
  drawio: { label: "Draw.io", language: "xml", icon: Workflow, color: "text-chart-5" },
  svg: { label: "SVG", language: "xml", icon: ImageIcon, color: "text-chart-5", mime: "image/svg+xml" },
  png: { label: "Imagem", language: "plaintext", icon: ImageIcon, color: "text-chart-5", binary: true, mime: "image/png" },
  jpg: { label: "Imagem", language: "plaintext", icon: ImageIcon, color: "text-chart-5", binary: true, mime: "image/jpeg" },
  jpeg: { label: "Imagem", language: "plaintext", icon: ImageIcon, color: "text-chart-5", binary: true, mime: "image/jpeg" },
  webp: { label: "Imagem", language: "plaintext", icon: ImageIcon, color: "text-chart-5", binary: true, mime: "image/webp" },
  gif: { label: "Imagem", language: "plaintext", icon: ImageIcon, color: "text-chart-5", binary: true, mime: "image/gif" },
  pdf: { label: "PDF", language: "plaintext", icon: FileType2, color: "text-destructive", binary: true, mime: "application/pdf" },
  zip: { label: "Arquivo", language: "plaintext", icon: File, color: "text-muted-foreground", binary: true, mime: "application/zip" },
};

/** Text extensions offered when creating documents. */
export const EXTENSIONS = Object.entries(FILE_TYPES)
  .filter(([, v]) => !v.binary)
  .map(([k]) => k);

export function fileType(ext?: string): FileTypeInfo {
  return (
    (ext && FILE_TYPES[ext.toLowerCase()]) || {
      label: "File",
      language: "plaintext",
      icon: File,
      color: "text-muted-foreground",
    }
  );
}

/** A node is binary when it has a Storage reference or a binary extension. */
export function isBinaryNode(node: { extension?: string; storagePath?: string }): boolean {
  if (node.storagePath) return true;
  return !!fileType(node.extension).binary;
}

export function nodeIcon(kind: string, ext?: string, open?: boolean): LucideIcon {
  if (kind === "folder") return open ? FolderOpen : Folder;
  if (kind === "link") return LinkIcon;
  if (kind === "shortcut") return LinkIcon;
  return fileType(ext).icon;
}

export function nodeColor(kind: string, ext?: string): string {
  if (kind === "folder") return "text-chart-4";
  if (kind === "link" || kind === "shortcut") return "text-chart-3";
  return fileType(ext).color;
}

export function displayName(name: string, kind: string, ext?: string) {
  if (kind !== "file" || !ext) return name;
  return name.endsWith(`.${ext}`) ? name : `${name}.${ext}`;
}

export function splitName(full: string): { name: string; extension?: string } {
  const idx = full.lastIndexOf(".");
  if (idx <= 0) return { name: full };
  return { name: full.slice(0, idx), extension: full.slice(idx + 1).toLowerCase() };
}

export function formatBytes(bytes?: number) {
  if (!bytes && bytes !== 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
