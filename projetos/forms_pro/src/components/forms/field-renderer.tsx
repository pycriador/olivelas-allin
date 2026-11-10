import { memo } from "react";
import { Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FormField } from "@/types/forms";

interface Props {
  field: FormField;
  /** disabled = builder canvas (non interactive) */
  disabled?: boolean;
  value?: unknown;
  onChange?: (value: unknown) => void;
}

function FieldControl({ field, disabled, value, onChange }: Props) {
  const common = {
    placeholder: field.placeholder || undefined,
    disabled,
    defaultValue: field.defaultValue || undefined,
  };

  switch (field.type) {
    case "long_text":
      return (
        <Textarea
          {...common}
          rows={4}
          value={value as string | undefined}
          onChange={(e) => onChange?.(e.target.value)}
        />
      );
    case "number":
      return (
        <Input
          {...common}
          type="number"
          min={field.min}
          max={field.max}
          value={value as string | undefined}
          onChange={(e) => onChange?.(e.target.value)}
        />
      );
    case "email":
      return <Input {...common} type="email" value={value as string | undefined} onChange={(e) => onChange?.(e.target.value)} />;
    case "phone":
      return <Input {...common} type="tel" placeholder={field.placeholder || field.mask} value={value as string | undefined} onChange={(e) => onChange?.(e.target.value)} />;
    case "url":
      return <Input {...common} type="url" value={value as string | undefined} onChange={(e) => onChange?.(e.target.value)} />;
    case "date":
      return <Input {...common} type="date" value={value as string | undefined} onChange={(e) => onChange?.(e.target.value)} />;
    case "time":
      return <Input {...common} type="time" value={value as string | undefined} onChange={(e) => onChange?.(e.target.value)} />;
    case "checkbox":
      return (
        <div className="flex items-center gap-2">
          <Checkbox
            disabled={disabled}
            checked={Boolean(value)}
            onCheckedChange={(c) => onChange?.(Boolean(c))}
          />
          <span className="text-sm text-muted-foreground">
            {field.placeholder || field.helpText || "Confirmo"}
          </span>
        </div>
      );
    case "radio":
      return (
        <RadioGroup
          disabled={disabled}
          value={value as string | undefined}
          onValueChange={(v) => onChange?.(v)}
          className="gap-2"
        >
          {field.options.map((o) => (
            <div key={o.id} className="flex items-center gap-2">
              <RadioGroupItem value={o.value} id={`${field.id}-${o.id}`} />
              <Label htmlFor={`${field.id}-${o.id}`} className="text-sm font-normal">
                {o.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      );
    case "select":
      return (
        <Select disabled={disabled} value={value as string | undefined} onValueChange={(v) => onChange?.(v)}>
          <SelectTrigger>
            <SelectValue placeholder={field.placeholder || "Selecione…"} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((o) => (
              <SelectItem key={o.id} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "multi_select": {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          {field.options.map((o) => (
            <label
              key={o.id}
              className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <Checkbox
                disabled={disabled}
                checked={selected.includes(o.value)}
                onCheckedChange={(c) =>
                  onChange?.(
                    c ? [...selected, o.value] : selected.filter((v) => v !== o.value),
                  )
                }
              />
              {o.label}
            </label>
          ))}
        </div>
      );
    }
    case "scale": {
      const min = field.min ?? 0;
      const max = field.max ?? 10;
      const current = typeof value === "number" ? value : min;
      return (
        <div className="space-y-2">
          <Slider
            disabled={disabled}
            min={min}
            max={max}
            step={1}
            value={[current]}
            onValueChange={([v]) => onChange?.(v)}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{min}</span>
            <span className="font-medium text-foreground">{current}</span>
            <span>{max}</span>
          </div>
        </div>
      );
    }
    case "rating": {
      const max = field.max ?? 5;
      const current = typeof value === "number" ? value : 0;
      return (
        <div className="flex gap-1">
          {Array.from({ length: max }, (_, i) => (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => onChange?.(i + 1)}
              className="transition hover:scale-110 disabled:cursor-default"
              aria-label={`${i + 1}`}
            >
              <Star
                className={cn(
                  "h-6 w-6",
                  i < current ? "fill-primary text-primary" : "text-muted-foreground/40",
                )}
              />
            </button>
          ))}
        </div>
      );
    }
    case "file":
      return (
        <div className="flex items-center gap-3 rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
          <Button type="button" variant="outline" size="sm" disabled={disabled}>
            Selecionar arquivo
          </Button>
          <span>{field.helpText || "PNG, JPG ou PDF até 10MB"}</span>
        </div>
      );
    default:
      return (
        <Input {...common} value={value as string | undefined} onChange={(e) => onChange?.(e.target.value)} />
      );
  }
}

export const FieldRenderer = memo(function FieldRenderer(props: Props) {
  const { field } = props;

  if (field.type === "divider") return <Separator className="my-2" />;
  if (field.type === "heading")
    return (
      <h3 className="text-xl font-semibold tracking-tight">
        {field.label || "Título da seção"}
      </h3>
    );
  if (field.type === "paragraph")
    return (
      <p className="text-sm leading-relaxed text-muted-foreground">
        {field.label || "Texto explicativo para orientar quem responde."}
      </p>
    );

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {field.label || "Pergunta sem título"}
        {field.required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      <FieldControl {...props} />
      {field.helpText && field.type !== "checkbox" && (
        <p className="text-xs text-muted-foreground">{field.helpText}</p>
      )}
    </div>
  );
});
