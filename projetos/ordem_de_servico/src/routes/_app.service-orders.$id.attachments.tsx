import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Paperclip, Image, FileText, Video, Music, Upload, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { serviceOrderService } from "@/modules/service-orders/service";
import type { SOAttachment } from "@/modules/service-orders/types";

export const Route = createFileRoute("/_app/service-orders/$id/attachments")({
  head: () => ({ meta: [{ title: "Anexos — ServiceForge" }] }),
  component: AttachmentsTab,
});

const typeConfig: Record<string, { icon: typeof File; label: string; color: string }> = {
  photo: { icon: Image, label: "Fotos", color: "text-pink-500 bg-pink-50" },
  pdf: { icon: FileText, label: "PDFs", color: "text-red-500 bg-red-50" },
  video: { icon: Video, label: "Vídeos", color: "text-purple-500 bg-purple-50" },
  audio: { icon: Music, label: "Áudios", color: "text-indigo-500 bg-indigo-50" },
  document: { icon: File, label: "Documentos", color: "text-blue-500 bg-blue-50" },
};

function AttachmentsTab() {
  const { id } = Route.useParams();
  const { t } = useTranslation();

  const { data: so, isLoading } = useQuery({
    queryKey: ["service-order", id],
    queryFn: () => serviceOrderService.get(id),
  });

  const handleUpload = () => {
    toast("Upload de anexo (funcionalidade a ser implementada)");
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">{t("common.loading")}</p></div>;

  const attachments = so?.attachments ?? [];
  const grouped: Record<string, SOAttachment[]> = { photo: [], pdf: [], video: [], audio: [], document: [] };
  attachments.forEach((a) => {
    if (grouped[a.type]) grouped[a.type].push(a);
    else grouped.document.push(a);
  });

  const categories = Object.entries(typeConfig).filter(([key]) =>
    grouped[key].length > 0 || key === "document"
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">{t("so.attachments")}</h2>
        </div>
        <Button size="sm" onClick={handleUpload}>
          <Upload className="mr-1 h-4 w-4" />Upload
        </Button>
      </div>

      {attachments.length === 0 ? (
        <Card><CardContent><p className="py-8 text-center text-sm text-muted-foreground">Nenhum anexo.</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(([type, config]) => {
            const Icon = config.icon;
            const items = grouped[type];
            return (
              <Card key={type}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${config.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-sm">{config.label}</CardTitle>
                    </div>
                    <Badge variant="secondary">{items.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {items.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nenhum arquivo</p>
                  ) : (
                    <div className="space-y-2">
                      {items.map((att) => (
                        <div key={att.id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <Icon className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                            <span className="truncate">{att.name}</span>
                          </div>
                          <span className="text-muted-foreground flex-shrink-0 ml-2">
                            {att.size ? `${(att.size / 1024).toFixed(1)} KB` : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button variant="ghost" size="sm" className="w-full mt-2 text-xs" onClick={handleUpload}>
                    <Upload className="mr-1 h-3 w-3" />Adicionar
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
