import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { customerService } from "@/modules/customers/service";
import type { Customer, CustomerObservation } from "@/modules/customers/types";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/service-orders/customers/$id/notes")({
  head: () => ({ meta: [{ title: "Observações — ServiceForge" }] }),
  component: CustomerNotesPage,
});

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function CustomerNotesPage() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [text, setText] = useState("");
  const [category, setCategory] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");

  const { data: customer, isLoading } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => customerService.get(id),
  });

  const observations = useMemo(() =>
    [...(customer?.observations ?? [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  [customer]);

  const addObs = useMutation({
    mutationFn: () => customerService.addObservation(id, { date: new Date().toISOString(), text, category, visibility, userId: "system", userName: "Admin" } as CustomerObservation),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customer", id] }); setText(""); setCategory(""); toast.success("Observação adicionada"); },
    onError: () => toast.error("Erro ao adicionar observação"),
  });

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Carregando...</p></div>;
  if (!customer) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Cliente não encontrado</p></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Observações</h1>
        <p className="text-sm text-muted-foreground">Registre e acompanhe observações sobre o cliente</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Nova Observação</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Texto</Label>
            <textarea className="flex h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={text} onChange={(e) => setText(e.target.value)} placeholder="Descreva a observação..." />
          </div>
          <div className="flex gap-4">
            <div className="space-y-1 flex-1">
              <Label>Categoria</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex: Atendimento, Financeiro" />
            </div>
            <div className="space-y-1">
              <Label>Visibilidade</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={visibility} onChange={(e) => setVisibility(e.target.value as any)}>
                <option value="public">Público</option>
                <option value="private">Privado</option>
              </select>
            </div>
          </div>
          <Button onClick={() => addObs.mutate()} disabled={!text || addObs.isPending}>{addObs.isPending ? "Adicionando..." : "Adicionar Observação"}</Button>
        </CardContent>
      </Card>

      {observations.length === 0 ? (
        <Card><CardContent><p className="py-12 text-center text-sm text-muted-foreground">Nenhuma observação registrada</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {observations.map((obs) => (
            <Card key={obs.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{obs.userName}</span>
                    <Badge variant={obs.visibility === "public" ? "default" : "secondary"} className="text-xs">
                      {obs.visibility === "public" ? "Público" : "Privado"}
                    </Badge>
                    {obs.category && <Badge variant="outline" className="text-xs">{obs.category}</Badge>}
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(obs.date).toLocaleString("pt-BR")}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{obs.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
