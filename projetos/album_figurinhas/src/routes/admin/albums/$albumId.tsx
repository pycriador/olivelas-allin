import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAlbumById, listPages, listStickers, createPage, updatePage, deletePage, duplicatePage,
  createSticker, updateSticker, deleteSticker, uploadAlbumAsset, reorderPages,
} from "@/lib/db";
import { useAuth } from "@/hooks/use-auth";
import { AppHeader } from "@/components/layout/AppShell";
import { PageCanvas } from "@/components/builder/PageCanvas";
import { PropertiesPanel } from "@/components/builder/PropertiesPanel";
import { PageNavigator } from "@/components/builder/PageNavigator";
import { BuilderToolbar } from "@/components/builder/BuilderToolbar";
import { useBuilder } from "@/stores/builder-store";
import type { PageRow, StickerRow } from "@/lib/types";
import { exportNodesToPdf } from "@/lib/pdf-export";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/albums/$albumId")({
  head: () => ({ meta: [{ title: "Editor · Album Studio" }] }),
  component: AlbumBuilder,
});

const EMPTY_PAGES: PageRow[] = [];
const EMPTY_STICKERS: StickerRow[] = [];

function AlbumBuilder() {
  const { albumId } = Route.useParams();
  const { user, isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();

  React.useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [loading, user, nav]);

  const builder = useBuilder();
  const printRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const [exporting, setExporting] = React.useState(false);
  const [printSnapshot, setPrintSnapshot] = React.useState<PageRow[] | null>(null);

  const { data: album } = useQuery({
    queryKey: ["album", albumId], queryFn: () => getAlbumById(albumId), enabled: !!albumId,
  });

  const { data: pagesData } = useQuery({
    queryKey: ["pages", albumId], queryFn: () => listPages(albumId), enabled: !!albumId,
  });
  const pages: PageRow[] = pagesData ?? EMPTY_PAGES;

  React.useEffect(() => { builder.setAlbum(albumId); }, [albumId]);
  React.useEffect(() => { if (pagesData) builder.setPages(pagesData); }, [pagesData]);

  const currentPage = pages.find((p) => p.id === builder.currentPageId) ?? null;

  const { data: stickersData } = useQuery({
    queryKey: ["stickers", builder.currentPageId],
    queryFn: () => listStickers(builder.currentPageId!),
    enabled: !!builder.currentPageId,
  });
  const stickers: StickerRow[] = stickersData ?? EMPTY_STICKERS;

  React.useEffect(() => {
    if (builder.currentPageId && stickersData) builder.setStickers(builder.currentPageId, stickersData);
  }, [stickersData, builder.currentPageId]);

  const liveStickers = builder.currentPageId ? builder.stickersByPage[builder.currentPageId] ?? stickers : [];
  const selectedSticker = liveStickers.find((s) => s.id === builder.selectedStickerId) ?? null;

  // ============ MUTATIONS ============
  const addPage = async () => {
    const order = pages.length;
    const type = order === 0 ? "cover" : "common";
    const p = await createPage(albumId, order, type);
    qc.invalidateQueries({ queryKey: ["pages", albumId] });
    builder.setCurrentPage(p.id);
  };

  const onDeletePage = async (p: PageRow) => {
    if (!confirm("Excluir esta página?")) return;
    await deletePage(p.id);
    qc.invalidateQueries({ queryKey: ["pages", albumId] });
    if (builder.currentPageId === p.id) builder.setCurrentPage(null);
  };

  const onDuplicatePage = async (p: PageRow) => {
    await duplicatePage(p, pages.length);
    qc.invalidateQueries({ queryKey: ["pages", albumId] });
    toast.success("Página duplicada");
  };

  const onMovePage = async (p: PageRow, dir: -1 | 1) => {
    const ordered = [...pages].sort((a, b) => a.order_index - b.order_index);
    const i = ordered.findIndex((x) => x.id === p.id);
    const j = i + dir;
    if (j < 0 || j >= ordered.length) return;
    [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
    const payload = ordered.map((x, idx) => ({ id: x.id, order_index: idx }));
    await reorderPages(payload);
    qc.invalidateQueries({ queryKey: ["pages", albumId] });
  };

  const onPageChange = async (patch: Partial<PageRow>) => {
    if (!currentPage) return;
    await updatePage(currentPage.id, patch);
    qc.invalidateQueries({ queryKey: ["pages", albumId] });
  };

  const onPageBgUpload = async (file: File) => {
    if (!currentPage) return;
    const url = await uploadAlbumAsset(file, `bg-${albumId}`);
    await onPageChange({ background: { ...currentPage.background, imageUrl: url } });
  };

  const addSticker = async () => {
    if (!builder.currentPageId) { toast.error("Crie/selecione uma página primeiro."); return; }
    const next = (liveStickers.length ?? 0) + 1;
    const s = await createSticker(builder.currentPageId, { number: next, order_index: next });
    qc.invalidateQueries({ queryKey: ["stickers", builder.currentPageId] });
    builder.selectSticker(s.id);
  };

  const addGrid = async () => {
    if (!builder.currentPageId) return;
    const rows = 4, cols = 3;
    const marginCm = 1.5;
    const gapCm = 0.4;
    const usableW = 21 - marginCm * 2;
    const usableH = 29.7 - marginCm * 2;
    const w = (usableW - gapCm * (cols - 1)) / cols;
    const h = (usableH - gapCm * (rows - 1)) / rows;
    let counter = liveStickers.length;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        counter++;
        await createSticker(builder.currentPageId, {
          x_cm: marginCm + c * (w + gapCm),
          y_cm: marginCm + r * (h + gapCm),
          width_cm: w, height_cm: h,
          number: counter, order_index: counter,
        });
      }
    }
    qc.invalidateQueries({ queryKey: ["stickers", builder.currentPageId] });
    toast.success(`${rows * cols} figurinhas adicionadas`);
  };

  const onStickerPatch = (id: string, patch: Partial<StickerRow>) => builder.patchSticker(id, patch);
  const onStickerCommit = async (id: string, patch: Partial<StickerRow>) => {
    builder.patchSticker(id, patch);
    await updateSticker(id, patch);
    qc.invalidateQueries({ queryKey: ["stickers", builder.currentPageId] });
  };

  const onStickerEdit = (patch: Partial<StickerRow>, commit?: boolean) => {
    if (!selectedSticker) return;
    builder.patchSticker(selectedSticker.id, patch);
    if (commit) onStickerCommit(selectedSticker.id, patch);
  };

  const onDeleteSticker = async () => {
    if (!selectedSticker) return;
    await deleteSticker(selectedSticker.id);
    builder.removeStickerLocal(selectedSticker.id);
    qc.invalidateQueries({ queryKey: ["stickers", builder.currentPageId] });
  };

  // ============ EXPORT ============
  const exportPage = async () => {
    if (!currentPage) return;
    setExporting(true);
    setPrintSnapshot([currentPage]);
    await new Promise((r) => setTimeout(r, 250));
    const node = printRefs.current[currentPage.id];
    if (node) await exportNodesToPdf([node], `${album?.name ?? "album"}-${currentPage.name}.pdf`);
    setPrintSnapshot(null);
    setExporting(false);
  };

  const exportAlbum = async () => {
    setExporting(true);
    setPrintSnapshot(pages);
    // Allow images to render in offscreen nodes
    await new Promise((r) => setTimeout(r, 600));
    const nodes = pages.map((p) => printRefs.current[p.id]).filter(Boolean) as HTMLDivElement[];
    if (nodes.length) await exportNodesToPdf(nodes, `${album?.name ?? "album"}-completo.pdf`);
    setPrintSnapshot(null);
    setExporting(false);
  };

  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando…</div>;

  return (
    <div className="min-h-screen flex flex-col bg-secondary/30">
      <AppHeader />
      <BuilderToolbar
        zoom={builder.zoom} snap={builder.snap}
        onZoom={builder.setZoom} onToggleSnap={builder.toggleSnap}
        onUndo={builder.undo} onRedo={builder.redo}
        onAddSticker={addSticker} onAddGrid={addGrid}
        onExportPage={exportPage} onExportAlbum={exportAlbum}
        exporting={exporting}
      />
      <div className="flex-1 grid grid-cols-[240px_1fr_320px] gap-0 overflow-hidden min-h-0">
        <aside className="border-r border-border/60 bg-card/40 overflow-hidden">
          <PageNavigator
            pages={pages} currentId={builder.currentPageId}
            onSelect={builder.setCurrentPage}
            onAdd={addPage}
            onDuplicate={onDuplicatePage}
            onDelete={onDeletePage}
            onMove={onMovePage}
          />
        </aside>
        <main className="relative overflow-auto bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.06)_1px,transparent_0)] [background-size:24px_24px]">
          <div className="absolute inset-0 flex items-center justify-center p-8">
            {currentPage ? (
              <PageCanvas
                page={currentPage}
                stickers={liveStickers}
                mode="admin"
                selectedId={builder.selectedStickerId}
                onSelect={builder.selectSticker}
                onPatch={onStickerPatch}
                onCommit={onStickerCommit}
                zoom={builder.zoom}
                snap={builder.snap}
              />
            ) : (
              <div className="text-center text-muted-foreground">
                <p className="mb-4">Crie sua primeira página para começar.</p>
              </div>
            )}
          </div>
        </main>
        <aside className="border-l border-border/60 bg-card/40 overflow-hidden">
          <PropertiesPanel
            page={currentPage} sticker={selectedSticker}
            onStickerChange={onStickerEdit}
            onPageChange={onPageChange}
            onDeleteSticker={onDeleteSticker}
            onPageBgUpload={onPageBgUpload}
          />
        </aside>
      </div>

      {/* offscreen print container */}
      {printSnapshot && (
        <div style={{ position: "fixed", left: -99999, top: 0, zIndex: -1 }}>
          {printSnapshot.map((p) => (
            <PrintPage key={p.id} page={p} albumId={albumId}
              registerRef={(el) => { printRefs.current[p.id] = el; }} />
          ))}
        </div>
      )}
    </div>
  );
}

function PrintPage({ page, albumId, registerRef }: { page: PageRow; albumId: string; registerRef: (el: HTMLDivElement | null) => void }) {
  const { data: stickers = [] } = useQuery({
    queryKey: ["print-stickers", page.id], queryFn: () => listStickers(page.id),
  });
  const { data: uploads = [] } = useQuery({
    queryKey: ["print-uploads", albumId, page.id],
    queryFn: async () => {
      const { data } = await (await import("@/integrations/supabase/client")).supabase
        .from("uploads").select("*").eq("page_id", page.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  const map: Record<string, any> = {};
  for (const u of uploads as any[]) if (!map[u.sticker_id]) map[u.sticker_id] = u;
  return <PageCanvas page={page} stickers={stickers} uploadsBySticker={map} mode="print" registerRef={registerRef} />;
}