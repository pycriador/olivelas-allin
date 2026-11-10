import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listForms,
  createForm,
  deleteForm,
  duplicateForm,
} from "@/modules/form-builder/forms.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus, FileText, MoreHorizontal, Copy, Trash2, Pencil,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/forms")({
  component: FormsList,
});

function FormsList() {
  const list = useServerFn(listForms);
  const create = useServerFn(createForm);
  const dup = useServerFn(duplicateForm);
  const del = useServerFn(deleteForm);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["forms"],
    queryFn: () => list(),
  });

  const createMut = useMutation({
    mutationFn: () => create({ data: { title: "Novo formulário" } }),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ["forms"] });
      navigate({ to: "/app/forms/$id/edit", params: { id: row.id } });
    },
    onError: (e) => toast.error("Falha ao criar", { description: (e as Error).message }),
  });
  const dupMut = useMutation({
    mutationFn: (id: string) => dup({ data: { id } }),
    onSuccess: () => { toast.success("Formulário duplicado"); qc.invalidateQueries({ queryKey: ["forms"] }); },
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("Formulário excluído"); qc.invalidateQueries({ queryKey: ["forms"] }); },
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Formulários</h1>
          <p className="text-muted-foreground">Crie planejamentos, checklists e rotinas totalmente personalizados.</p>
        </div>
        <Button className="bg-gradient-brand text-primary-foreground shadow-elegant"
          onClick={() => createMut.mutate()} disabled={createMut.isPending}>
          <Plus className="mr-2 h-4 w-4" /> Novo formulário
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : !data || data.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FileText className="h-6 w-6" />
          </div>
          <h2 className="font-display text-lg font-semibold">Nenhum formulário ainda</h2>
          <p className="mt-1 text-sm text-muted-foreground">Comece do zero ou parta de um template da biblioteca.</p>
          <Button className="mt-4" onClick={() => createMut.mutate()}>
            <Plus className="mr-2 h-4 w-4" /> Criar meu primeiro
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((f) => (
            <Card key={f.id} className="group flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link to="/app/forms/$id/edit" params={{ id: f.id }}
                    className="line-clamp-2 font-display text-lg font-semibold hover:underline">
                    {f.emoji ? `${f.emoji} ` : ""}{f.title}
                  </Link>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {f.description ?? "Sem descrição"}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate({ to: "/app/forms/$id/edit", params: { id: f.id } })}>
                      <Pencil className="mr-2 h-4 w-4" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => dupMut.mutate(f.id)}>
                      <Copy className="mr-2 h-4 w-4" /> Duplicar
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir formulário?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação é permanente. Todos os dados associados serão removidos.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => delMut.mutate(f.id)}
                            className="bg-destructive text-destructive-foreground">
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                <Badge variant="secondary" className="capitalize">{f.status}</Badge>
                <Badge variant="outline" className="capitalize">{f.privacy}</Badge>
                <span className="ml-auto text-xs text-muted-foreground">
                  {new Date(f.updated_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}