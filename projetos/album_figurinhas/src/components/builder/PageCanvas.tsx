import * as React from "react";
import { A4_HEIGHT_CM, A4_WIDTH_CM, PX_PER_CM, computeCanvasScale } from "@/lib/units";
import type { PageRow, StickerRow, UploadRow } from "@/lib/types";
import { StickerNode } from "./StickerNode";

type Props = {
  page: PageRow;
  stickers: StickerRow[];
  uploadsBySticker?: Record<string, UploadRow>;
  mode: "admin" | "viewer" | "print";
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onPatch?: (id: string, patch: Partial<StickerRow>) => void;
  onCommit?: (id: string, patch: Partial<StickerRow>) => void;
  onSlotClick?: (sticker: StickerRow) => void;
  zoom?: number;
  snap?: boolean;
  registerRef?: (el: HTMLDivElement | null) => void;
};

export function PageCanvas({
  page, stickers, uploadsBySticker = {}, mode, selectedId, onSelect, onPatch, onCommit, onSlotClick,
  zoom = 1, snap = true, registerRef,
}: Props) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [autoScale, setAutoScale] = React.useState(0.5);

  React.useEffect(() => {
    if (mode === "print") { setAutoScale(1); return; }
    const update = () => {
      const el = containerRef.current?.parentElement;
      if (!el) return;
      const pad = 32;
      setAutoScale(computeCanvasScale(el.clientWidth - pad, el.clientHeight - pad));
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current?.parentElement) ro.observe(containerRef.current.parentElement);
    return () => ro.disconnect();
  }, [mode]);

  const scale = mode === "print" ? 1 : autoScale * zoom;
  const baseW = A4_WIDTH_CM * PX_PER_CM;
  const baseH = A4_HEIGHT_CM * PX_PER_CM;

  const bg = page.background ?? {};
  const bgStyle: React.CSSProperties = {
    backgroundColor: bg.color ?? "#ffffff",
    backgroundImage: bg.imageUrl ? `url(${bg.imageUrl})` : undefined,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  return (
    <div
      ref={containerRef}
      onClick={() => mode === "admin" && onSelect?.(null)}
      style={{
        width: baseW * scale,
        height: baseH * scale,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        ref={registerRef}
        data-page-canvas
        style={{
          width: baseW,
          height: baseH,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "absolute",
          top: 0,
          left: 0,
          ...bgStyle,
          boxShadow: mode === "print" ? "none" : "0 24px 60px -20px rgba(15,23,42,0.35)",
          borderRadius: mode === "print" ? 0 : 8,
          overflow: "hidden",
        }}
      >
        {bg.overlay && (
          <div style={{ position: "absolute", inset: 0, background: bg.overlay, pointerEvents: "none" }} />
        )}
        {stickers.map((s) => (
          <StickerNode
            key={s.id}
            sticker={s}
            upload={uploadsBySticker[s.id]}
            mode={mode}
            selected={selectedId === s.id}
            onSelect={onSelect}
            onPatch={onPatch}
            onCommit={onCommit}
            onSlotClick={onSlotClick}
            snap={snap}
            scale={scale}
          />
        ))}
      </div>
    </div>
  );
}