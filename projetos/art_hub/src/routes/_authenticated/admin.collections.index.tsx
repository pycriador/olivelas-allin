import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Copy, MoreHorizontal, Pencil, Plus, Trash2, Palette } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/page-header";
import { DataTable, type Column } from "@/components/common/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { StoredImage } from "@/components/common/stored-image";
import { collectionsRepo, type CollectionRow } from "@/lib/repositories/collections";
import { queryKeys } from "@/lib/query-keys";


export const Route = createFileRoute("/_authenticated/admin/collections/")({
  component: CollectionsList,
});

function CollectionsList() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<string>("display_order");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");
  const [toDelete, setToDelete] = useState<CollectionRow | null>(null);

  const pageSize = 10;
  const listKey = queryKeys.collections.list({ search, page, sort, direction });

  const { data: listData, isLoading: listLoading, isError: listError } = useQuery({
    queryKey: listKey,
    queryFn: () =>
      collectionsRepo.listAdmin({
        search,
        page,
        pageSize,
        sort: sort as keyof CollectionRow,
        direction,
      }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => collectionsRepo.remove(id),
    onSuccess: () => {
      toast.success("Coleção excluída");
      qc.invalidateQueries({ queryKey: queryKeys.collections.all });
      setToDelete(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao excluir"),
  });

  const duplicateMut = useMutation({
    mutationFn: async (row: CollectionRow) => {
      const baseSlug = `${row.slug}-copia`;
      let slug = baseSlug;
      let n = 1;
      while (await collectionsRepo.getBySlug(slug)) {
        n += 1;
        slug = `${baseSlug}-${n}`;
      }
      return collectionsRepo.create({
        name: `${row.name} (cópia)`,
        slug,
        description: row.description,
        cover_image: row.cover_image,
        banner_image: row.banner_image,
        display_order: row.display_order,
        status: "draft",
      });
    },
    onSuccess: () => {
      toast.success("Coleção duplicada");
      qc.invalidateQueries({ queryKey: queryKeys.collections.all });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const columns: Column<CollectionRow>[] = [
    {
      key: "cover",
      header: "",
      className: "w-14",
      cell: (r) => (
        <div className="h-10 w-10 overflow-hidden rounded-md bg-surface-muted">
          <StoredImage stored={r.cover_image} alt={r.name} />
        </div>
      ),
    },
    { key: "name", header: "Nome", sortable: true, cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "slug", header: "Slug", cell: (r) => <code className="text-xs text-muted-foreground">/{r.slug}</code> },
    { key: "display_order", header: "Ordem", sortable: true, cell: (r) => r.display_order },
    {
      key: "status",
      header: "Status",
      cell: (r) => <Badge variant={r.status === "active" ? "default" : "secondary"}>{r.status}</Badge>,
    },
    {
      key: "actions",
      header: "",
      className: "w-12 text-right",
      cell: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate({ to: "/admin/collections/$id", params: { id: r.id } })}>
              <Pencil className="mr-2 h-4 w-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => duplicateMut.mutate(r)}>
              <Copy className="mr-2 h-4 w-4" /> Duplicar
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => setToDelete(r)}>
              <Trash2 className="mr-2 h-4 w-4" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Coleções"
        description="Organize as artes por coleções temáticas."
        actions={
          <Button asChild>
            <Link to="/admin/collections/new">
              <Plus className="mr-1 h-4 w-4" /> Nova coleção
            </Link>
          </Button>
        }
      />
      {listError ? (
        <EmptyState icon={Palette} title="Erro ao carregar" description="Não foi possível carregar as coleções. Tente novamente." />
      ) : (
      <DataTable
        data={listData?.rows ?? []}
        total={listData?.total ?? 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        columns={columns}
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Buscar coleção…"
        sort={sort}
        direction={direction}
        onSortChange={(s, d) => {
          setSort(s);
          setDirection(d);
        }}
        loading={listLoading}
        rowKey={(r) => r.id}
        emptyTitle="Nenhuma coleção ainda"
        emptyDescription="Crie sua primeira coleção para começar."
        emptyAction={
          <Button asChild>
            <Link to="/admin/collections/new">
              <Plus className="mr-1 h-4 w-4" /> Nova coleção
            </Link>
          </Button>
        }
      />
      )}

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`Excluir "${toDelete?.name ?? ""}"?`}
        description="Todas as artes vinculadas a esta coleção também serão excluídas."
        destructive
        confirmLabel="Excluir"
        loading={deleteMut.isPending}
        onConfirm={() => {
          if (toDelete) deleteMut.mutate(toDelete.id);
        }}
      />


    </div>
  );
}
