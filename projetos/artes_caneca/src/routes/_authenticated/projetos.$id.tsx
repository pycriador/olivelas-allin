import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Paperclip, Send, Upload, FileText, Image as ImageIcon, Download, Trash2 } from "lucide-react";
import { useAuth, canEdit } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { uploadProjectFile } from "@/lib/storage";
import { PROJECT_STATUS, statusMeta, FILE_KINDS, type FileKind, type ProjectStatus } from "@/lib/projects";

export const Route = createFileRoute("/_authenticated/projetos/$id")({ component: ProjectDetail });

type Project = {
  id: string; name: string; status: string; notes: string | null;
  client_id: string; responsible_user_id: string | null;
  created_at: string; updated_at: string;
};

type Message = {
  id: string; project_id: string; author_id: string; content: string;
  attachment_url: string | null; attachment_name: string | null; attachment_type: string | null;
  created_at: string;
};

type FileRow = {
  id: string; project_id: string; file_url: string; file_name: string;
  file_size: number | null; mime_type: string | null; kind: FileKind;
  uploaded_by: string | null; created_at: string;
};

function ProjectDetail() {
  const { id } = Route.useParams();
  const { role, user } = useAuth();
  const qc = useQueryClient();

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as Project | null;
    },
  });

  const { data: peopleMap } = useQuery({
    queryKey: ["project-people", id],
    enabled: !!project,
    queryFn: async () => {
      const ids = [project!.client_id, project!.responsible_user_id].filter(Boolean) as string[];
      const { data } = await supabase.from("profiles").select("id, full_name, email, avatar_url").in("id", ids);
      return new Map((data ?? []).map((p) => [p.id, p]));
    },
  });

  async function updateStatus(newStatus: string) {
    const { error } = await supabase.from("projects").update({ status: newStatus as ProjectStatus }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status atualizado");
    qc.invalidateQueries({ queryKey: ["project", id] });
    qc.invalidateQueries({ queryKey: ["projects"] });
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando...</p>;
  if (!project) {
    return (
      <div className="space-y-4">
        <p className="text-sm">Projeto não encontrado ou sem permissão.</p>
        <Button asChild variant="outline"><Link to="/projetos"><ArrowLeft className="h-4 w-4" /> Voltar</Link></Button>
      </div>
    );
  }

  const client = peopleMap?.get(project.client_id);
  const responsible = project.responsible_user_id ? peopleMap?.get(project.responsible_user_id) : null;
  const status = statusMeta(project.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm"><Link to="/projetos"><ArrowLeft className="h-4 w-4" /> Projetos</Link></Button>
      </div>

      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-3xl font-display font-semibold tracking-tight">{project.name}</h1>
            <Badge className={status.tone + " border-0"}>{status.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Cliente: {client?.full_name ?? client?.email ?? "—"}
            {responsible && <> · Responsável: {responsible.full_name ?? responsible.email}</>}
          </p>
        </div>
        {canEdit(role) && (
          <Select value={project.status} onValueChange={updateStatus}>
            <SelectTrigger className="md:w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PROJECT_STATUS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </header>

      {project.notes && (
        <Card><CardContent className="p-4 text-sm whitespace-pre-wrap">{project.notes}</CardContent></Card>
      )}

      <Tabs defaultValue="messages">
        <TabsList>
          <TabsTrigger value="messages">Mensagens</TabsTrigger>
          <TabsTrigger value="files">Arquivos</TabsTrigger>
        </TabsList>
        <TabsContent value="messages" className="mt-4">
          <MessagesTab projectId={id} currentUserId={user?.id ?? ""} />
        </TabsContent>
        <TabsContent value="files" className="mt-4">
          <FilesTab projectId={id} canManage={canEdit(role)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MessagesTab({ projectId, currentUserId }: { projectId: string; currentUserId: string }) {
  const qc = useQueryClient();
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages } = useQuery({
    queryKey: ["messages", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_messages").select("*").eq("project_id", projectId).order("created_at", { ascending: true });
      if (error) throw error;
      return data as Message[];
    },
    refetchInterval: 10000,
  });

  const authorIds = Array.from(new Set((messages ?? []).map((m) => m.author_id)));
  const { data: authors } = useQuery({
    queryKey: ["msg-authors", projectId, authorIds.join(",")],
    enabled: authorIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, email, avatar_url").in("id", authorIds);
      return new Map((data ?? []).map((p) => [p.id, p]));
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function send() {
    if (!content.trim() && !file) return;
    setSending(true);
    try {
      let attachment_url: string | null = null;
      let attachment_name: string | null = null;
      let attachment_type: string | null = null;
      if (file) {
        const up = await uploadProjectFile(projectId, file);
        attachment_url = up.signedUrl;
        attachment_name = file.name;
        attachment_type = file.type;
      }
      const { error } = await supabase.from("project_messages").insert({
        project_id: projectId,
        author_id: currentUserId,
        content: content.trim() || (file ? `Enviou ${file.name}` : ""),
        attachment_url, attachment_name, attachment_type,
      });
      if (error) throw error;
      setContent(""); setFile(null);
      qc.invalidateQueries({ queryKey: ["messages", projectId] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao enviar");
    } finally {
      setSending(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div ref={scrollRef} className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {(messages ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma mensagem ainda. Inicie a conversa.</p>
          )}
          {(messages ?? []).map((m) => {
            const author = authors?.get(m.author_id);
            const mine = m.author_id === currentUserId;
            return (
              <div key={m.id} className={`flex gap-3 ${mine ? "flex-row-reverse" : ""}`}>
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                    {(author?.full_name ?? author?.email ?? "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className={`max-w-[75%] rounded-lg p-3 ${mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <div className="flex items-center gap-2 text-xs opacity-80 mb-1">
                    <span className="font-medium">{author?.full_name ?? author?.email ?? "Usuário"}</span>
                    <span>· {new Date(m.created_at).toLocaleString("pt-BR")}</span>
                  </div>
                  {m.content && <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>}
                  {m.attachment_url && (
                    <a href={m.attachment_url} target="_blank" rel="noreferrer"
                       className="mt-2 flex items-center gap-2 text-xs underline opacity-90">
                      {m.attachment_type?.startsWith("image/") ? <ImageIcon className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                      {m.attachment_name}
                    </a>
                  )}
                  {m.attachment_url && m.attachment_type?.startsWith("image/") && (
                    <img src={m.attachment_url} alt={m.attachment_name ?? ""}
                         className="mt-2 max-h-48 rounded border border-border/50" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="border-t p-3 space-y-2">
          {file && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Paperclip className="h-3 w-3" /> {file.name}
              <Button variant="ghost" size="sm" onClick={() => setFile(null)}>Remover</Button>
            </div>
          )}
          <div className="flex gap-2">
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Escreva uma mensagem..."
                      rows={2} className="resize-none"
                      onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(); }} />
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="icon" asChild>
                <label className="cursor-pointer">
                  <Paperclip className="h-4 w-4" />
                  <input type="file" className="hidden"
                         accept="image/*,.pdf,.doc,.docx"
                         onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                </label>
              </Button>
              <Button onClick={send} disabled={sending} size="icon"><Send className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FilesTab({ projectId, canManage }: { projectId: string; canManage: boolean }) {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [kind, setKind] = useState<FileKind>("documento");

  const { data: files } = useQuery({
    queryKey: ["files", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_files").select("*").eq("project_id", projectId).order("created_at", { ascending: false });
      if (error) throw error;
      return data as FileRow[];
    },
  });

  async function onUpload(f: File | null) {
    if (!f) return;
    setUploading(true);
    try {
      const up = await uploadProjectFile(projectId, f);
      const { error } = await supabase.from("project_files").insert({
        project_id: projectId,
        file_url: up.signedUrl,
        file_name: f.name,
        file_size: f.size,
        mime_type: f.type,
        kind,
      });
      if (error) throw error;
      toast.success("Arquivo enviado");
      qc.invalidateQueries({ queryKey: ["files", projectId] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Remover este arquivo?")) return;
    const { error } = await supabase.from("project_files").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removido");
    qc.invalidateQueries({ queryKey: ["files", projectId] });
  }

  const grouped = FILE_KINDS.map((k) => ({
    kind: k, items: (files ?? []).filter((f) => f.kind === k.value),
  }));

  return (
    <div className="space-y-6">
      {canManage && (
        <Card>
          <CardHeader><CardTitle className="text-base">Enviar arquivo</CardTitle></CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-3">
            <Select value={kind} onValueChange={(v) => setKind(v as FileKind)}>
              <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FILE_KINDS.map((k) => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button asChild disabled={uploading}>
              <label className="cursor-pointer">
                <Upload className="h-4 w-4" />
                {uploading ? "Enviando..." : "Selecionar arquivo"}
                <input type="file" className="hidden"
                       accept="image/*,.pdf,.doc,.docx"
                       onChange={(e) => onUpload(e.target.files?.[0] ?? null)} />
              </label>
            </Button>
          </CardContent>
        </Card>
      )}

      {grouped.map(({ kind: k, items }) => (
        <div key={k.value}>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">{k.label} ({items.length})</h3>
          {items.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum arquivo.</p>
          ) : (
            <div className="grid gap-2">
              {items.map((f) => (
                <Card key={f.id}>
                  <CardContent className="p-3 flex items-center gap-3">
                    {f.mime_type?.startsWith("image/") ? (
                      <img src={f.file_url} alt="" className="h-12 w-12 rounded object-cover border border-border/50" />
                    ) : (
                      <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{f.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {f.file_size ? `${(f.file_size / 1024).toFixed(1)} KB · ` : ""}
                        {new Date(f.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <Button asChild variant="ghost" size="icon">
                      <a href={f.file_url} target="_blank" rel="noreferrer" download><Download className="h-4 w-4" /></a>
                    </Button>
                    {canManage && (
                      <Button variant="ghost" size="icon" onClick={() => remove(f.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
