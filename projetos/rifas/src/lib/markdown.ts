function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeInline(value: string): string {
  return value
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/&(?!(?:amp|lt|gt|quot|#39);)/g, "&amp;");
}

function renderLinks(value: string): string {
  return value.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    (_match, text: string, url: string) =>
      `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`,
  );
}

function renderInline(value: string): string {
  let result = renderLinks(escapeInline(value));
  result = result.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  result = result.replace(/~~([^~]+)~~/g, "<del>$1</del>");
  result = result.replace(/`([^`]+)`/g, "<code>$1</code>");
  return result;
}

const HEADER_RE = /^(#{1,4})\s+(.+)$/;
const UNORDERED_RE = /^\s*[-*+]\s+(.+)$/;
const ORDERED_RE = /^\s*\d+\.\s+(.+)$/;
const QUOTE_RE = /^\s*>\s?(.*)$/;

/**
 * Converte um subconjunto seguro de Markdown para HTML, sempre escapando o
 * conteúdo antes — nunca emite HTML bruto vindo do usuário (XSS-safe).
 */
export function renderMarkdownToHtml(markdown: string): string {
  if (!markdown) return "";
  const lines = escapeHtml(markdown).split(/\r?\n/);
  const blocks: string[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let list: { type: "ul" | "ol"; items: string[] } | null = null;

  const flushList = () => {
    if (!list) return;
    const tag = list.type;
    blocks.push(`<${tag}>${list.items.map((item) => `<li>${item}</li>`).join("")}</${tag}>`);
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (line.startsWith("```")) {
      if (inCodeBlock) {
        blocks.push(`<pre><code>${codeBuffer.join("\n")}</code></pre>`);
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        flushList();
        inCodeBlock = true;
      }
      continue;
    }
    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    if (!line.trim()) {
      flushList();
      continue;
    }

    const header = HEADER_RE.exec(line);
    if (header) {
      flushList();
      const level = header[1]?.length ?? 1;
      blocks.push(`<h${level}>${renderInline(header[2] ?? "")}</h${level}>`);
      continue;
    }
    if (line === "---" || line === "***") {
      flushList();
      blocks.push("<hr />");
      continue;
    }
    const quote = QUOTE_RE.exec(line);
    if (quote) {
      flushList();
      blocks.push(`<blockquote>${renderInline(quote[1] ?? "")}</blockquote>`);
      continue;
    }
    const unordered = UNORDERED_RE.exec(line);
    if (unordered) {
      if (list?.type !== "ul") {
        flushList();
        list = { type: "ul", items: [] };
      }
      list.items.push(renderInline(unordered[1] ?? ""));
      continue;
    }
    const ordered = ORDERED_RE.exec(line);
    if (ordered) {
      if (list?.type !== "ol") {
        flushList();
        list = { type: "ol", items: [] };
      }
      list.items.push(renderInline(ordered[1] ?? ""));
      continue;
    }

    flushList();
    blocks.push(`<p>${renderInline(line)}</p>`);
  }

  if (inCodeBlock) blocks.push(`<pre><code>${codeBuffer.join("\n")}</code></pre>`);
  flushList();

  return blocks.join("\n");
}
