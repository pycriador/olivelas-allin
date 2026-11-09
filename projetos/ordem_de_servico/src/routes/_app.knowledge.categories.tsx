import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Tags, Plus, Pencil, Trash2, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { knowledgeService } from "@/modules/knowledge/service";

export const Route = createFileRoute("/_app/knowledge/categories")({
  head: () => ({ meta: [{ title: "Categorias — Knowledge — ServiceForge" }] }),
  component: KnowledgeCategories,
});

function KnowledgeCategories() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", icon: "FolderOpen", color: "#3b82f6", order: 0 });

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["knowledge-categories"],
    queryFn: () => knowledgeService.listCategories(),
  });

  const createCat = useMutation({
    mutationFn: () => knowledgeService.createCategory({ ...form, active: true }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["knowledge-categories"] }); setOpen(false); setForm({ name: "", description: "", icon: "FolderOpen", color: "#3b82f6", order: 0 }); toast("Categoria criada"); },
    onError: () => toast("Erro ao criar categoria"),
  });

  const removeCat = useMutation({
    mutationFn: (id: string) => knowledgeService.removeCategory(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["knowledge-categories"] }); toast("Categoria removida"); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Categorias</h2>
          <p className="text-sm text-muted-foreground">{categories.length} categorias cadastradas</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="mr-2 h-4 w-4" />Nova Categoria</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Categoria</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Cor</Label><Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></div>
                <div><Label>Ordem</Label><Input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })} /></div>
              </div>
              <Button className="w-full" onClick={() => createCat.mutate()}>Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-sm text-muted-foreground">Carregando...</div>
      ) : categories.length === 0 ? (
        <Card><CardContent><p className="py-12 text-center text-sm text-muted-foreground">Nenhuma categoria cadastrada</p></CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Card key={cat.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: cat.color + "20", color: cat.color }}>
                      <FolderOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">{cat.name}</h3>
                      <p className="text-xs text-muted-foreground">{cat.description}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => removeCat.mutate(cat.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{cat.articleCount ?? 0} documentos</span>
                  <Badge variant="outline" style={{ borderColor: cat.color, color: cat.color }}>{cat.order}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
