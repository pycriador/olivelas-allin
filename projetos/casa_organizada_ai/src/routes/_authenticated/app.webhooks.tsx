import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Webhook, Plus, Trash2, Loader2, TestTube, CheckCircle2, XCircle } from "lucide-react";
import { listWebhooks, deleteWebhook, testWebhook } from "@/modules/webhooks/webhooks.functions";
import { WEBHOOK_EVENTS } from "@/modules/webhooks/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/webhooks")({
  component: WebhooksPage,
});

function WebhooksPage() {
  const listFn = useServerFn(listWebhooks);
  const deleteFn = useServerFn(deleteWebhook);
  const testFn = useServerFn(testWebhook);
  const qc = useQueryClient();

  const { data: webhooks, isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => listFn(),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['webhooks'] }); toast.success('Webhook excluído'); },
  });

  const [testUrl, setTestUrl] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; status?: number; error?: string; duration_ms?: number } | null>(null);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Webhooks</h1>
          <p className="mt-1 text-sm text-muted-foreground">Configure disparos para serviços externos quando eventos ocorrerem.</p>
        </div>
        <Button className="bg-gradient-brand text-primary-foreground shadow-elegant">
          <Plus className="mr-1.5 h-4 w-4" /> Novo webhook
        </Button>
      </div>

      {/* Test webhook */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Testar webhook</CardTitle>
          <CardDescription className="text-xs">Envie um payload de teste para verificar se a URL está funcionando.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input placeholder="https://exemplo.com/webhook" value={testUrl} onChange={(e) => setTestUrl(e.target.value)} />
            <Button variant="outline" size="sm" onClick={async () => {
              if (!testUrl) return;
              const result = await testFn({ data: { url: testUrl, http_method: 'POST', headers: {}, body: { event: 'test', timestamp: new Date().toISOString() } } });
              setTestResult(result);
              toast.success(result.success ? 'Webhook respondeu OK' : `Erro: ${result.error}`);
            }}>
              <TestTube className="mr-1.5 h-4 w-4" /> Testar
            </Button>
          </div>
          {testResult && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              {testResult.success ? <CheckCircle2 className="h-3 w-3 text-success" /> : <XCircle className="h-3 w-3 text-destructive" />}
              <span>{testResult.success ? `Status ${testResult.status} (${testResult.duration_ms}ms)` : testResult.error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhooks list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : !webhooks || webhooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <Webhook className="mb-3 h-12 w-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Nenhum webhook configurado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(webhooks as any[]).map((w) => (
            <Card key={w.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-sm">{w.name}</CardTitle>
                  <CardDescription className="text-xs font-mono">{w.url}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={w.is_active} />
                  <Button variant="ghost" size="icon-sm" onClick={() => deleteMut.mutate(w.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {(w.events as string[]).map((ev: string) => (
                    <Badge key={ev} variant="outline" className="text-[10px]">{ev}</Badge>
                  ))}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {w.http_method} · {w.retry_count} retentativas · timeout {w.timeout_ms}ms
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
