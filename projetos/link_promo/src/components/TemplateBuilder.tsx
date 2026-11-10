import { useRef, useState } from "react";
import { Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export const TEMPLATE_VARIABLES = [
  { token: "{{nome_produto}}", label: "Nome do produto", sample: "Fone Bluetooth JBL Tune 510BT" },
  { token: "{{preco_antigo}}", label: "Antigo Preço", sample: "R$ 299,90" },
  { token: "{{preco_novo}}", label: "Preço Novo", sample: "R$ 179,90" },
  { token: "{{parcelas}}", label: "Quantas vezes", sample: "12x de R$ 14,99" },
  { token: "{{link}}", label: "Link", sample: "https://short.url/abc123" },
] as const;

export function renderTemplate(content: string, values: Record<string, string>) {
  return TEMPLATE_VARIABLES.reduce(
    (acc, v) => acc.split(v.token).join(values[v.token] ?? v.sample),
    content
  );
}

interface TemplateBuilderProps {
  name: string;
  content: string;
  onNameChange: (value: string) => void;
  onContentChange: (value: string) => void;
}

export function TemplateBuilder({ name, content, onNameChange, onContentChange }: TemplateBuilderProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(TEMPLATE_VARIABLES.map((v) => [v.token, v.sample]))
  );

  const insertToken = (token: string) => {
    const el = textareaRef.current;
    if (!el) {
      onContentChange(content + token);
      return;
    }
    const start = el.selectionStart ?? content.length;
    const end = el.selectionEnd ?? content.length;
    const next = content.slice(0, start) + token + content.slice(end);
    onContentChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground">Nome do template</label>
          <Input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Ex: Promoção Flash"
            className="bg-secondary/50 border-border"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground">Variáveis (clique para inserir)</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {TEMPLATE_VARIABLES.map((v) => (
              <Button
                key={v.token}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => insertToken(v.token)}
                className="h-7 border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-mono"
              >
                {v.label}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground">Conteúdo</label>
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            placeholder="🔥 {{nome_produto}} por apenas {{preco_novo}} (de {{preco_antigo}})&#10;💳 {{parcelas}}&#10;👉 {{link}}"
            className="bg-secondary/50 border-border min-h-[180px] font-mono text-sm"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Valores de exemplo</label>
          {TEMPLATE_VARIABLES.map((v) => (
            <div key={v.token} className="flex items-center gap-2">
              <span className="w-32 shrink-0 text-xs text-muted-foreground">{v.label}</span>
              <Input
                value={values[v.token] ?? ""}
                onChange={(e) => setValues((prev) => ({ ...prev, [v.token]: e.target.value }))}
                className="h-8 bg-secondary/50 border-border text-xs"
              />
            </div>
          ))}
        </div>

        <div>
          <label className="text-xs text-muted-foreground flex items-center gap-1">
            <Eye className="h-3.5 w-3.5 text-primary" />
            Pré-visualização
          </label>
          <div className="mt-1 rounded-lg border border-primary/30 bg-secondary/40 p-3 min-h-[140px] text-sm text-foreground whitespace-pre-wrap break-words">
            {content.trim() ? renderTemplate(content, values) : (
              <span className="text-muted-foreground">A mensagem aparece aqui enquanto você escreve…</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
