import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BrainCircuit } from "lucide-react";
import { aiModelsService } from "@/services/ai-data";
import { PageHeader } from "@/features/dashboard/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";

const AI_PROVIDER_KINDS: Array<
  "openai" | "gemini" | "claude" | "openrouter" | "azure_openai" | "local"
> = ["openai", "gemini", "claude", "openrouter", "azure_openai", "local"];

const PROVIDER_LABEL: Record<string, string> = {
  openai: "OpenAI",
  gemini: "Google Gemini",
  claude: "Anthropic Claude",
  openrouter: "OpenRouter",
  azure_openai: "Azure OpenAI",
  local: "Local",
};

export function AIModelsPage() {
  const [kind, setKind] = useState<string>("");
  const { data: models, isLoading } = useQuery({
    queryKey: ["ai", "models", kind],
    queryFn: () =>
      aiModelsService.list(kind ? (kind as (typeof AI_PROVIDER_KINDS)[number]) : undefined),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Models"
        description="Catálogo técnico de modelos disponíveis por vendor."
        actions={
          <Select onValueChange={(v) => setKind(v)} defaultValue={kind}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Todos os providers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os providers</SelectItem>
              {Object.keys(PROVIDER_LABEL).map((k) => (
                <SelectItem key={k} value={k}>
                  {PROVIDER_LABEL[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : models && models.length > 0 ? (
        <Card className="shadow-sm">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Modelo</th>
                  <th className="px-3 py-2 font-medium">Vendor</th>
                  <th className="px-3 py-2 font-medium">Contexto</th>
                  <th className="hidden px-3 py-2 font-medium md:table-cell">Preço</th>
                  <th className="px-3 py-2 font-medium">Capabilities</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {models.map((model) => (
                  <tr key={model.id}>
                    <td className="px-3 py-2.5 font-medium">
                      {model.display_name}
                      {model.is_beta && (
                        <Badge variant="secondary" className="ml-1.5">
                          beta
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {PROVIDER_LABEL[model.provider_kind] ?? model.provider_kind}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {model.context_tokens ? `${(model.context_tokens / 1000).toFixed(0)}K` : "—"}
                    </td>
                    <td className="hidden px-3 py-2.5 text-muted-foreground md:table-cell">
                      $ {model.input_price_1m ?? 0}/1M in
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1.5">
                        {model.supports_streaming && <Badge variant="secondary">streaming</Badge>}
                        {model.supports_embeddings && <Badge variant="secondary">embeddings</Badge>}
                        {model.supports_moderation && <Badge variant="secondary">moderation</Badge>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={BrainCircuit}
          title="Não hay modelos no catálogo"
          description="El catálogo técnico se alimenta via seed en las migrations."
        />
      )}
    </div>
  );
}
