import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText, HardDrive, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/common/page-header";
import { SearchInput } from "@/components/common/search-input";
import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import { ConfirmDelete } from "@/components/common/confirm-delete";
import { FileUploader } from "@/components/common/file-uploader";
import { ImagePreview } from "@/components/common/image-preview";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { usePermissions } from "@/hooks/use-permissions";
import { useDeleteFile, useFileCount, useFiles } from "@/hooks/use-files";
import { formatBytes, storageService } from "@/services/storage.service";
import {
  STORAGE_FOLDERS,
  STORAGE_FOLDER_LABELS,
  type StorageFile,
  type StorageFolder,
} from "@/types/storage";

export const Route = createFileRoute("/_authenticated/arquivos")({
  head: () => ({
    meta: [
      { title: "Arquivos — RaffleHub" },
      {
        name: "description",
        content: "Gerencie uploads, avatares e documentos armazenados no RaffleHub.",
      },
      { property: "og:title", content: "Arquivos — RaffleHub" },
      {
        property: "og:description",
        content: "Gerencie uploads, avatares e documentos armazenados no RaffleHub.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FilesRoute,
});

const PAGE_SIZE = 10;
const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

function FilesRoute() {
  return (
    <PermissionGuard permission="files.view">
      <FilesPage />
    </PermissionGuard>
  );
}

function FilesPage() {
  const { can } = usePermissions();
  const [search, setSearch] = useState("");
  const [folder, setFolder] = useState<"all" | StorageFolder>("all");
  const [uploadFolder, setUploadFolder] = useState<StorageFolder>("uploads");
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<StorageFile | null>(null);

  useEffect(() => setPage(1), [search, folder]);

  const query = useFiles({
    page,
    pageSize: PAGE_SIZE,
    ...(search ? { search } : {}),
    ...(folder !== "all" ? { folder } : {}),
  });
  const count = useFileCount();
  const removeFile = useDeleteFile();

  const handleDownload = async (file: StorageFile) => {
    const url = await storageService.download(file);
    if (!url) {
      toast.error("Não foi possível gerar o link de download");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const columns: DataTableColumn<StorageFile>[] = [
    {
      id: "filename",
      header: "Arquivo",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="size-10 shrink-0">
            <ImagePreview source={row.path} mimeType={row.mime_type} alt="" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{row.filename}</p>
            <p className="truncate text-xs text-muted-foreground">{row.mime_type}</p>
          </div>
        </div>
      ),
    },
    {
      id: "folder",
      header: "Pasta",
      cell: (row) => (
        <Badge variant="secondary">
          {STORAGE_FOLDER_LABELS[row.folder as StorageFolder] ?? row.folder}
        </Badge>
      ),
    },
    {
      id: "size",
      header: "Tamanho",
      className: "whitespace-nowrap text-xs text-muted-foreground",
      cell: (row) => formatBytes(row.size),
    },
    {
      id: "created_at",
      header: "Enviado em",
      className: "whitespace-nowrap text-xs text-muted-foreground",
      cell: (row) => dateTime.format(new Date(row.created_at)),
    },
    {
      id: "actions",
      header: "Ações",
      headerClassName: "text-right",
      className: "text-right",
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Baixar ${row.filename}`}
            onClick={() => void handleDownload(row)}
          >
            <Download aria-hidden="true" className="size-4" />
          </Button>
          {can("files.delete") ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Excluir ${row.filename}`}
              onClick={() => setPendingDelete(row)}
            >
              <Trash2 aria-hidden="true" className="size-4 text-destructive" />
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Arquivos"
        description="Uploads de avatares, campanhas e documentos com armazenamento seguro."
      />

      <section aria-label="Resumo de arquivos" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard title="Arquivos visíveis" value={String(count.data ?? 0)} icon={HardDrive} />
        <StatCard
          title="Nesta página"
          value={String(query.data?.rows.length ?? 0)}
          icon={FileText}
        />
        <StatCard
          title="Pasta ativa"
          value={folder === "all" ? "Todas" : STORAGE_FOLDER_LABELS[folder]}
          icon={FileText}
        />
      </section>

      {can("files.upload") ? (
        <Card>
          <CardHeader className="gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Novo upload</CardTitle>
              <CardDescription>Arraste arquivos ou selecione do seu dispositivo.</CardDescription>
            </div>
            <Select
              value={uploadFolder}
              onValueChange={(value) => setUploadFolder(value as StorageFolder)}
            >
              <SelectTrigger className="w-44" aria-label="Pasta de destino">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STORAGE_FOLDERS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {STORAGE_FOLDER_LABELS[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <FileUploader folder={uploadFolder} onUploaded={() => void query.refetch()} />
          </CardContent>
        </Card>
      ) : null}

      <section aria-label="Filtros" className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nome do arquivo…"
          aria-label="Buscar arquivos"
        />
        <Select value={folder} onValueChange={(value) => setFolder(value as typeof folder)}>
          <SelectTrigger className="w-44" aria-label="Filtrar por pasta">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as pastas</SelectItem>
            {STORAGE_FOLDERS.map((item) => (
              <SelectItem key={item} value={item}>
                {STORAGE_FOLDER_LABELS[item]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      <DataTable
        columns={columns}
        rows={query.data?.rows ?? []}
        rowKey={(row) => row.id}
        caption="Arquivos armazenados"
        emptyTitle="Nenhum arquivo encontrado"
        emptyDescription="Faça um upload ou ajuste os filtros de busca."
        page={page}
        pageSize={PAGE_SIZE}
        total={query.data?.total ?? 0}
        onPageChange={setPage}
        isLoading={query.isPending}
        isError={query.isError}
        onRetry={() => void query.refetch()}
      />

      <ConfirmDelete
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Excluir arquivo"
        description={`O arquivo ${pendingDelete?.filename ?? ""} será removido permanentemente do armazenamento.`}
        onConfirm={() => {
          if (!pendingDelete) return;
          removeFile.mutate(pendingDelete, {
            onSuccess: () => toast.success("Arquivo excluído"),
            onError: (error) => toast.error("Falha ao excluir", { description: error.message }),
          });
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
