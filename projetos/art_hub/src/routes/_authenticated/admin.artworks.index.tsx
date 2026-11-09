import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Copy, MoreHorizontal, Pencil, Plus, Trash2, Palette, Sparkles, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/page-header";
import { DataTable, type Column } from "@/components/common/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { StoredImage } from "@/components/common/stored-image";
import { artworksRepo, type ArtworkWithCollection } from "@/lib/repositories/artworks";
import { collectionsRepo } from "@/lib/repositories/collections";
import { analyzeArtworks } from "@/lib/ai/analyze-artwork.functions";
import { queryKeys } from "@/lib/query-keys";

export const Route = createFileRoute("/_authenticated/admin/artworks/")({
  component: ArtworksList,
});

function ArtworksList() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [sort, setSort] = useState<string>("created_at");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [toDelete, setToDelete] = useState<ArtworkWithCollection | null>(null);
  const [toDeleteBatch, setToDeleteBatch] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const pageSize = 10;

  const analyze = useServerFn(analyzeArtworks);

  const collections = useQuery({
    queryKey: queryKeys.collections.list({ sort: "name", direction: "asc" }),
    queryFn: () => collectionsRepo.listAdmin({ pageSize: 200, sort: "name", direction: "asc" }),
  });

  const { data: listData, isLoading: listLoading, isError: listError } = useQuery({
    queryKey: queryKeys.artworks.list({ search, page, collectionId, sort, direction }),
    queryFn: () =>
      artworksRepo.listAdmin({
        search,
        page,
        pageSize,
        collectionId,
        sort: sort as "created_at" | "title",
        direction,
      }),
  });

  const rows = listData?.rows ?? [];

  const allSelected = rows.length > 0 && selected.size === rows.length;
  const someSelected = selected.size > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(rows.map((r) => r.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const deleteMut = useMutation({
    mutationFn: (id: string) => artworksRepo.remove(id),
    onSuccess: () => {
      toast.success("Arte excluída");
      qc.invalidateQueries({ queryKey: queryKeys.artworks.all });
      setToDelete(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const deleteBatchMut = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await artworksRepo.remove(id);
      }
    },
    onSuccess: (_data, ids) => {
      toast.success(`${ids.length} arte(s) excluída(s)`);
      qc.invalidateQueries({ queryKey: queryKeys.artworks.all });
      setSelected(new Set());
      setToDeleteBatch(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const duplicateMut = useMutation({
    mutationFn: (row: ArtworkWithCollection) =>
      artworksRepo.create({
        title: `${row.title} (cópia)`,
        code: row.code ? `${row.code}-copy` : null,
        collection_id: row.collection_id,
        description: row.description,
        image_url: row.image_url,
        status: "draft",
      }),
    onSuccess: () => {
      toast.success("Arte duplicada");
      qc.invalidateQueries({ queryKey: queryKeys.artworks.all });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const duplicateBatchMut = useMutation({
    mutationFn: async (ids: string[]) => {
      const toDup = rows.filter((r) => ids.includes(r.id));
      for (const row of toDup) {
        await artworksRepo.create({
          title: `${row.title} (cópia)`,
          code: row.code ? `${row.code}-copy` : null,
          collection_id: row.collection_id,
          description: row.description,
          image_url: row.image_url,
          status: "draft",
        });
      }
    },
    onSuccess: (_data, ids) => {
      toast.success(`${ids.length} arte(s) duplicada(s)`);
      qc.invalidateQueries({ queryKey: queryKeys.artworks.all });
      setSelected(new Set());
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const [processingOpen, setProcessingOpen] = useState(false);
  const [processingResults, setProcessingResults] = useState<Map<string, "pending" | "processing" | "done" | "error">>(new Map());

  const reprocessAIMut = useMutation({
    mutationFn: async (ids: string[]) => {
      const processing = new Map<string, "pending" | "processing" | "done" | "error">();
      ids.forEach((id) => processing.set(id, "processing"));
      setProcessingResults(processing);
      const result = await analyze({ data: { artworkIds: ids } });
      const completed = new Map<string, "pending" | "processing" | "done" | "error">();
      for (const o of result.outcomes) {
        completed.set(o.artworkId, o.ok ? "done" : "error");
      }
      setProcessingResults(completed);
      return { outcomes: result.outcomes };
    },
    onSuccess: ({ outcomes }) => {
      const ok = outcomes.filter((o) => o.ok).length;
      const fail = outcomes.filter((o) => !o.ok).length;
      qc.invalidateQueries({ queryKey: queryKeys.artworks.all });
      qc.invalidateQueries({ queryKey: queryKeys.ai.history() });
      setSelected(new Set());
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : "Erro");
      setProcessingOpen(false);
    },
  });

  const selectedArtworks = useMemo(
    () => rows.filter((r) => selected.has(r.id)),
    [rows, selected],
  );

  const handleReprocess = () => {
    const ids = Array.from(selected);
    const initial = new Map<string, "pending" | "processing" | "done" | "error">();
    ids.forEach((id) => initial.set(id, "pending"));
    setProcessingResults(initial);
    setProcessingOpen(true);
    reprocessAIMut.mutate(ids);
  };

  const batchActions = useMemo(() => {
    if (!someSelected) return null;
    const ids = Array.from(selected);
    return (
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleReprocess}
          disabled={reprocessAIMut.isPending}
        >
          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          Reprocessar IA
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => duplicateBatchMut.mutate(ids)}
          disabled={duplicateBatchMut.isPending}
        >
          <Copy className="mr-1.5 h-3.5 w-3.5" />
          Duplicar
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-destructive hover:text-destructive"
          onClick={() => setToDeleteBatch(true)}
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Excluir
        </Button>
      </div>
    );
  }, [someSelected, selected, reprocessAIMut, duplicateBatchMut]);

  const columns: Column<ArtworkWithCollection>[] = [
    {
      key: "select",
      header: "",
      className: "w-10",
      cell: (r) => (
        <label className="flex cursor-pointer items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selected.has(r.id)}
            onChange={() => toggleOne(r.id)}
            className="h-4 w-4 rounded border-border accent-primary"
          />
        </label>
      ),
    },
    {
      key: "image",
      header: "",
      className: "w-14",
      cell: (r) => (
        <div className="h-10 w-10 overflow-hidden rounded-md bg-surface-muted">
          <StoredImage stored={r.image_url} alt={r.title} />
        </div>
      ),
    },
    {
      key: "title",
      header: "Título",
      sortable: true,
      cell: (r) => (
        <button
          type="button"
          onClick={() => navigate({ to: "/admin/artworks/$id", params: { id: r.id } })}
          className="font-medium text-foreground hover:text-primary hover:underline"
        >
          {r.title}
        </button>
      ),
    },
    { key: "code", header: "Código", cell: (r) => (r.code ? <code className="text-xs">#{r.code}</code> : "—") },
    { key: "collection", header: "Coleção", cell: (r) => r.collection?.name ?? "—" },
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
            <DropdownMenuItem onClick={() => navigate({ to: "/admin/artworks/$id", params: { id: r.id } })}>
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
        title="Artes"
        description="Todas as artes cadastradas."
        actions={
          <Button asChild>
            <Link to="/admin/artworks/new">
              <Plus className="mr-1 h-4 w-4" /> Nova arte
            </Link>
          </Button>
        }
      />

      {someSelected ? (
        <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <span className="text-muted-foreground">{selected.size} selecionada(s)</span>
          </label>
          <div className="ml-auto flex items-center gap-2">{batchActions}</div>
        </div>
      ) : null}

      {listError ? (
        <EmptyState icon={Palette} title="Erro ao carregar" description="Não foi possível carregar as artes. Tente novamente." />
      ) : (
      <DataTable
        data={rows}
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
        searchPlaceholder="Buscar por título ou código…"
        sort={sort}
        direction={direction}
        onSortChange={(s, d) => {
          setSort(s);
          setDirection(d);
        }}
        loading={listLoading}
        rowKey={(r) => r.id}
        toolbar={
          <div className="flex items-center gap-2">
            {someSelected ? null : (
              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                Selecionar todos
              </label>
            )}
            <Select
              value={collectionId ?? "all"}
              onValueChange={(v) => {
                setCollectionId(v === "all" ? null : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Todas as coleções" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as coleções</SelectItem>
                {(collections.data?.rows ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
        emptyTitle="Nenhuma arte cadastrada"
        emptyAction={
          <Button asChild>
            <Link to="/admin/artworks/new">
              <Plus className="mr-1 h-4 w-4" /> Nova arte
            </Link>
          </Button>
        }
      />
      )}

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`Excluir "${toDelete?.title ?? ""}"?`}
        destructive
        confirmLabel="Excluir"
        loading={deleteMut.isPending}
        onConfirm={() => {
          if (toDelete) deleteMut.mutate(toDelete.id);
        }}
      />

      <ConfirmDialog
        open={toDeleteBatch}
        onOpenChange={(o) => !o && setToDeleteBatch(false)}
        title={`Excluir ${selected.size} arte(s)?`}
        description="Esta ação não pode ser desfeita."
        destructive
        confirmLabel="Excluir"
        loading={deleteBatchMut.isPending}
        onConfirm={() => deleteBatchMut.mutate(Array.from(selected))}
      />

      <Dialog open={processingOpen} onOpenChange={(o) => { if (!o && !reprocessAIMut.isPending) setProcessingOpen(false); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Reprocessando artes</DialogTitle>
            <DialogDescription>
              {reprocessAIMut.isPending
                ? "Aguardando conclusão da análise por IA…"
                : `${selectedArtworks.filter((a) => processingResults.get(a.id) === "done").length} de ${selectedArtworks.length} concluídas`}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {selectedArtworks.map((a) => {
              const st = processingResults.get(a.id);
              return (
                <div key={a.id} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
                  <div className="h-8 w-8 shrink-0 overflow-hidden rounded-md bg-surface-muted">
                    <StoredImage stored={a.image_url} alt={a.title} />
                  </div>
                  <span className="min-w-0 flex-1 truncate text-sm">{a.title}</span>
                  {st === "pending" ? (
                    <span className="shrink-0 text-xs text-muted-foreground">Aguardando…</span>
                  ) : st === "processing" ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                  ) : st === "done" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                  )}
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setProcessingOpen(false);
                setSelected(new Set());
              }}
              disabled={reprocessAIMut.isPending}
            >
              Concluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
