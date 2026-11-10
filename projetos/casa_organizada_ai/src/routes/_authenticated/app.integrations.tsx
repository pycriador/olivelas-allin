import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plug, PlugZap, Plus, Trash2, ExternalLink, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { listIntegrations, deleteIntegration } from "@/modules/integrations/integrations.functions";
import { PROVIDER_LABELS, type IntegrationProvider } from "@/modules/integrations/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/integrations")({
  component: IntegrationsPage,
});

const PROVIDER_CATEGORIES: Record<string, { label: string; providers: IntegrationProvider[] }> = {
  calendarios: { label: 'Calendários', providers: ['google_calendar', 'outlook_calendar'] },
  armazenamento: { label: 'Armazenamento', providers: ['google_drive', 'onedrive', 'dropbox'] },
  comunicacao: { label: 'Comunicação', providers: ['gmail', 'outlook_mail'] },
  automacao: { label: 'Automação', providers: ['zapier', 'make', 'n8n'] },
};

function IntegrationsPage() {
  const listFn = useServerFn(listIntegrations);
  const deleteFn = useServerFn(deleteIntegration);
  const qc = useQueryClient();

  const { data: integrations, isLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => listFn(),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['integrations'] }); toast.success('Integração removida'); },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Central de Integrações</h1>
        <p className="mt-1 text-sm text-muted-foreground">Conecte serviços externos para expandir as funcionalidades da plataforma.</p>
      </div>

      {Object.entries(PROVIDER_CATEGORIES).map(([key, cat]) => (
        <div key={key}>
          <h2 className="mb-3 text-lg font-medium">{cat.label}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cat.providers.map((provider) => {
              const existing = (integrations ?? []).find((i: { provider: string }) => i.provider === provider);
              return (
                <Card key={provider} className={existing ? "ring-1 ring-primary/20" : "opacity-70 hover:opacity-100 transition"}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{PROVIDER_LABELS[provider]}</CardTitle>
                      {existing && <Badge variant="secondary" className="text-[10px]">Conectado</Badge>}
                    </div>
                    <CardDescription className="text-xs">Conecte-se ao {PROVIDER_LABELS[provider]}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {existing ? (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">{existing.name}</p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="text-xs">
                            <ExternalLink className="mr-1 h-3 w-3" /> Configurar
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteMut.mutate(existing.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" className="text-xs">
                        <Plus className="mr-1 h-3 w-3" /> Conectar
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
