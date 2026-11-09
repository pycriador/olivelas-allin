import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Upload, FileText, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { knowledgeService } from "@/modules/knowledge/service";

export const Route = createFileRoute("/_app/knowledge/import")({
  head: () => ({ meta: [{ title: "Importar — Knowledge — ServiceForge" }] }),
  component: KnowledgeImport,
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

function KnowledgeImport() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: categories } = useQuery({
    queryKey: ["knowledge-categories"],
    queryFn: () => knowledgeService.listCategories(),
  });
  const [form, setForm] = useState({
    type: "procedure", title: "", content: "", summary: "",
    brand: "", model: "", keywords: "", categoryName: "Procedimentos Técnicos",
  });

  const importMut = useMutation({
    mutationFn: () => {
      const cat = categories?.find(
        (c) => c.name.toLowerCase() === form.categoryName.toLowerCase()
      );
      return knowledgeService.importArticle({
        type: form.type as any,
        title: form.title,
        content: form.content,
        summary: form.summary,
        brand: form.brand || undefined,
        model: form.model || undefined,
        keywords: form.keywords.split(",").map((k) => k.trim()).filter(Boolean),
        categoryId: cat?.id ?? "general",
        categoryName: form.categoryName,
        author: "Admin",
      }, "Admin");
    },
    onSuccess: (article) => {
      qc.invalidateQueries({ queryKey: ["knowledge-articles"] });
      toast("Documento importado com sucesso");
      navigate({ to: "/knowledge/$id", params: { id: article.id } } as any);
    },
    onError: () => toast("Erro ao importar documento"),
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Importar Documento</h2>
        <p className="text-sm text-muted-foreground">Adicione um novo documento à base de conhecimento</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {typeOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Categoria</Label>
              <Input value={form.categoryName} onChange={(e) => setForm({ ...form, categoryName: e.target.value })} />
            </div>
          </div>

          <div>
            <Label>Título</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Título do documento" />
          </div>

          <div>
            <Label>Resumo</Label>
            <Textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="Breve resumo do conteúdo" rows={2} />
          </div>

          <div>
            <Label>Conteúdo (Markdown)</Label>
            <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Conteúdo em formato Markdown..." rows={10} className="font-mono text-sm" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Marca</Label>
              <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            </div>
            <div>
              <Label>Modelo</Label>
              <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
            </div>
            <div>
              <Label>Keywords (vírgula)</Label>
              <Input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} />
            </div>
          </div>

          <Button className="w-full" onClick={() => importMut.mutate()} disabled={!form.title || !form.content}>
            <Upload className="mr-2 h-4 w-4" /> Importar Documento
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
