import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Type, Image, Table2, Minus, QrCode, PenLine, Calendar,
  Clock, Heading, ArrowDownToLine, Sigma, List, Repeat, Expand,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { ComponentType } from "@/modules/documents/types";
import { DocButton } from "@/components/doc-button";
import { COMPONENT_TYPE_LABELS } from "@/modules/documents/types";
import { COMPONENT_PROPERTIES } from "@/modules/documents/service";

export const Route = createFileRoute("/_app/documents/designer")({
  head: () => ({ meta: [{ title: "Document Designer — ServiceForge" }] }),
  component: DocumentDesignerPage,
});

const COMPONENT_ICONS: Record<string, React.ReactNode> = {
  text: <Type className="h-5 w-5" />,
  image: <Image className="h-5 w-5" />,
  logo: <Image className="h-5 w-5" />,
  field: <Type className="h-5 w-5" />,
  table: <Table2 className="h-5 w-5" />,
  line: <Minus className="h-5 w-5" />,
  qrcode: <QrCode className="h-5 w-5" />,
  barcode: <QrCode className="h-5 w-5" />,
  signature: <PenLine className="h-5 w-5" />,
  date: <Calendar className="h-5 w-5" />,
  time: <Clock className="h-5 w-5" />,
  header: <Heading className="h-5 w-5" />,
  footer: <ArrowDownToLine className="h-5 w-5" />,
  expression: <Sigma className="h-5 w-5" />,
  list: <List className="h-5 w-5" />,
  repeater: <Repeat className="h-5 w-5" />,
  spacer: <Expand className="h-5 w-5" />,
  page: <Expand className="h-5 w-5" />,
  rectangle: <Expand className="h-5 w-5" />,
};

const CANVAS_COMPONENTS = ["text", "image", "table", "line", "qrcode", "signature", "date", "time", "header", "footer", "field"];

function DocumentDesignerPage() {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [zoom, setZoom] = useState(75);

  const componentTypes = Object.keys(COMPONENT_TYPE_LABELS) as ComponentType[];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Document Designer</h1>
          <DocButton module="documents" page="designer" />
        <p className="text-sm text-muted-foreground">Arraste componentes para criar modelos de documentos</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-1 space-y-4">
          <Card className="p-4">
            <h3 className="text-sm font-medium mb-3">Componentes</h3>
            <div className="grid grid-cols-2 gap-2">
              {componentTypes.filter((t) => !["barcode", "page", "rectangle"].includes(t)).map((type) => (
                <Button
                  key={type}
                  variant="outline"
                  size="sm"
                  className="h-auto flex-col gap-1 py-3 cursor-grab"
                  onClick={() => setSelectedComponent(type)}
                >
                  {COMPONENT_ICONS[type] ?? <Type className="h-5 w-5" />}
                  <span className="text-[10px]">{COMPONENT_TYPE_LABELS[type]}</span>
                </Button>
              ))}
            </div>
          </Card>

          {selectedComponent && COMPONENT_PROPERTIES[selectedComponent] && (
            <Card className="p-4 space-y-3">
              <h3 className="text-sm font-medium">Propriedades — {COMPONENT_TYPE_LABELS[selectedComponent as ComponentType]}</h3>
              {COMPONENT_PROPERTIES[selectedComponent].map((prop) => (
                <div key={prop.key} className="space-y-1">
                  <Label className="text-xs">{prop.label}</Label>
                  {prop.type === "boolean" ? (
                    <Switch />
                  ) : prop.type === "select" ? (
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                      <SelectContent>
                        {prop.options?.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : prop.type === "color" ? (
                    <div className="flex gap-2 items-center">
                      <Input type="color" className="w-10 h-8 p-0.5" />
                      <Input placeholder="#000000" className="flex-1" />
                    </div>
                  ) : (
                    <Input type={prop.type === "number" ? "number" : "text"} placeholder={prop.label} />
                  )}
                </div>
              ))}
            </Card>
          )}
        </div>

        <div className="xl:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{zoom}%</Badge>
              <input
                type="range"
                min={25}
                max={200}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-32"
              />
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => setZoom(Math.max(25, zoom - 10))}>-</Button>
              <Button size="sm" variant="outline" onClick={() => setZoom(Math.min(200, zoom + 10))}>+</Button>
            </div>
          </div>

          <div className="flex justify-center">
            <div
              className="bg-white shadow-lg border rounded-sm"
              style={{
                width: `${595 * (zoom / 100)}px`,
                minHeight: `${842 * (zoom / 100)}px`,
                transformOrigin: "top center",
                transition: "width 0.2s, min-height 0.2s",
              }}
            >
              <div className="p-8 space-y-4">
                {CANVAS_COMPONENTS.slice(0, 4).map((type, i) => (
                  <div
                    key={i}
                    className={`border border-dashed rounded p-3 cursor-pointer hover:border-primary transition-colors ${selectedComponent === type ? "border-primary bg-primary/5" : "border-muted-foreground/20"}`}
                    onClick={() => setSelectedComponent(type)}
                  >
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {COMPONENT_ICONS[type]}
                      <span>{COMPONENT_TYPE_LABELS[type as ComponentType]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
