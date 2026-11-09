import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText, FileSpreadsheet, FileBadge, FileCheck, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { serviceOrderService } from "@/modules/service-orders/service";

export const Route = createFileRoute("/_app/service-orders/$id/documents")({
  head: () => ({ meta: [{ title: "Documentos — ServiceForge" }] }),
  component: DocumentsTab,
});

const docTypeIcons: Record<string, typeof FileText> = {
  receipt: FileText, work_order: FileSpreadsheet, warranty: FileBadge,
  budget: FileCheck, proof: FileText,
};

const docTypeLabels: Record<string, string> = {
  receipt: "Recibo", work_order: "Ordem de Serviço", warranty: "Garantia",
  budget: "Orçamento", proof: "Comprovante",
};

function DocumentsTab() {
  const { id } = Route.useParams();
  const { t } = useTranslation();

  const { data: so, isLoading } = useQuery({
    queryKey: ["service-order", id],
    queryFn: () => serviceOrderService.get(id),
  });

  const handleGenerate = (docType: string) => {
    toast(`Gerar documento: ${docType} (integração com Document Platform pendente)`);
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">{t("common.loading")}</p></div>;

  const documents = so?.documents ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">{t("so.documents")}</h2>
      </div>

      {/* Generate Buttons */}
      <Card>
        <CardHeader><CardTitle className="text-base">Gerar Documentos</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => handleGenerate("Laudo Técnico")}>
              <FileText className="mr-1 h-4 w-4" />Gerar Laudo Técnico
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleGenerate("Checklist")}>
              <FileCheck className="mr-1 h-4 w-4" />Gerar Checklist
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleGenerate("Garantia")}>
              <FileBadge className="mr-1 h-4 w-4" />Gerar Garantia
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleGenerate("Relatório Técnico")}>
              <FileSpreadsheet className="mr-1 h-4 w-4" />Gerar Relatório Técnico
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      {documents.length === 0 ? (
        <Card><CardContent><p className="py-8 text-center text-sm text-muted-foreground">Nenhum documento gerado.</p></CardContent></Card>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-base">Documentos Gerados</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documents.map((doc) => {
                const Icon = docTypeIcons[doc.type] ?? FileText;
                return (
                  <div key={doc.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{docTypeLabels[doc.type] ?? doc.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{new Date(doc.generatedAt).toLocaleString("pt-BR")}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Printer className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
