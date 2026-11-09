import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Camera, Package, Clock, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { serviceOrderService } from "@/modules/service-orders/service";

export const Route = createFileRoute("/_app/service-orders/$id/recebimento")({
  head: () => ({ meta: [{ title: "Recebimento — ServiceForge" }] }),
  component: RecebimentoTab,
});

function RecebimentoTab() {
  const { id } = Route.useParams();

  const { data: so, isLoading: soLoading } = useQuery({
    queryKey: ["service-order", id],
    queryFn: () => serviceOrderService.get(id),
  });

  const { data: checklists = [] } = useQuery({
    queryKey: ["so-checklists", id],
    queryFn: () => serviceOrderService.getChecklists(id),
    enabled: !!id,
  });

  const { data: photos = [] } = useQuery({
    queryKey: ["so-photos", id],
    queryFn: () => serviceOrderService.getPhotos(id),
    enabled: !!id,
  });

  if (soLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Carregando...</p></div>;
  if (!so) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">OS não encontrada</p></div>;

  const entryPhotos = photos.filter((p) => p.category === "entry");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Recebimento</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" /> Data de Entrada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{so.entryDate ? new Date(so.entryDate + "T00:00:00").toLocaleDateString("pt-BR") : so.createdAt ? new Date(so.createdAt).toLocaleDateString("pt-BR") : "N/A"}</p>
            <p className="text-xs text-muted-foreground mt-1">Criado por: {so.createdBy ?? "Sistema"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" /> Responsável
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{so.updatedBy ?? so.createdBy ?? "N/A"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardList className="h-4 w-4" /> Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          {checklists.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum checklist de recebimento.</p>
          ) : (
            <div className="space-y-4">
              {checklists.map((cl) => (
                <div key={cl.id}>
                  <p className="text-sm font-medium mb-2">{cl.templateName}</p>
                  <div className="space-y-2">
                    {cl.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 text-sm">
                        <div className={`h-4 w-4 rounded border flex items-center justify-center ${item.checked ? "bg-primary border-primary" : "border-gray-300"}`}>
                          {item.checked && <span className="text-white text-xs">&check;</span>}
                        </div>
                        <span className={item.checked ? "line-through text-muted-foreground" : ""}>{item.label}</span>
                        {item.checkedBy && <span className="text-xs text-muted-foreground ml-auto">por {item.checkedBy}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Camera className="h-4 w-4" /> Fotos de Entrada
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entryPhotos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma foto de entrada.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {entryPhotos.map((photo) => (
                <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                  <img src={photo.fileUrl} alt={photo.caption} className="object-cover w-full h-full" />
                  {photo.caption && <p className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">{photo.caption}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Package className="h-4 w-4" /> Acessórios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">Acessórios registrados no momento da entrada.</p>
        </CardContent>
      </Card>

      {so.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Observações do Recebimento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{so.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
