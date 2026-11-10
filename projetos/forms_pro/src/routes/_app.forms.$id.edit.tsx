import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  Clock,
  Eye,
  History,
  Loader2,
  Redo2,
  Save,
  Send,
  Share2,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FieldLibraryPanel } from "@/components/forms/field-library-panel";
import { FieldProperties } from "@/components/forms/field-properties";
import { BuilderCanvas } from "@/components/forms/builder-canvas";
import { PageTabs } from "@/components/forms/page-tabs";
import { ShareDialog } from "@/components/forms/share-dialog";
import { useBuilderStore } from "@/stores/builder-store";
import { formsApi } from "@/services/forms-service";

export const Route = createFileRoute("/_app/forms/$id/edit")({
  head: () => ({
    meta: [
      { title: "Builder de formulário — IAM Pro Forms" },
      {
        name: "description",
        content: "Editor visual com campos dinâmicos, múltiplas páginas e auto-save.",
      },
    ],
  }),
  component: BuilderPage,
});

function BuilderPage() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [shareOpen, setShareOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const formQ = useQuery({ queryKey: ["form", id], queryFn: () => formsApi.get(id) });
  const versionsQ = useQuery({
    queryKey: ["form-versions", id],
    queryFn: () => formsApi.versions(id),
    enabled: historyOpen,
  });

  const {
    form,
    pages,
    dirty,
    saveStatus,
    lastSavedAt,
    past,
    future,
    load,
    reset,
    undo,
    redo,
    markSaving,
    markSaved,
    markError,
  } = useBuilderStore();

  useEffect(() => {
    if (formQ.data) load(formQ.data);
    return () => reset();
  }, [formQ.data, load, reset]);

  // Auto-save (debounced)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!dirty || !form) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      markSaving();
      try {
        const { savedAt } = await formsApi.saveDraft(form.id, pages);
        markSaved(savedAt);
        qc.invalidateQueries({ queryKey: ["forms"] });
      } catch {
        markError();
      }
    }, 1200);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [pages, dirty, form, markSaving, markSaved, markError, qc]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      }
      if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        void saveNow();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const saveNow = async () => {
    if (!form) return;
    markSaving();
    try {
      const { savedAt } = await formsApi.saveDraft(form.id, pages);
      markSaved(savedAt);
      qc.invalidateQueries({ queryKey: ["forms"] });
      toast.success(t("forms.toast.saved"));
    } catch {
      markError();
    }
  };

  const publish = useMutation({
    mutationFn: async () => {
      if (!form) throw new Error("no form");
      await formsApi.saveDraft(form.id, pages);
      return formsApi.setStatus(form.id, form.status === "published" ? "draft" : "published");
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["forms"] });
      qc.setQueryData(["form", id], updated);
      toast.success(
        updated.status === "published"
          ? t("forms.toast.published")
          : t("forms.toast.unpublished"),
      );
    },
  });

  const visibility = useMutation({
    mutationFn: (v: "public" | "private") => formsApi.update(id, { visibility: v }),
    onSuccess: (updated) => qc.setQueryData(["form", id], updated),
  });

  if (formQ.isLoading || !form) {
    return <Skeleton className="h-[70vh] w-full rounded-xl" />;
  }

  return (
    <div className="-mx-4 -my-6 flex h-[calc(100vh-4rem)] flex-col md:-mx-8 md:-my-8">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2.5">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/forms">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{form.name}</p>
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Badge variant="outline" className="h-4 px-1 text-[10px]">
              v{form.version}
            </Badge>
            {saveStatus === "saving" ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" /> {t("forms.builder.saving")}
              </>
            ) : dirty ? (
              <>
                <Clock className="h-3 w-3" /> {t("forms.builder.unsaved")}
              </>
            ) : (
              <>
                <Check className="h-3 w-3" /> {t("forms.builder.savedAt")}{" "}
                {lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString() : "—"}
              </>
            )}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={past.length === 0} onClick={undo}>
                <Undo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("forms.builder.undo")}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={future.length === 0} onClick={redo}>
                <Redo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("forms.builder.redo")}</TooltipContent>
          </Tooltip>
          <Button variant="ghost" size="icon" onClick={() => setHistoryOpen(true)}>
            <History className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => void saveNow()}>
            <Save className="mr-1.5 h-4 w-4" />
            {t("common.save")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: "/forms/$id/preview", params: { id } })}
          >
            <Eye className="mr-1.5 h-4 w-4" />
            {t("forms.actions.preview")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShareOpen(true)}>
            <Share2 className="mr-1.5 h-4 w-4" />
            {t("forms.actions.share")}
          </Button>
          <Button size="sm" onClick={() => publish.mutate()} disabled={publish.isPending}>
            <Send className="mr-1.5 h-4 w-4" />
            {form.status === "published"
              ? t("forms.actions.unpublish")
              : t("forms.actions.publish")}
          </Button>
        </div>
      </div>

      <PageTabs />

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-60 shrink-0 border-r lg:block">
          <FieldLibraryPanel />
        </aside>
        <main className="min-w-0 flex-1 overflow-y-auto bg-muted/20 px-4 py-6">
          <BuilderCanvas onQuickAdd={() => useBuilderStore.getState().addField("short_text")} />
        </main>
        <aside className="hidden w-80 shrink-0 border-l xl:block">
          <FieldProperties />
        </aside>
      </div>

      <ShareDialog
        form={form}
        open={shareOpen}
        onOpenChange={setShareOpen}
        onVisibilityChange={(v) => visibility.mutate(v)}
      />

      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{t("forms.versions.title")}</SheetTitle>
            <SheetDescription>{t("forms.versions.subtitle")}</SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-2">
            {(versionsQ.data ?? []).map((v) => (
              <div key={v.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{v.label}</p>
                  <Badge variant="outline">v{v.version}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(v.createdAt).toLocaleString()} ·{" "}
                  {v.snapshot.reduce((a, p) => a + p.fields.length, 0)}{" "}
                  {t("forms.fieldsCount")}
                </p>
              </div>
            ))}
            {versionsQ.data?.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("forms.versions.empty")}</p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
