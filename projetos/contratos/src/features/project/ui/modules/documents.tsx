import { useQuery } from "@tanstack/react-query";
import type { Project } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { FileText } from "lucide-react";

const FORMAT_LABEL: Record<string, string> = {
  pdf: "PDF",
  markdown: "Markdown",
  txt: "TXT",
};

export function DocumentsModule({ project }: { project: Project }) {
  const { data, isLoading } = useQuery({
    queryKey: ["project-documents", project.id],
    queryFn: async () => {
      const res = await supabase
        .from("generated_documents")
        .select("*")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (res.error) throw res.error;
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  const list = data ?? [];

  if (list.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Nenhum documento"
        description="Execute o fluxo para gerar documentos."
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Documentos gerados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {list.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between rounded-md border p-3 text-sm"
          >
            <div>
              <div className="font-medium">{doc.name}</div>
              <div className="text-xs text-muted-foreground">
                {new Date(doc.created_at).toLocaleString("pt-BR")}
                {doc.size_bytes ? ` · ${(doc.size_bytes / 1024).toFixed(1)} KB` : ""}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{FORMAT_LABEL[doc.format] ?? doc.format}</Badge>
              <Badge variant="outline">{doc.document_status}</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
