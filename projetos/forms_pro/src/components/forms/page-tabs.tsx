import { useTranslation } from "react-i18next";
import { Copy, FileText, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useBuilderStore } from "@/stores/builder-store";

export function PageTabs() {
  const { t } = useTranslation();
  const pages = useBuilderStore((s) => s.pages);
  const activePageId = useBuilderStore((s) => s.activePageId);
  const setActivePage = useBuilderStore((s) => s.setActivePage);
  const addPage = useBuilderStore((s) => s.addPage);
  const updatePage = useBuilderStore((s) => s.updatePage);
  const removePage = useBuilderStore((s) => s.removePage);
  const duplicatePage = useBuilderStore((s) => s.duplicatePage);
  const movePage = useBuilderStore((s) => s.movePage);

  const active = pages.find((p) => p.id === activePageId);

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto border-b bg-muted/30 px-3 py-2">
      {pages.map((page, index) => (
        <DropdownMenu key={page.id}>
          <div
            draggable
            onDragStart={(e) => e.dataTransfer.setData("text/page-index", String(index))}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const from = Number(e.dataTransfer.getData("text/page-index"));
              if (!Number.isNaN(from)) movePage(from, index);
            }}
            className={cn(
              "flex shrink-0 items-center rounded-lg border text-sm transition",
              page.id === activePageId
                ? "border-primary/50 bg-background shadow-sm"
                : "border-transparent hover:bg-background/70",
            )}
          >
            <button
              type="button"
              onClick={() => setActivePage(page.id)}
              className="flex items-center gap-1.5 px-3 py-1.5"
            >
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="max-w-[160px] truncate">{page.title}</span>
              <span className="text-xs text-muted-foreground">({page.fields.length})</span>
            </button>
            <DropdownMenuTrigger asChild>
              <button type="button" className="px-1.5 text-muted-foreground hover:text-foreground">
                ⋯
              </button>
            </DropdownMenuTrigger>
          </div>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => duplicatePage(page.id)}>
              <Copy className="mr-2 h-4 w-4" />
              {t("forms.actions.duplicate")}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={pages.length <= 1}
              className="text-destructive"
              onClick={() => removePage(page.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t("common.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ))}

      <Button variant="ghost" size="sm" className="shrink-0" onClick={addPage}>
        <Plus className="mr-1 h-3.5 w-3.5" />
        {t("forms.builder.addPage")}
      </Button>

      {active && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto shrink-0">
              {t("forms.builder.pageSettings")}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{t("forms.builder.pageTitle")}</Label>
              <Input
                value={active.title}
                onChange={(e) => updatePage(active.id, { title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("forms.builder.pageDescription")}</Label>
              <Textarea
                rows={3}
                value={active.description ?? ""}
                onChange={(e) => updatePage(active.id, { description: e.target.value })}
              />
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
