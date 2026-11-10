import { Pencil, Sparkles, Copy, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ScrapedData {
  productName: string;
  oldPrice: string;
  newPrice: string;
  installments: string;
  shortUrl: string;
}

interface ScrapedDataEditorProps {
  data: ScrapedData;
  onChange: (data: ScrapedData) => void;
  message: string | null;
  onGenerate: () => void;
  onCopy: () => void;
  isGenerating?: boolean;
}

export function ScrapedDataEditor({
  data,
  onChange,
  message,
  onGenerate,
  onCopy,
  isGenerating,
}: ScrapedDataEditorProps) {
  const updateField = (field: keyof ScrapedData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="gradient-card rounded-lg border border-primary/30 p-6 space-y-4 animate-slide-up glow-primary">
      <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
        <Pencil className="h-4 w-4" />
        Dados Coletados
        <span className="text-xs font-normal text-muted-foreground ml-1">
          (edite se necessário)
        </span>
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <EditableField
          label="Produto"
          value={data.productName}
          onChange={(v) => updateField("productName", v)}
          placeholder="Nome do produto"
        />
        <EditableField
          label="Preço Antigo"
          value={data.oldPrice}
          onChange={(v) => updateField("oldPrice", v)}
          placeholder="R$ 0,00"
        />
        <EditableField
          label="Preço Novo"
          value={data.newPrice}
          onChange={(v) => updateField("newPrice", v)}
          placeholder="R$ 0,00"
        />
        <EditableField
          label="Parcelas"
          value={data.installments}
          onChange={(v) => updateField("installments", v)}
          placeholder="12x de R$ 0,00"
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Link Encurtado</p>
        <div className="flex items-center gap-2 bg-secondary/50 rounded-md p-3 border border-border">
          <code className="text-sm font-mono text-primary flex-1 break-all">
            {data.shortUrl}
          </code>
        </div>
      </div>

      {!message ? (
        <Button
          onClick={onGenerate}
          disabled={isGenerating}
          className="w-full h-12 gradient-primary text-primary-foreground font-semibold text-base glow-primary"
        >
          <Sparkles className="mr-2 h-5 w-5" />
          Gerar Mensagem
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Mensagem Gerada
            </p>
            <pre className="bg-secondary/50 rounded-md p-4 border border-border text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
              {message}
            </pre>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={onCopy}
              className="flex-1 gradient-primary text-primary-foreground font-semibold glow-primary"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copiar Mensagem
            </Button>
            <Button
              onClick={onGenerate}
              variant="outline"
              className="font-semibold"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Regerar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function EditableField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 bg-secondary/50 border-border text-foreground"
      />
    </div>
  );
}
