import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Key, Plus, Trash2, Copy, Check, Loader2 } from "lucide-react";
import { listApiKeys, createApiKey, deleteApiKey } from "@/modules/api-gateway/api-keys.functions";
import { API_SCOPES } from "@/modules/api-gateway/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/api-keys")({
  component: ApiKeysPage,
});

function ApiKeysPage() {
  const listFn = useServerFn(listApiKeys);
  const createFn = useServerFn(createApiKey);
  const deleteFn = useServerFn(deleteApiKey);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: keys, isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => listFn(),
  });

  const createMut = useMutation({
    mutationFn: () => createFn({ data: { name, scopes: selectedScopes } }),
    onSuccess: (result) => {
      setNewKey((result as any).fullKey);
      qc.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['api-keys'] }); toast.success('Chave removida'); },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">API Keys</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie chaves de API para integrações externas.</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setNewKey(null); setName(''); setSelectedScopes([]); } }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-brand text-primary-foreground shadow-elegant">
              <Plus className="mr-1.5 h-4 w-4" /> Nova chave
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{newKey ? 'Chave criada' : 'Criar nova chave de API'}</DialogTitle></DialogHeader>
            {newKey ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Copie sua chave agora. Ela não será mostrada novamente.</p>
                <div className="flex gap-2">
                  <code className="flex-1 rounded-lg border bg-muted p-3 text-xs break-all font-mono">{newKey}</code>
                  <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(newKey); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                    {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <Button onClick={() => { setOpen(false); setNewKey(null); }} className="w-full">Concluído</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input placeholder="Ex: Produção - API" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Permissões</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {API_SCOPES.map((scope) => (
                      <label key={scope.value} className="flex items-center gap-2 rounded-lg border p-2 text-xs cursor-pointer hover:bg-accent">
                        <input type="checkbox" checked={selectedScopes.includes(scope.value)}
                          onChange={(e) => setSelectedScopes(e.target.checked ? [...selectedScopes, scope.value] : selectedScopes.filter(s => s !== scope.value))} />
                        {scope.label}
                      </label>
                    ))}
                  </div>
                </div>
                <Button onClick={() => createMut.mutate()} disabled={!name || selectedScopes.length === 0 || createMut.isPending} className="w-full">
                  {createMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar chave
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : !keys || keys.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <Key className="mb-3 h-12 w-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Nenhuma chave de API criada.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(keys as any[]).map((k) => (
            <Card key={k.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-sm">{k.name}</CardTitle>
                  <CardDescription className="text-xs font-mono">{k.key_prefix}...{k.id.slice(-4)}</CardDescription>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => deleteMut.mutate(k.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {(k.scopes as string[]).map((s: string) => (
                    <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
