import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Download, FileText, Film, FileImage, Archive, File } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DataTable, type Column } from "@/components/data-table";
import { downloadService } from "@/modules/portal/service";
import type { PortalDownload } from "@/modules/portal/types";

export const Route = createFileRoute("/_app/portal/downloads")({
  head: () => ({ meta: [{ title: "Downloads — ServiceForge" }] }),
  component: PortalDownloadsPage,
});

function formatBytes(bytes?: number): string {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

const typeIcon: Record<string, typeof File> = {
  pdf: FileText, doc: FileText, docx: FileText, xls: FileText, xlsx: FileText,
  mp4: Film, avi: Film, mov: Film,
  jpg: FileImage, jpeg: FileImage, png: FileImage, gif: FileImage,
  zip: Archive, rar: Archive, "7z": Archive,
};

function PortalDownloadsPage() {
  const [formatFilter, setFormatFilter] = useState("all");

  const { data: items = [] } = useQuery({
    queryKey: ["portal", "downloads", "list"],
    queryFn: () => downloadService.list(),
  });

  const filtered = formatFilter === "all" ? items : items.filter((d) => d.format === formatFilter);

  const formats = [...new Set(items.map((d) => d.format))].sort();

  const columns: Column<PortalDownload>[] = [
    {
      key: "documentName", header: "Documento", sortable: true,
      sortFn: (a, b) => a.documentName.localeCompare(b.documentName),
      render: (d) => {
        const Icon = typeIcon[d.format.toLowerCase()] ?? File;
        return (
          <span className="flex items-center gap-2 text-sm font-medium">
            <Icon className="h-4 w-4 text-muted-foreground" /> {d.documentName}
          </span>
        );
      },
    },
    {
      key: "documentType", header: "Tipo",
      render: (d) => <Badge variant="outline">{d.documentType}</Badge>,
    },
    {
      key: "format", header: "Formato",
      render: (d) => <Badge variant="secondary">{d.format.toUpperCase()}</Badge>,
    },
    {
      key: "fileSize", header: "Tamanho", sortable: true,
      sortFn: (a, b) => (a.fileSize ?? 0) - (b.fileSize ?? 0),
      render: (d) => <span className="text-sm text-muted-foreground">{formatBytes(d.fileSize)}</span>,
    },
    {
      key: "ip", header: "IP",
      render: (d) => <span className="text-xs text-muted-foreground font-mono">{d.ip}</span>,
    },
    {
      key: "downloadedAt", header: "Data/Hora", sortable: true,
      sortFn: (a, b) => a.downloadedAt.localeCompare(b.downloadedAt),
      render: (d) => <span className="text-sm whitespace-nowrap">{new Date(d.downloadedAt).toLocaleString("pt-BR")}</span>,
    },
    {
      key: "actions", header: "Ações",
      render: () => (
        <Button variant="ghost" size="icon" disabled>
          <Download className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Downloads</h1>
          <p className="text-sm text-muted-foreground">Registro de downloads do portal</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={formatFilter} onValueChange={setFormatFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os formatos</SelectItem>
              {formats.map((f) => (
                <SelectItem key={f} value={f}>{f.toUpperCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        keyExtractor={(d) => d.id}
        searchKeys={["documentName", "documentType", "ip"]}
        pageSize={10}
        pageSizeOptions={[10, 20, 50]}
        searchPlaceholder="Pesquisar por nome do documento..."
      />
    </div>
  );
}
