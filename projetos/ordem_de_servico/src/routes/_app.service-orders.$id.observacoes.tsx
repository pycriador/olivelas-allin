import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { serviceOrderService } from "@/modules/service-orders/service";

export const Route = createFileRoute("/_app/service-orders/$id/observacoes")({
  head: () => ({ meta: [{ title: "Observações — ServiceForge" }] }),
  component: ObservacoesTab,
});

const categories = [
  { value: "interna", label: "Interna", color: "bg-blue-100 text-blue-700" },
  { value: "cliente", label: "Cliente", color: "bg-green-100 text-green-700" },
  { value: "tecnica", label: "Técnica", color: "bg-purple-100 text-purple-700" },
  { value: "privada", label: "Privada", color: "bg-red-100 text-red-700" },
];

function ObservacoesTab() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [category, setCategory] = useState("interna");

  const { data: so, isLoading } = useQuery({
    queryKey: ["service-order", id],
    queryFn: () => serviceOrderService.get(id),
  });

  const addObs = useMutation({
    mutationFn: () => serviceOrderService.addComment(id, {
      author: "Admin",
      authorId: "admin",
      text: `[${categories.find((c) => c.value === category)?.label ?? category}] ${text}`,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["service-order", id] });
      setText("");
      toast("Observação adicionada");
    },
    onError: () => toast("Erro ao adicionar observação"),
  });

  const removeObs = useMutation({
    mutationFn: (commentId: string) => serviceOrderService.removeComment(id, commentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["service-order", id] });
      toast("Observação removida");
    },
    onError: () => toast("Erro ao remover observação"),
  });

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Carregando...</p></div>;

  const observations = so?.comments ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Observações</h2>
        <Badge variant="secondary">{observations.length}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Nova Observação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Categoria</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Textarea
              placeholder="Digite sua observação..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="flex-1"
              rows={3}
            />
            <Button size="sm" disabled={!text.trim()} onClick={() => addObs.mutate()} className="self-end">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {observations.length === 0 ? (
        <Card><CardContent><p className="py-8 text-center text-sm text-muted-foreground">Nenhuma observação registrada.</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {[...observations].reverse().map((obs) => {
            const catMatch = obs.text.match(/^\[([^\]]+)\]\s*/);
            const catValue = catMatch ? categories.find((c) => c.label === catMatch[1] || c.value === catMatch[1]) : null;
            const displayText = catMatch ? obs.text.slice(catMatch[0].length) : obs.text;
            const catColor = catValue?.color ?? "bg-gray-100 text-gray-700";

            return (
              <Card key={obs.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {catValue && <Badge className={catColor} variant="outline">{catValue.label}</Badge>}
                      <span className="text-sm font-medium">{obs.author}</span>
                      <span className="text-xs text-muted-foreground">{new Date(obs.createdAt).toLocaleString("pt-BR")}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => removeObs.mutate(obs.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{displayText}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
