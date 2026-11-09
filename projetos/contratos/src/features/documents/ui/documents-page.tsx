import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspaceStore } from "@/stores/workspace";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileType, Download } from "lucide-react";
import { PageHeader } from "@/features/dashboard/ui/page-header";

const FORMAT_LABEL: Record<string, string> = {
  pdf: "PDF",
  markdown: "Markdown",
  txt: "TXT",
};

export function DocumentsPage() {
  const workspace = useWorkspaceStore((s) => s.workspace);

  const { data, isLoading } = useQuery({
    queryKey: ["global-documents", workspace?.id],
    queryFn: async () => {
      const res = await supabase
        .from("generated_documents")
        .select(`*, project:projects(id, name)`)
        .eq("workspace_id", workspace!.id)
        .order("created_at", { ascending: false })
        .limit(30);
      if (res.error) throw res.error;
      return res.data;
    },
    enabled: !!workspace,
  });

  const download = (doc: { name: string; content: string | null; format: string }) => {
    const blob = new Blob([doc.content ?? ""], {
      type: doc.format === "pdf" ? "application/pdf" : "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documentos"
        description="Documentos resultantes das execuções dos projetos."
      />

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={FileType}
          title="Nenhum documento"
          description="Execute um projeto para gerar documentos."
        />
      ) : (
        <div className="space-y-2">
          {data.map((doc) => {
            const project = (doc as { project?: { id: string; name: string } }).project;
            return (
              <Card key={doc.id}>
                <CardContent className="flex items-center justify-between p-4 text-sm">
                  <div>
                    <div className="font-medium">{doc.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {project ? project.name : "Projeto"}
                      {" · "}
                      {new Date(doc.created_at).toLocaleString("pt-BR")}
                      {doc.size_bytes ? ` · ${(doc.size_bytes / 1024).toFixed(1)} KB` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{FORMAT_LABEL[doc.format] ?? doc.format}</Badge>
                    <Badge variant="outline">{doc.document_status}</Badge>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          Pré-visualizar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-3xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center justify-between gap-4">
                            <span>{doc.name}</span>
                            <Button size="sm" onClick={() => download(doc)}>
                              <Download className="mr-2 h-4 w-4" />
                              Baixar
                            </Button>
                          </DialogTitle>
                        </DialogHeader>
                        {doc.format === "pdf" ? (
                          <p className="text-sm text-muted-foreground">
                            Conteúdo em PDF gerado. Use o botão Baixar para obter o arquivo.
                          </p>
                        ) : (
                          <pre className="whitespace-pre-wrap rounded-md bg-muted p-4 text-sm">
                            {doc.content || "Sem conteúdo"}
                          </pre>
                        )}
                      </DialogContent>
                    </Dialog>
                    {project && (
                      <Link
                        to="/projects/$projectId"
                        params={{ projectId: project.id }}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Abrir
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
