import type { Block } from "@/types/domain";
import { BlockType } from "@/types/domain";
import ReactMarkdown from "react-markdown";

const MAX_BLOCK_CONTENT_LENGTH = 100_000;

function safeContent(content: string): string {
  if (content.length > MAX_BLOCK_CONTENT_LENGTH) {
    return content.slice(0, MAX_BLOCK_CONTENT_LENGTH);
  }
  return content;
}

export function BlockRenderer({ block }: { block: Block }) {
  const content = safeContent(block.content);
  switch (block.type) {
    case BlockType.Markdown:
      return (
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown
            allowedElements={["p", "strong", "em", "a", "code", "pre", "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "hr", "table", "thead", "tbody", "tr", "th", "td", "img", "br", "del", "input"]}
          >
            {content}
          </ReactMarkdown>
        </div>
      );
    case BlockType.Code:
    case BlockType.JSON:
    case BlockType.YAML:
    case BlockType.SQL:
      return (
        <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 text-xs">
          <code>{content}</code>
        </pre>
      );
    case BlockType.Checklist: {
      let items: Array<{ text: string; done: boolean }> = [];
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          items = parsed.filter(
            (it): it is { text: string; done: boolean } =>
              typeof it === "object" && it !== null && typeof it.text === "string" && typeof it.done === "boolean",
          );
        }
      } catch {
        items = [];
      }
      return (
        <ul className="space-y-1 text-sm">
          {items.map((it, i) => (
            <li key={i} className="flex items-center gap-2">
              <input type="checkbox" checked={it.done} readOnly className="rounded" />
              <span className={it.done ? "line-through text-muted-foreground" : ""}>{it.text}</span>
            </li>
          ))}
        </ul>
      );
    }
    case BlockType.Mermaid:
      return (
        <pre className="rounded-md border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          {content}
        </pre>
      );
    default:
      return <p className="text-sm text-foreground">{content}</p>;
  }
}

export function DocumentView({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-4">
      {blocks.map((b) => (
        <BlockRenderer key={b.id} block={b} />
      ))}
    </div>
  );
}
