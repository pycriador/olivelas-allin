import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTemplates } from "@/hooks/data";
import { ListSkeleton } from "@/components/common/skeletons";
import { EmptyState } from "@/components/common/empty-state";
import { BookMarked, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UseTemplateDialog } from "@/components/dialogs/use-template-dialog";
import type { Template } from "@/types/domain";

export const Route = createFileRoute("/templates")({
  component: TemplatesPage,
});

function TemplatesPage() {
  const { data, isLoading } = useTemplates();
  const [selected, setSelected] = useState<Template | null>(null);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
        <p className="text-sm text-muted-foreground">Reusable starting points for common specification types.</p>
      </div>
      {isLoading ? (
        <ListSkeleton rows={4} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No templates" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((tpl) => (
            <div key={tpl.id} className="flex flex-col rounded-xl border border-border/70 bg-card p-5 transition-shadow hover:shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <BookMarked className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-foreground">{tpl.name}</div>
                  <div className="text-xs text-muted-foreground">{tpl.description}</div>
                </div>
              </div>
              <div className="mt-3 text-[11px] text-muted-foreground">
                {tpl.blocks.length} block{tpl.blocks.length === 1 ? "" : "s"}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Badge variant="outline" className="text-[10px] uppercase">{tpl.type}</Badge>
                <Button size="sm" onClick={() => setSelected(tpl)} className="h-7 gap-1 text-xs">
                  <Wand2 className="h-3.5 w-3.5" /> Use template
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <UseTemplateDialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)} template={selected} />
    </div>
  );
}
