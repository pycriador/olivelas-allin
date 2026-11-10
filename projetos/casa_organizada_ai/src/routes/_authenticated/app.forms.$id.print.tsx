import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { ArrowLeft, Download, Printer, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getForm } from "@/modules/form-builder/forms.functions";
import { emptySchema, type FormSchema } from "@/modules/form-builder/types";
import { defaultLayout, type PdfLayout } from "@/modules/pdf/layout";
import { PdfRenderer } from "@/modules/pdf/renderer";
import { PrintControls } from "@/modules/pdf/components/PrintControls";
import { generatePdf } from "@/modules/pdf/generate";
import { listPdfLayouts, savePdfLayout } from "@/modules/pdf/layouts.functions";

export const Route = createFileRoute("/_authenticated/app/forms/$id/print")({
  component: PrintStudio,
});

function PrintStudio() {
  const { id } = useParams({ from: "/_authenticated/app/forms/$id/print" });
  const qc = useQueryClient();
  const get = useServerFn(getForm);
  const listLayouts = useServerFn(listPdfLayouts);
  const saveLayout = useServerFn(savePdfLayout);

  const formQ = useQuery({ queryKey: ["forms", id], queryFn: () => get({ data: { id } }) });
  const layoutsQ = useQuery({
    queryKey: ["pdf-layouts", id],
    queryFn: () => listLayouts({ data: { formId: id } }),
  });

  const [layout, setLayout] = useState<PdfLayout>(defaultLayout());
  const [layoutId, setLayoutId] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const schema: FormSchema = useMemo(() => {
    const s = formQ.data?.schema;
    if (s && typeof s === "object") return s as unknown as FormSchema;
    return emptySchema();
  }, [formQ.data]);

  const title = formQ.data?.title ?? "Documento";

  function patchLayout(patch: Partial<PdfLayout>) {
    setLayout((prev) => ({ ...prev, ...patch }));
  }

  function loadSavedLayout(id: string) {
    const row = layoutsQ.data?.find((r) => r.id === id);
    if (!row) return;
    setLayout({ ...defaultLayout(), ...(row.config as PdfLayout) });
    setLayoutId(row.id);
  }

  async function onSave() {
    try {
      setBusy(true);
      const res = await saveLayout({
        data: { id: layoutId, formId: id, name: `Layout — ${title}`, config: layout },
      });
      setLayoutId(res.id);
      qc.invalidateQueries({ queryKey: ["pdf-layouts", id] });
      toast.success("Layout salvo");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onDownload() {
    if (!printRef.current) return;
    try {
      setBusy(true);
      await generatePdf(printRef.current, layout, title.replace(/[^\w\d-]+/g, "_"));
      toast.success("PDF gerado");
    } catch (e) {
      toast.error("Erro ao gerar PDF: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function onPrint() {
    window.print();
  }

  if (formQ.isLoading) {
    return <div className="p-6 space-y-3"><Skeleton className="h-10 w-64" /><Skeleton className="h-[70vh]" /></div>;
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex items-center gap-3 border-b border-border bg-background px-4 py-2 print:hidden">
        <Button asChild variant="ghost" size="icon">
          <Link to="/app/forms/$id/edit" params={{ id }}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-sm font-semibold">Print Studio</h1>
          <p className="text-xs text-muted-foreground">{title}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {layoutsQ.data && layoutsQ.data.length > 0 && (
            <select
              className="rounded-md border border-border bg-background px-2 py-1.5 text-xs"
              value={layoutId ?? ""}
              onChange={(e) => e.target.value && loadSavedLayout(e.target.value)}
            >
              <option value="">Layouts salvos…</option>
              {layoutsQ.data.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          )}
          <Button size="sm" variant="outline" onClick={onSave} disabled={busy}>
            <Save className="mr-1.5 h-4 w-4" /> Salvar
          </Button>
          <Button size="sm" variant="outline" onClick={onPrint} disabled={busy}>
            <Printer className="mr-1.5 h-4 w-4" /> Imprimir
          </Button>
          <Button size="sm" onClick={onDownload} disabled={busy}>
            <Download className="mr-1.5 h-4 w-4" /> Baixar PDF
          </Button>
        </div>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[320px_1fr] print:block print:grid-cols-none">
        <aside className="overflow-y-auto border-r border-border bg-card/40 p-4 print:hidden">
          <PrintControls layout={layout} onChange={patchLayout} />
        </aside>
        <main className="overflow-y-auto bg-muted/30 p-6 print:overflow-visible print:bg-white print:p-0">
          <div ref={printRef} className="pdf-print-root">
            <PdfRenderer schema={schema} title={title} layout={layout} />
          </div>
        </main>
      </div>
    </div>
  );
}