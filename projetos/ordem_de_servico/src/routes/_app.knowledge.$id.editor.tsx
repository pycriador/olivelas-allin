import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ArrowLeft, Save, Send, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { knowledgeService } from "@/modules/knowledge/service";

export const Route = createFileRoute("/_app/knowledge/$id/editor")({
  head: () => ({ meta: [{ title: "Editor — Knowledge — ServiceForge" }] }),
  component: KnowledgeEditor,
});

const typeOptions = [
  { value: "procedure", label: "Procedimento Técnico" },
  { value: "manual", label: "Manual" },
  { value: "diagram", label: "Diagrama" },
  { value: "firmware", label: "Firmware" },
  { value: "driver", label: "Driver" },
  { value: "tutorial", label: "Tutorial" },
  { value: "solution", label: "Solução Conhecida" },
  { value: "defect", label: "Defeito Recorrente" },
  { value: "error_code", label: "Código de Erro" },
  { value: "faq", label: "FAQ" },
  { value: "bulletin", label: "Boletim Técnico" },
  { value: "alert", label: "Alerta Técnico" },
];

function KnowledgeEditor() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isNew = id === "new";

  const { data: article } = useQuery({
    queryKey: ["knowledge-article", id],
    queryFn: () => knowledgeService.get(id),
    enabled: !isNew,
  });

  const [form, setForm] = useState({
    type: "procedure", title: "", summary: "", content: "",
    categoryName: "Procedimentos Técnicos", brand: "", model: "",
    keywords: "", status: "draft", difficulty: "intermediate",
    estimatedTime: 60,
  });

  const [keywordList, setKeywordList] = useState<string[]>([]);

  useEffect(() => {
    if (article && !isNew) {
      setForm({
        type: article.type, title: article.title, summary: article.summary,
        content: article.content, categoryName: article.categoryName,
        brand: article.brand ?? "", model: article.model ?? "",
        keywords: article.keywords.join(", "), status: article.status,
        difficulty: article.difficulty, estimatedTime: article.estimatedTime ?? 60,
      });
      setKeywordList(article.keywords);
    }
  }, [article, isNew]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const data = {
        type: form.type as any, title: form.title, summary: form.summary,
        content: form.content, categoryName: form.categoryName,
        brand: form.brand || undefined, model: form.model || undefined,
        keywords: keywordList, status: form.status as any,
        difficulty: form.difficulty as any, estimatedTime: form.estimatedTime,
      };
      if (isNew) {
        return knowledgeService.create({
          ...data, categoryId: "editor", language: "pt-BR",
          author: "Admin", authorId: "admin", tags: [],
          attachments: [], relationships: [], comments: [],
          manufacturer: form.brand || undefined,
          equipmentTypeId: undefined, equipmentTypeName: undefined,
          subcategory: undefined, aiGenerated: false,
          reviewer: undefined, reviewerId: undefined,
          tools: [], parts: [], prerequisites: [], checklist: [],
          steps: [], images: [], videos: [],
          aiSummary: undefined, aiKeywords: undefined,
        }, "Admin");
      } else {
        return knowledgeService.update(id, data, "Edição", "Admin");
      }
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["knowledge-articles"] });
      qc.invalidateQueries({ queryKey: ["knowledge-article", isNew ? (result as any).id : id] });
      toast(isNew ? "Artigo criado" : "Artigo atualizado");
      navigate({ to: "/knowledge/$id", params: { id: (result as any)?.id ?? id } } as any);
    },
    onError: () => toast("Erro ao salvar"),
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: isNew ? "/knowledge" : "/knowledge/$id", params: isNew ? {} : { id } } as any)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold">{isNew ? "Novo Artigo" : "Editar Artigo"}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => saveMut.mutate()}>
            <Save className="mr-2 h-4 w-4" />Salvar Rascunho
          </Button>
          <Button onClick={() => { setForm({ ...form, status: "review" }); setTimeout(() => saveMut.mutate(), 50); }}>
            <Send className="mr-2 h-4 w-4" />Enviar para Revisão
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{typeOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Dificuldade</Label>
              <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Iniciante</SelectItem>
                  <SelectItem value="intermediate">Intermediário</SelectItem>
                  <SelectItem value="advanced">Avançado</SelectItem>
                  <SelectItem value="expert">Especialista</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tempo Estimado (min)</Label>
              <Input type="number" value={form.estimatedTime} onChange={(e) => setForm({ ...form, estimatedTime: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <div><Label>Título</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Título do artigo" /></div>
          <div><Label>Resumo</Label><Textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} rows={2} /></div>
          <div><Label>Conteúdo (Markdown)</Label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={16} className="font-mono text-sm" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Marca</Label><Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></div>
            <div><Label>Modelo</Label><Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></div>
          </div>
          <div>
            <Label>Keywords</Label>
            <div className="flex gap-2 mb-2">
              <Input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter" && form.keywords.trim()) { e.preventDefault(); setKeywordList([...keywordList, form.keywords.trim()]); setForm({ ...form, keywords: "" }); } }}
                placeholder="Digite e pressione Enter" />
              <Button variant="outline" size="sm" onClick={() => { if (form.keywords.trim()) { setKeywordList([...keywordList, form.keywords.trim()]); setForm({ ...form, keywords: "" }); } }}><Plus className="h-4 w-4" /></Button>
            </div>
            {keywordList.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {keywordList.map((kw, i) => (
                  <Badge key={i} variant="secondary" className="cursor-pointer gap-1" onClick={() => setKeywordList(keywordList.filter((_, j) => j !== i))}>
                    {kw}<X className="h-3 w-3" />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
