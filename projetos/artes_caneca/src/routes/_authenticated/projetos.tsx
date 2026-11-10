import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Plus, Search, ArrowUpRight } from "lucide-react";
import { useAuth, canEdit } from "@/hooks/use-auth";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { PROJECT_STATUS, statusMeta } from "@/lib/projects";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/projetos")({ component: Projetos });

type Project = {
  id: string; name: string; status: string; notes: string | null;
  client_id: string; responsible_user_id: string | null;
  updated_at: string; created_at: string;
};

function Projetos() {
  const { role, user } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as Project[];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["profiles-for-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: canEdit(role),
  });

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const filtered = (projects ?? []).filter((p) => {
    const matchQ = p.name.toLowerCase().includes(q.toLowerCase()) || (p.notes ?? "").toLowerCase().includes(q.toLowerCase());
    const matchS = statusFilter === "all" || p.status === statusFilter;
    return matchQ && matchS;
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-display font-semibold tracking-tight">Projetos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhe o andamento de cada projeto, mensagens e arquivos.
          </p>
        </div>
        {canEdit(role) && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4" />Novo projeto</Button>
            </DialogTrigger>
            <NewProjectDialog
              profiles={profiles ?? []}
              currentUserId={user?.id ?? ""}
              onCreated={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["projects"] }); }}
            />
          </Dialog>
        )}
      </header>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar projetos..." className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {PROJECT_STATUS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando projetos...</p>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 flex flex-col items-center text-center gap-2">
          <Briefcase className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium">Nenhum projeto encontrado</p>
          <p className="text-sm text-muted-foreground">
            {canEdit(role) ? "Crie um novo projeto para começar." : "Você ainda não tem projetos."}
          </p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((p) => {
            const status = statusMeta(p.status);
            const client = profileMap.get(p.client_id);
            const responsible = p.responsible_user_id ? profileMap.get(p.responsible_user_id) : null;
            return (
              <Link key={p.id} to="/projetos/$id" params={{ id: p.id }} className="group">
                <Card className="transition-smooth group-hover:border-primary/40 group-hover:shadow-elegant">
                  <CardContent className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-medium truncate">{p.name}</h3>
                        <Badge className={status.tone + " border-0"}>{status.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Cliente: {client?.full_name ?? client?.email ?? "—"}
                        {responsible && <> · Responsável: {responsible.full_name ?? responsible.email}</>}
                      </p>
                      {p.notes && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{p.notes}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">Atualizado</p>
                      <p className="text-xs">{new Date(p.updated_at).toLocaleDateString("pt-BR")}</p>
                      <ArrowUpRight className="h-4 w-4 mt-2 ml-auto text-muted-foreground group-hover:text-primary" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NewProjectDialog({
  profiles, currentUserId, onCreated,
}: { profiles: { id: string; full_name: string | null; email: string | null }[]; currentUserId: string; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!name.trim() || !clientId) return toast.error("Nome e cliente são obrigatórios");
    setLoading(true);
    const { error } = await supabase.from("projects").insert({
      name: name.trim(),
      client_id: clientId,
      responsible_user_id: currentUserId,
      notes: notes.trim() || null,
      created_by: currentUserId,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Projeto criado");
    setName(""); setClientId(""); setNotes("");
    onCreated();
  }

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Novo projeto</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>Nome do projeto</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Coleção Aniversário 50 anos" />
        </div>
        <div>
          <Label>Cliente</Label>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
            <SelectContent>
              {profiles.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.full_name ?? p.email ?? p.id.slice(0, 8)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Observações</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={submit} disabled={loading}>{loading ? "Criando..." : "Criar projeto"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}
