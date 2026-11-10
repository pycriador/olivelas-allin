import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Copy, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { createApiToken } from "@/server/api-tokens.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_app/api")({ component: ApiPage });

const TABLES = [
  "empresas", "plataformas", "series", "generos", "subgeneros",
  "jogos", "itens", "colecao", "lojas", "links_compra", "cupons",
];

function ApiPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const tokens = useQuery({
    queryKey: ["api_tokens", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("api_tokens").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: async () => createApiToken({ data: { nome } }),
    onSuccess: (res) => {
      setCreatedToken(res.token);
      setNome("");
      qc.invalidateQueries({ queryKey: ["api_tokens"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revoke = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("api_tokens").update({ revoked_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Token revogado"); qc.invalidateQueries({ queryKey: ["api_tokens"] }); },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("api_tokens").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api_tokens"] }),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-xl neon-text-pink">API REST</h1>
        <p className="text-muted-foreground font-mono text-xl mt-1">Acesse sua coleção via HTTP</p>
      </div>

      {/* Tokens */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm neon-text-cyan">TOKENS DE ACESSO</h2>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setCreatedToken(null); setNome(""); } }}>
            <DialogTrigger asChild>
              <Button className="font-display text-xs"><Plus className="h-4 w-4 mr-1" /> NOVO TOKEN</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display text-sm neon-text-cyan">CRIAR TOKEN</DialogTitle></DialogHeader>
              {createdToken ? (
                <div className="space-y-3">
                  <p className="font-mono text-base text-destructive">⚠ Copie agora. Este token NÃO será mostrado novamente.</p>
                  <div className="flex gap-2">
                    <Input readOnly value={createdToken} className="font-mono" />
                    <Button onClick={() => { navigator.clipboard.writeText(createdToken); toast.success("Copiado"); }}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => { setOpen(false); setCreatedToken(null); }} className="font-display text-xs">FECHAR</Button>
                  </DialogFooter>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="font-mono text-lg">Nome do token</Label>
                    <Input value={nome} onChange={(e) => setNome(e.target.value)} required maxLength={80} />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={create.isPending} className="font-display text-xs">GERAR</Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-lg border-2 border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-display text-[10px]">NOME</TableHead>
                <TableHead className="font-display text-[10px]">PREFIX</TableHead>
                <TableHead className="font-display text-[10px]">CRIADO</TableHead>
                <TableHead className="font-display text-[10px]">ÚLTIMO USO</TableHead>
                <TableHead className="font-display text-[10px]">STATUS</TableHead>
                <TableHead className="text-right font-display text-[10px]">AÇÕES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tokens.data?.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 font-mono text-xl text-muted-foreground">Sem tokens.</TableCell></TableRow>
              )}
              {tokens.data?.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-lg">{t.nome}</TableCell>
                  <TableCell className="font-mono text-lg">rv_{t.prefix}_•••</TableCell>
                  <TableCell className="font-mono text-lg">{new Date(t.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="font-mono text-lg">{t.last_used_at ? new Date(t.last_used_at).toLocaleString() : "—"}</TableCell>
                  <TableCell className="font-mono text-lg">
                    {t.revoked_at ? <span className="text-destructive">REVOGADO</span> : <span className="text-primary">ATIVO</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    {!t.revoked_at && (
                      <Button variant="ghost" size="sm" onClick={() => revoke.mutate(t.id)} className="font-mono text-base h-8">REVOGAR</Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => { if (confirm("Remover token?")) del.mutate(t.id); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Docs */}
      <section className="space-y-3">
        <h2 className="font-display text-sm neon-text-cyan">DOCUMENTAÇÃO</h2>

        <div className="rounded-lg border-2 border-border bg-card p-4 space-y-2">
          <p className="font-mono text-lg"><strong>Base URL:</strong> <code className="text-primary">{baseUrl}/api/v1</code></p>
          <p className="font-mono text-lg"><strong>Auth:</strong> header <code>Authorization: Bearer rv_xxx_yyy</code></p>
          <p className="font-mono text-lg"><strong>Recursos:</strong> {TABLES.join(", ")}</p>
        </div>

        <div className="rounded-lg border-2 border-border bg-card p-4 space-y-2">
          <h3 className="font-display text-xs neon-text-yellow">ENDPOINTS</h3>
          <ul className="font-mono text-lg space-y-1">
            <li><code className="text-accent">GET</code> /api/v1/{"{recurso}"} — listar (?limit=50&offset=0&campo=valor)</li>
            <li><code className="text-accent">GET</code> /api/v1/{"{recurso}"}/{"{id}"} — buscar 1</li>
            <li><code className="text-accent">POST</code> /api/v1/{"{recurso}"} — criar (JSON no body)</li>
            <li><code className="text-accent">PATCH</code> /api/v1/{"{recurso}"}/{"{id}"} — atualizar</li>
            <li><code className="text-accent">DELETE</code> /api/v1/{"{recurso}"}/{"{id}"} — remover</li>
          </ul>
        </div>

        <Tabs defaultValue="curl" className="w-full">
          <TabsList>
            <TabsTrigger value="curl" className="font-display text-[10px]">CURL</TabsTrigger>
            <TabsTrigger value="python" className="font-display text-[10px]">PYTHON</TabsTrigger>
            <TabsTrigger value="php" className="font-display text-[10px]">PHP</TabsTrigger>
          </TabsList>
          <TabsContent value="curl"><CodeBlock code={curlExamples(baseUrl)} /></TabsContent>
          <TabsContent value="python"><CodeBlock code={pythonExamples(baseUrl)} /></TabsContent>
          <TabsContent value="php"><CodeBlock code={phpExamples(baseUrl)} /></TabsContent>
        </Tabs>
      </section>
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative">
      <Button
        size="sm" variant="secondary"
        className="absolute top-2 right-2 font-display text-[10px]"
        onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      </Button>
      <pre className="rounded-lg border-2 border-border bg-background p-4 overflow-x-auto font-mono text-base whitespace-pre-wrap">{code}</pre>
    </div>
  );
}

function curlExamples(base: string) {
  return `# Listar jogos
curl "${base}/api/v1/jogos?limit=20" \\
  -H "Authorization: Bearer rv_xxx_yyy"

# Criar jogo
curl -X POST "${base}/api/v1/jogos" \\
  -H "Authorization: Bearer rv_xxx_yyy" \\
  -H "Content-Type: application/json" \\
  -d '{"titulo":"Chrono Trigger","ano_lancamento":1995}'

# Atualizar
curl -X PATCH "${base}/api/v1/jogos/<ID>" \\
  -H "Authorization: Bearer rv_xxx_yyy" \\
  -H "Content-Type: application/json" \\
  -d '{"nota_metacritic":98}'

# Deletar
curl -X DELETE "${base}/api/v1/jogos/<ID>" \\
  -H "Authorization: Bearer rv_xxx_yyy"`;
}

function pythonExamples(base: string) {
  return `import requests

BASE = "${base}/api/v1"
TOKEN = "rv_xxx_yyy"
H = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

# Listar
r = requests.get(f"{BASE}/jogos", params={"limit": 20}, headers=H)
print(r.json())

# Criar
r = requests.post(f"{BASE}/jogos", json={"titulo": "Chrono Trigger", "ano_lancamento": 1995}, headers=H)
novo = r.json()["data"]

# Atualizar
requests.patch(f"{BASE}/jogos/{novo['id']}", json={"nota_metacritic": 98}, headers=H)

# Deletar
requests.delete(f"{BASE}/jogos/{novo['id']}", headers=H)`;
}

function phpExamples(base: string) {
  return `<?php
$base = "${base}/api/v1";
$token = "rv_xxx_yyy";
$ctx = stream_context_create([
  "http" => [
    "header" => "Authorization: Bearer $token\\r\\nContent-Type: application/json\\r\\n",
    "ignore_errors" => true,
  ],
]);

// Listar
$res = file_get_contents("$base/jogos?limit=20", false, $ctx);
print_r(json_decode($res, true));

// Criar (use cURL para POST)
$ch = curl_init("$base/jogos");
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_POSTFIELDS => json_encode(["titulo" => "Chrono Trigger", "ano_lancamento" => 1995]),
  CURLOPT_HTTPHEADER => ["Authorization: Bearer $token", "Content-Type: application/json"],
]);
$novo = json_decode(curl_exec($ch), true)["data"];
curl_close($ch);
?>`;
}
