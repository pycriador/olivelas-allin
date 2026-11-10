import { useState } from "react";
import { Monitor, Tablet, Smartphone } from "lucide-react";
import { FormPreview } from "@/modules/preview/FormPreview";
import { useBuilder } from "@/modules/form-builder/store";

const VIEWPORTS = {
  desktop: { w: "100%", label: "Desktop", icon: Monitor },
  tablet: { w: "768px", label: "Tablet", icon: Tablet },
  mobile: { w: "390px", label: "Mobile", icon: Smartphone },
} as const;
type ViewportKey = keyof typeof VIEWPORTS;

export function PreviewFrame() {
  const [vp, setVp] = useState<ViewportKey>("desktop");
  const schema = useBuilder((s) => s.schema);
  const title = useBuilder((s) => s.title);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-center gap-1 border-b border-border p-2">
        {(Object.keys(VIEWPORTS) as ViewportKey[]).map((k) => {
          const Icon = VIEWPORTS[k].icon;
          return (
            <button key={k} onClick={() => setVp(k)}
              className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs ${vp === k ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}>
              <Icon className="h-3.5 w-3.5" /> {VIEWPORTS[k].label}
            </button>
          );
        })}
      </div>
      <div className="flex-1 overflow-auto bg-muted/30">
        <div className="mx-auto my-4 rounded-xl border border-border bg-background shadow-sm transition-all"
          style={{ maxWidth: VIEWPORTS[vp].w }}>
          <FormPreview schema={schema} title={title} />
        </div>
      </div>
    </div>
  );
}