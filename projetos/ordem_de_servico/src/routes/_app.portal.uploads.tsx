import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DataTable, type Column } from "@/components/data-table";
import { uploadService } from "@/modules/portal/service";
import type { PortalUpload } from "@/modules/portal/types";

export const Route = createFileRoute("/_app/portal/uploads")({
  head: () => ({ meta: [{ title: "Uploads — ServiceForge" }] }),
  component: PortalUploadsPage,
});

function PortalUploadsPage() {
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: uploads = [] } = useQuery({ queryKey: ["portal", "uploads"], queryFn: () => uploadService.list() });

  const types = [...new Set(uploads.map((u) => u.fileType))];

  const filtered = typeFilter === "all" ? uploads : uploads.filter((u) => u.fileType === typeFilter);

  const columns: Column<PortalUpload>[] = [
    { key: "fileName", header: "Arquivo", sortable: true, sortFn: (a, b) => a.fileName.localeCompare(b.fileName), render: (u) => <span>{u.fileName}</span> },
    { key: "fileType", header: "Tipo", render: (u) => <Badge variant="secondary">{u.fileType}</Badge> },
    { key: "fileSize", header: "Tamanho", sortable: true, sortFn: (a, b) => a.fileSize - b.fileSize, render: (u) => {
      const size = u.fileSize;
      if (size >= 1048576) return <span>{(size / 1048576).toFixed(1)} MB</span>;
      if (size >= 1024) return <span>{(size / 1024).toFixed(1)} KB</span>;
      return <span>{size} B</span>;
    }},
    { key: "publicCode", header: "Código Público", render: (u) => <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">{u.publicCode}</code> },
    { key: "ip", header: "IP", render: (u) => <span className="text-xs font-mono">{u.ip}</span> },
    { key: "uploadedAt", header: "Data", sortable: true, sortFn: (a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime(), render: (u) => <span className="text-sm">{new Date(u.uploadedAt).toLocaleString("pt-BR")}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Uploads</h1>
          <p className="text-sm text-muted-foreground">Arquivos enviados pelo portal público</p>
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Filtrar por tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        keyExtractor={(u) => u.id}
        searchKeys={["fileName", "publicCode", "ip"]}
        searchPlaceholder="Buscar por nome do arquivo..."
        initialSortColumn="uploadedAt"
      />
    </div>
  );
}
