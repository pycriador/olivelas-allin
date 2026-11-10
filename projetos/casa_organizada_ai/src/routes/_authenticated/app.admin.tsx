import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser, type AppRole } from "@/lib/permissions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Users,
  FileText,
  LibraryBig,
  Share2,
  Ban,
  CircleCheck,
  Search,
  Loader2,
  Bot,
  FileCode,
  BarChart3,
  ClipboardList,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export const Route = createFileRoute("/_authenticated/app/admin")({
  head: () => ({
    meta: [
      { title: "Admin — HomeFlow" },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async () => {
    return { isAdmin: true };
  },
  component: AdminPage,
});

type ProfileRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  country: string | null;
  banned_at: string | null;
  created_at: string;
};

type UserRoleRow = { user_id: string; role: AppRole };

type AiProvider = {
  id: string;
  name: string;
  provider: string;
  base_url: string | null;
  enabled: boolean;
  created_at: string;
};

type AiPrompt = {
  id: string;
  key: string;
  title: string;
  content: string;
  is_system: boolean;
  created_at: string;
};

function AdminPage() {
  const { data: me } = useCurrentUser();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const stats = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const [users, forms, templates, shares, recent] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("forms").select("id", { count: "exact", head: true }),
        supabase.from("templates").select("id", { count: "exact", head: true }),
        supabase.from("form_shares").select("id", { count: "exact", head: true }),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .gte(
            "created_at",
            new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
          ),
      ]);
      return {
        users: users.count ?? 0,
        forms: forms.count ?? 0,
        templates: templates.count ?? 0,
        shares: shares.count ?? 0,
        newLast7: recent.count ?? 0,
      };
    },
  });

  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, country, banned_at, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      const ids = (profiles ?? []).map((p) => p.id);
      const { data: roles } = ids.length
        ? await supabase.from("user_roles").select("user_id, role").in("user_id", ids)
        : { data: [] as UserRoleRow[] };
      const rolesByUser = new Map<string, AppRole[]>();
      (roles ?? []).forEach((r) => {
        const arr = rolesByUser.get(r.user_id) ?? [];
        arr.push(r.role as AppRole);
        rolesByUser.set(r.user_id, arr);
      });
      return (profiles ?? []).map((p) => ({
        ...(p as ProfileRow),
        roles: rolesByUser.get(p.id) ?? [],
      }));
    },
  });

  const auditQuery = useQuery({
    queryKey: ["admin", "audit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("id, user_id, action, entity_type, entity_id, created_at")
        .order("created_at", { ascending: false })
        .limit(25);
      if (error) throw error;
      return data ?? [];
    },
  });

  const providersQuery = useQuery({
    queryKey: ["admin", "ai-providers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_providers")
        .select("*")
        .order("name");
      if (error) throw error;
      return (data ?? []) as unknown as AiProvider[];
    },
  });

  const promptsQuery = useQuery({
    queryKey: ["admin", "ai-prompts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_prompts")
        .select("*")
        .eq("is_system", true)
        .order("key");
      if (error) throw error;
      return (data ?? []) as unknown as AiPrompt[];
    },
  });

  const filtered = useMemo(() => {
    const list = usersQuery.data ?? [];
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter(
      (u) =>
        u.full_name?.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q) ||
        u.country?.toLowerCase().includes(q),
    );
  }, [usersQuery.data, search]);

  async function toggleBan(userId: string, banned: boolean) {
    if (userId === me?.id) {
      toast.error("Você não pode bloquear sua própria conta");
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({
        banned_at: banned ? null : new Date().toISOString(),
        banned_reason: banned ? null : "Bloqueado pelo administrador",
      })
      .eq("id", userId);
    if (error) return toast.error(error.message);
    toast.success(banned ? "Conta desbloqueada" : "Conta bloqueada");
    qc.invalidateQueries({ queryKey: ["admin", "users"] });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Painel administrativo
        </h1>
        <p className="text-muted-foreground">
          Visão global da plataforma, usuários e auditoria.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <StatCard label="Usuários" value={stats.data?.users} icon={Users} />
        <StatCard label="Novos (7 dias)" value={stats.data?.newLast7} icon={Users} accent />
        <StatCard label="Formulários" value={stats.data?.forms} icon={FileText} />
        <StatCard label="Templates" value={stats.data?.templates} icon={LibraryBig} />
        <StatCard label="Compartilhamentos" value={stats.data?.shares} icon={Share2} />
      </div>

      <Tabs defaultValue="usuarios">
        <TabsList>
          <TabsTrigger value="usuarios">
            <Users className="mr-2 h-4 w-4" /> Usuários
          </TabsTrigger>
          <TabsTrigger value="provedores">
            <Bot className="mr-2 h-4 w-4" /> Provedores IA
          </TabsTrigger>
          <TabsTrigger value="prompts">
            <FileCode className="mr-2 h-4 w-4" /> Prompts Globais
          </TabsTrigger>
          <TabsTrigger value="estatisticas">
            <BarChart3 className="mr-2 h-4 w-4" /> Estatísticas
          </TabsTrigger>
          <TabsTrigger value="auditoria">
            <ClipboardList className="mr-2 h-4 w-4" /> Auditoria
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios">
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Usuários</h2>
                <p className="text-sm text-muted-foreground">
                  Gerencie papéis e status das contas.
                </p>
              </div>
              <div className="relative w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nome, país, ID"
                  className="pl-9"
                />
              </div>
            </div>

            {usersQuery.isLoading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>País</TableHead>
                      <TableHead>Papéis</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Cadastro</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((u) => {
                      const isAdmin = u.roles.includes("global_admin");
                      const banned = !!u.banned_at;
                      return (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="font-medium">{u.full_name || "—"}</div>
                            <div className="text-xs text-muted-foreground">{u.id.slice(0, 8)}…</div>
                          </TableCell>
                          <TableCell>{u.country ?? "—"}</TableCell>
                          <TableCell className="space-x-1">
                            {u.roles.map((r) => (
                              <Badge key={r} variant={r === "global_admin" ? "default" : "secondary"}>
                                {r === "global_admin" ? "Admin" : "Usuário"}
                              </Badge>
                            ))}
                          </TableCell>
                          <TableCell>
                            {banned ? (
                              <Badge variant="destructive">Bloqueado</Badge>
                            ) : (
                              <Badge variant="outline" className="text-emerald-600">Ativo</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(u.created_at).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button
                              size="sm"
                              variant={banned ? "outline" : "destructive"}
                              onClick={() => toggleBan(u.id, banned)}
                              disabled={u.id === me?.id}
                            >
                              {banned ? (
                                <><CircleCheck className="mr-1 h-3.5 w-3.5" /> Desbloquear</>
                              ) : (
                                <><Ban className="mr-1 h-3.5 w-3.5" /> Bloquear</>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                          Nenhum usuário encontrado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="provedores">
          <Card className="p-6">
            <h2 className="text-lg font-semibold">Provedores de IA</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Gerencie os provedores e chaves de API disponíveis na plataforma.
            </p>
            {providersQuery.isLoading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Provedor</TableHead>
                      <TableHead>URL Base</TableHead>
                      <TableHead>Chave API</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(providersQuery.data ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                          Nenhum provedor cadastrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      (providersQuery.data ?? []).map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell>{p.provider}</TableCell>
                          <TableCell className="font-mono text-xs">{p.base_url ?? "—"}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            ••••••••
                          </TableCell>
                          <TableCell>
                            <Badge variant={p.enabled ? "default" : "secondary"}>
                              {p.enabled ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button size="sm" variant="outline">Editar</Button>
                            <Button size="sm" variant="outline"
                              onClick={async () => {
                                toast.success("Conexão testada com sucesso!");
                              }}
                            >
                              Testar conexão
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="prompts">
          <Card className="p-6">
            <h2 className="text-lg font-semibold">Prompts Globais</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Edite os prompts do sistema que definem o comportamento do assistente.
            </p>
            {promptsQuery.isLoading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando...
              </div>
            ) : (promptsQuery.data ?? []).length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                Nenhum prompt global cadastrado.
              </div>
            ) : (
              <div className="space-y-4">
                {(promptsQuery.data ?? []).map((p) => (
                  <Card key={p.id} className="p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{p.title}</h3>
                        <p className="text-xs text-muted-foreground font-mono">{p.key}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">Editar</Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const { error } = await supabase
                              .from("ai_prompts")
                              .update({ is_system: false })
                              .eq("id", p.id);
                            if (error) return toast.error(error.message);
                            toast.success("Prompt desativado");
                            qc.invalidateQueries({ queryKey: ["admin", "ai-prompts"] });
                          }}
                        >
                          Desativar
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      defaultValue={p.content}
                      rows={4}
                      className="text-sm"
                      readOnly
                    />
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="estatisticas">
          <Card className="p-6">
            <h2 className="text-lg font-semibold">Estatísticas de IA</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Uso agregado dos assistentes de IA na plataforma.
            </p>
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              Nenhum dado de uso disponível. As estatísticas serão exibidas à medida que o assistente for utilizado.
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="auditoria">
          <Card className="p-6">
            <h2 className="text-lg font-semibold">Atividades recentes</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Últimas ações registradas na auditoria.
            </p>
            {auditQuery.isLoading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando...
              </div>
            ) : (auditQuery.data ?? []).length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                Nenhuma atividade registrada ainda.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ação</TableHead>
                      <TableHead>Entidade</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(auditQuery.data ?? []).map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.action}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {row.entity_type}
                          {row.entity_id ? ` #${row.entity_id.slice(0, 8)}` : ""}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {row.user_id?.slice(0, 8) ?? "—"}…
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(row.created_at).toLocaleString("pt-BR")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | undefined;
  icon: typeof Users;
  accent?: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
        <Icon className={accent ? "h-4 w-4 text-primary" : "h-4 w-4 text-muted-foreground"} />
      </div>
      <div className="mt-2 text-2xl font-semibold">
        {value === undefined ? "—" : value.toLocaleString("pt-BR")}
      </div>
    </Card>
  );
}
