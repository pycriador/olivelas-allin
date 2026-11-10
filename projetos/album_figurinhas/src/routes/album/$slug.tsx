import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAlbumBySlug, listPages, listStickers, listUploadsByAlbum } from "@/lib/db";
import { AppHeader } from "@/components/layout/AppShell";
import { PageCanvas } from "@/components/builder/PageCanvas";
import { UploadDialog } from "@/components/viewer/UploadDialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, FileDown, Loader2 } from "lucide-react";
import type { StickerRow, UploadRow, PageRow } from "@/lib/types";
import { exportNodesToPdf } from "@/lib/pdf-export";
import { toast } from "sonner";

export const Route = createFileRoute("/album/$slug")({
  head: () => ({ meta: [{ title: "Álbum · Copa 2026" }] }),
  component: AlbumViewer,
});

function AlbumViewer() {
  const { slug } = Route.useParams();
  const qc = useQueryClient();
  const [pageIdx, setPageIdx] = React.useState(0);
  const [pickSticker, setPickSticker] = React.useState<StickerRow | null>(null);
  const [exporting, setExporting] = React.useState(false);
  const [printAll, setPrintAll] = React.useState<PageRow[] | null>(null);
  const printRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  const { data: album } = useQuery({ queryKey: ["album-slug", slug], queryFn: () => getAlbumBySlug(slug) });
  const { data: pages = [] } = useQuery({
    queryKey: ["pages", album?.id], queryFn: () => listPages(album!.id), enabled: !!album?.id,
  });
  const current = pages[pageIdx];
  const { data: stickers = [] } = useQuery({
    queryKey: ["stickers", current?.id], queryFn: () => listStickers(current!.id), enabled: !!current?.id,
  });
  const { data: uploads = [] } = useQuery({
    queryKey: ["uploads", album?.id], queryFn: () => listUploadsByAlbum(album!.id), enabled: !!album?.id,
  });
  const uploadsBySticker: Record<string, UploadRow> = {};
  for (const u of uploads) if (!uploadsBySticker[u.sticker_id]) uploadsBySticker[u.sticker_id] = u;

  const exportPage = async () => {
    if (!current) return;
    setExporting(true); setPrintAll([current]);
    await new Promise((r) => setTimeout(r, 300));
    const node = printRefs.current[current.id];
    if (node) await exportNodesToPdf([node], `${album?.name ?? "album"}-${current.name}.pdf`);
    setPrintAll(null); setExporting(false);
  };
  const exportAlbum = async () => {
    if (!pages.length) return;
    setExporting(true); setPrintAll(pages);
    await new Promise((r) => setTimeout(r, 600));
    const nodes = pages.map((p) => printRefs.current[p.id]).filter(Boolean) as HTMLDivElement[];
    if (nodes.length) await exportNodesToPdf(nodes, `${album?.name ?? "album"}-completo.pdf`);
    setPrintAll(null); setExporting(false);
  };

  if (!album) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando…</div>;

  return (
    <div className="min-h-screen flex flex-col bg-secondary/30">
      <AppHeader />
      <div className="border-b border-border/60 bg-card/70 backdrop-blur px-4 py-2 flex items-center gap-2">
        <Button size="icon" variant="ghost" disabled={pageIdx === 0} onClick={() => setPageIdx((i) => Math.max(0, i - 1))}><ChevronLeft className="w-4 h-4" /></Button>
        <div className="text-sm font-medium tabular-nums">Página {pageIdx + 1} / {pages.length}</div>
        <Button size="icon" variant="ghost" disabled={pageIdx >= pages.length - 1} onClick={() => setPageIdx((i) => Math.min(pages.length - 1, i + 1))}><ChevronRight className="w-4 h-4" /></Button>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" disabled={exporting} onClick={exportPage}>
            {exporting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <FileDown className="w-4 h-4 mr-1" />} PDF página
          </Button>
          <Button size="sm" disabled={exporting} onClick={exportAlbum}>
            {exporting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <FileDown className="w-4 h-4 mr-1" />} PDF álbum
          </Button>
        </div>
      </div>
      <main className="flex-1 relative overflow-auto">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          {current ? (
            <PageCanvas
              page={current} stickers={stickers} uploadsBySticker={uploadsBySticker}
              mode="viewer" onSlotClick={(s) => setPickSticker(s)}
            />
          ) : (
            <div className="text-muted-foreground">Este álbum ainda não tem páginas.</div>
          )}
        </div>
      </main>

      <UploadDialog
        open={!!pickSticker} onOpenChange={(v) => !v && setPickSticker(null)}
        sticker={pickSticker} albumId={album.id}
        onUploaded={() => { qc.invalidateQueries({ queryKey: ["uploads", album.id] }); toast.success("Foto adicionada à página"); }}
      />

      {printAll && (
        <div style={{ position: "fixed", left: -99999, top: 0, zIndex: -1 }}>
          {printAll.map((p) => (
            <PrintPage key={p.id} page={p} uploads={uploads} registerRef={(el) => { printRefs.current[p.id] = el; }} />
          ))}
        </div>
      )}
    </div>
  );
}

function PrintPage({ page, uploads, registerRef }: { page: PageRow; uploads: UploadRow[]; registerRef: (el: HTMLDivElement | null) => void }) {
  const { data: stickers = [] } = useQuery({
    queryKey: ["print-stickers", page.id], queryFn: () => listStickers(page.id),
  });
  const map: Record<string, UploadRow> = {};
  for (const u of uploads) if (u.page_id === page.id && !map[u.sticker_id]) map[u.sticker_id] = u;
  return <PageCanvas page={page} stickers={stickers} uploadsBySticker={map} mode="print" registerRef={registerRef} />;
}