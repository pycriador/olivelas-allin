import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Printer, Save, FileText, ZoomIn, Copy, Palette, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { documentService, printSettingsService, addHistory } from "@/modules/documents/service";
import { DocButton } from "@/components/doc-button";
import type { Document, PrintLayout, PrintOrientation } from "@/modules/documents/types";
import { PRINT_LAYOUT_LABELS, PRINT_ORIENTATION_LABELS, DEFAULT_PRINT_SETTINGS } from "@/modules/documents/types";

export const Route = createFileRoute("/_app/documents/print")({
  head: () => ({ meta: [{ title: "Print Center — ServiceForge" }] }),
  component: PrintPage,
});

function PrintPage() {
  const qc = useQueryClient();
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [layout, setLayout] = useState<PrintLayout>(DEFAULT_PRINT_SETTINGS.layout);
  const [orientation, setOrientation] = useState<PrintOrientation>(DEFAULT_PRINT_SETTINGS.orientation);
  const [marginTop, setMarginTop] = useState(DEFAULT_PRINT_SETTINGS.marginTop);
  const [marginRight, setMarginRight] = useState(DEFAULT_PRINT_SETTINGS.marginRight);
  const [marginBottom, setMarginBottom] = useState(DEFAULT_PRINT_SETTINGS.marginBottom);
  const [marginLeft, setMarginLeft] = useState(DEFAULT_PRINT_SETTINGS.marginLeft);
  const [zoom, setZoom] = useState(DEFAULT_PRINT_SETTINGS.zoom);
  const [copies, setCopies] = useState(DEFAULT_PRINT_SETTINGS.copies);
  const [colorMode, setColorMode] = useState<"color" | "grayscale">(DEFAULT_PRINT_SETTINGS.colorMode);

  const { data: documents = [] } = useQuery({ queryKey: ["documents"], queryFn: () => documentService.list() });
  const { data: savedSettings } = useQuery({ queryKey: ["documents", "print-settings"], queryFn: () => printSettingsService.get() });

  const selectedDoc = documents.find((d) => d.id === selectedDocId);

  const saveMut = useMutation({
    mutationFn: () => printSettingsService.update({ layout, orientation, marginTop, marginRight, marginBottom, marginLeft, zoom, copies, colorMode, collate: true }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["documents", "print-settings"] }); toast.success("Configurações salvas"); },
  });

  const handlePrint = () => {
    if (!selectedDocId) { toast.error("Selecione um documento"); return; }
    const printWindow = window.open("", "_blank");
    if (!printWindow) { toast.error("Popup bloqueado"); return; }
    printWindow.document.write(`
      <html>
        <head><style>@page { margin: ${marginTop}px ${marginRight}px ${marginBottom}px ${marginLeft}px; size: ${layout === "a4" ? "A4" : layout === "a5" ? "A5" : layout === "letter" ? "letter" : layout === "58mm" ? "58mm 210mm" : layout === "80mm" ? "80mm 297mm" : "auto"}; } body { transform: scale(${zoom / 100}); transform-origin: top left; filter: ${colorMode === "grayscale" ? "grayscale(1)" : "none"}; }</style></head>
        <body>${selectedDoc?.content || ""}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
    if (selectedDocId) {
      addHistory(selectedDocId, "printed", "system", "Sistema", `Impresso (${copies} cópia(s), ${PRINT_LAYOUT_LABELS[layout]}, ${PRINT_ORIENTATION_LABELS[orientation]})`);
    }
  };

  const layoutLabel = (l: PrintLayout) => PRINT_LAYOUT_LABELS[l] || l;
  const orientationLabel = (o: PrintOrientation) => PRINT_ORIENTATION_LABELS[o] || o;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Central de Impressão</h1>
          <DocButton module="documents" page="print" />
          <p className="text-sm text-muted-foreground">Configure e imprima documentos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => saveMut.mutate()}>
            <Save className="mr-2 h-4 w-4" />Salvar Padrão
          </Button>
          <Button onClick={handlePrint} disabled={!selectedDocId}>
            <Printer className="mr-2 h-4 w-4" />Imprimir
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4 lg:col-span-1">
          <Card>
            <CardHeader><CardTitle className="text-base">Configurações</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Documento</Label>
                <Select value={selectedDocId} onValueChange={setSelectedDocId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {documents.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        <span className="flex items-center gap-2"><FileText className="h-4 w-4" />{d.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Layout</Label>
                <Select value={layout} onValueChange={(v) => setLayout(v as PrintLayout)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PRINT_LAYOUT_LABELS) as PrintLayout[]).map((l) => (
                      <SelectItem key={l} value={l}>{layoutLabel(l)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Orientação</Label>
                <div className="flex gap-2">
                  <Button variant={orientation === "portrait" ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setOrientation("portrait")}>
                    <Maximize2 className="mr-1 h-4 w-4 rotate-0" />Retrato
                  </Button>
                  <Button variant={orientation === "landscape" ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setOrientation("landscape")}>
                    <Maximize2 className="mr-1 h-4 w-4 rotate-90" />Paisagem
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Margem Top</Label>
                  <Input type="number" value={marginTop} onChange={(e) => setMarginTop(Number(e.target.value))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Margem Right</Label>
                  <Input type="number" value={marginRight} onChange={(e) => setMarginRight(Number(e.target.value))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Margem Bottom</Label>
                  <Input type="number" value={marginBottom} onChange={(e) => setMarginBottom(Number(e.target.value))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Margem Left</Label>
                  <Input type="number" value={marginLeft} onChange={(e) => setMarginLeft(Number(e.target.value))} />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1"><ZoomIn className="h-3 w-3" />Zoom ({zoom}%)</Label>
                <Input type="number" min={10} max={500} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Copy className="h-3 w-3" />Cópias</Label>
                <Input type="number" min={1} max={999} value={copies} onChange={(e) => setCopies(Number(e.target.value))} />
              </div>

              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1"><Palette className="h-3 w-3" />Colorido</Label>
                <Switch checked={colorMode === "color"} onCheckedChange={(v) => setColorMode(v ? "color" : "grayscale")} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Preview</span>
                <Badge variant="outline">{layoutLabel(layout)} · {orientationLabel(orientation)} · {zoom}%</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md bg-white overflow-auto max-h-[70vh]" style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top left" }}>
                {selectedDoc ? (
                  <div dangerouslySetInnerHTML={{ __html: selectedDoc.content }} />
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                    Selecione um documento para visualizar
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
