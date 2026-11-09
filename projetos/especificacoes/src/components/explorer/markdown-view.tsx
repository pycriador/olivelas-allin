import { useEffect, useId, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useThemeStore } from "@/stores/theme.store";
import { cn } from "@/lib/utils";

function MermaidBlock({ code }: { code: string }) {
  const id = useId().replace(/:/g, "");
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const mode = useThemeStore((s) => s.mode);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: mode === "dark" ? "dark" : "default",
          securityLevel: "strict",
        });
        const { svg } = await mermaid.render(`m-${id}`, code);
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Diagrama inválido");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, id, mode]);

  if (error) {
    return (
      <pre className="overflow-auto rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
        {error}
        {"\n\n"}
        {code}
      </pre>
    );
  }
  return <div ref={ref} className="my-4 flex justify-center overflow-auto rounded-md border border-border bg-card p-4" />;
}

/** Markdown renderer styled with the app design tokens (no typography plugin). */
export function MarkdownView({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn("max-w-3xl text-sm leading-relaxed text-foreground", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-4 mt-6 border-b border-border pb-2 text-2xl font-semibold tracking-tight first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => <h2 className="mb-3 mt-6 text-xl font-semibold tracking-tight">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-2 mt-5 text-base font-semibold">{children}</h3>,
          h4: ({ children }) => <h4 className="mb-2 mt-4 text-sm font-semibold">{children}</h4>,
          p: ({ children }) => <p className="my-3 text-sm leading-7 text-foreground/90">{children}</p>,
          ul: ({ children }) => <ul className="my-3 list-disc space-y-1 pl-6">{children}</ul>,
          ol: ({ children }) => <ol className="my-3 list-decimal space-y-1 pl-6">{children}</ol>,
          li: ({ children }) => <li className="text-sm leading-6 marker:text-muted-foreground">{children}</li>,
          input: ({ checked, type }) =>
            type === "checkbox" ? (
              <input
                type="checkbox"
                checked={!!checked}
                readOnly
                className="mr-2 h-3.5 w-3.5 translate-y-[2px] accent-primary"
              />
            ) : null,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-4 hover:opacity-80"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-2 border-primary/60 bg-muted/40 py-1 pl-4 text-sm italic text-muted-foreground">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-6 border-border" />,
          img: ({ src, alt }) => (
            <img src={typeof src === "string" ? src : ""} alt={alt ?? ""} loading="lazy" className="my-4 max-w-full rounded-md border border-border" />
          ),
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-md border border-border">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-muted/60">{children}</thead>,
          th: ({ children }) => <th className="border-b border-border px-3 py-2 text-left text-xs font-semibold">{children}</th>,
          td: ({ children }) => <td className="border-b border-border px-3 py-2 align-top text-xs">{children}</td>,
          code: ({ className: cls, children }) => {
            const text = String(children ?? "").replace(/\n$/, "");
            const lang = /language-(\w+)/.exec(cls ?? "")?.[1];
            if (!lang) {
              return <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.8em]">{children}</code>;
            }
            if (lang === "mermaid") return <MermaidBlock code={text} />;
            return (
              <div className="my-4 overflow-hidden rounded-md border border-border bg-muted/40">
                <div className="border-b border-border px-3 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {lang}
                </div>
                <pre className="overflow-x-auto p-3">
                  <code className="font-mono text-xs leading-6">{text}</code>
                </pre>
              </div>
            );
          },
          pre: ({ children }) => <>{children}</>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export { MermaidBlock };
