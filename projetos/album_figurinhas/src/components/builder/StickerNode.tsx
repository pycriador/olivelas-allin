import * as React from "react";
import { PX_PER_CM } from "@/lib/units";
import type { StickerRow, UploadRow } from "@/lib/types";
import { ImagePlus } from "lucide-react";

type Props = {
  sticker: StickerRow;
  upload?: UploadRow;
  mode: "admin" | "viewer" | "print";
  selected?: boolean;
  onSelect?: (id: string | null) => void;
  onPatch?: (id: string, patch: Partial<StickerRow>) => void;
  onCommit?: (id: string, patch: Partial<StickerRow>) => void;
  onSlotClick?: (s: StickerRow) => void;
  snap?: boolean;
  scale: number;
};

const SNAP_CM = 0.5;
const snapCm = (v: number, on: boolean) => (on ? Math.round(v / SNAP_CM) * SNAP_CM : v);

export function StickerNode({
  sticker, upload, mode, selected, onSelect, onPatch, onCommit, onSlotClick, snap = true, scale,
}: Props) {
  const x = sticker.x_cm * PX_PER_CM;
  const y = sticker.y_cm * PX_PER_CM;
  const w = sticker.width_cm * PX_PER_CM;
  const h = sticker.height_cm * PX_PER_CM;

  const style = sticker.style ?? {};

  const startDrag = (e: React.PointerEvent) => {
    if (mode !== "admin") return;
    e.stopPropagation();
    onSelect?.(sticker.id);
    const startX = e.clientX;
    const startY = e.clientY;
    const initX = sticker.x_cm;
    const initY = sticker.y_cm;
    (e.target as Element).setPointerCapture(e.pointerId);
    let finalX = initX, finalY = initY;
    const move = (ev: PointerEvent) => {
      const dxCm = (ev.clientX - startX) / scale / PX_PER_CM;
      const dyCm = (ev.clientY - startY) / scale / PX_PER_CM;
      finalX = snapCm(initX + dxCm, snap);
      finalY = snapCm(initY + dyCm, snap);
      onPatch?.(sticker.id, { x_cm: finalX, y_cm: finalY });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      onCommit?.(sticker.id, { x_cm: finalX, y_cm: finalY });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const startResize = (corner: "br" | "tr" | "bl" | "tl") => (e: React.PointerEvent) => {
    if (mode !== "admin") return;
    e.stopPropagation();
    onSelect?.(sticker.id);
    const startX = e.clientX;
    const startY = e.clientY;
    const { x_cm, y_cm, width_cm, height_cm } = sticker;
    let finalPatch: Partial<StickerRow> = {};
    const move = (ev: PointerEvent) => {
      const dxCm = (ev.clientX - startX) / scale / PX_PER_CM;
      const dyCm = (ev.clientY - startY) / scale / PX_PER_CM;
      let nx = x_cm, ny = y_cm, nw = width_cm, nh = height_cm;
      if (corner.includes("r")) nw = Math.max(0.5, width_cm + dxCm);
      if (corner.includes("b")) nh = Math.max(0.5, height_cm + dyCm);
      if (corner.includes("l")) { nw = Math.max(0.5, width_cm - dxCm); nx = x_cm + dxCm; }
      if (corner.includes("t")) { nh = Math.max(0.5, height_cm - dyCm); ny = y_cm + dyCm; }
      finalPatch = {
        x_cm: snapCm(nx, snap), y_cm: snapCm(ny, snap),
        width_cm: snapCm(nw, snap), height_cm: snapCm(nh, snap),
      };
      onPatch?.(sticker.id, finalPatch);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      onCommit?.(sticker.id, finalPatch);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const slotClickable = mode === "viewer";
  const showNumber = sticker.number_enabled && sticker.number != null;

  const numberPos: React.CSSProperties = (() => {
    const base: React.CSSProperties = { position: "absolute", padding: "2px 8px", fontSize: 12, fontWeight: 700, background: "#0f172a", color: "#fff", borderRadius: 999, lineHeight: 1.2 };
    switch (sticker.number_position) {
      case "top-left": return { ...base, top: 6, left: 6 };
      case "top-right": return { ...base, top: 6, right: 6 };
      case "bottom-left": return { ...base, bottom: 6, left: 6 };
      case "bottom-right":
      default: return { ...base, bottom: 6, right: 6 };
    }
  })();

  return (
    <div
      onPointerDown={startDrag}
      onClick={(e) => { e.stopPropagation(); if (slotClickable) onSlotClick?.(sticker); else onSelect?.(sticker.id); }}
      style={{
        position: "absolute",
        left: x, top: y, width: w, height: h,
        transform: `rotate(${sticker.rotation ?? 0}deg)`,
        borderRadius: style.borderRadius ?? 12,
        border: `${style.borderWidth ?? 2}px solid ${style.borderColor ?? "#ffffff"}`,
        boxShadow: style.shadow !== false ? "0 8px 24px -8px rgba(15,23,42,0.45)" : "none",
        background: upload?.file_url ? `url(${upload.file_url}) center/cover no-repeat` : (style.backgroundColor ?? "rgba(15,23,42,0.04)"),
        cursor: mode === "admin" ? "move" : (slotClickable ? "pointer" : "default"),
        outline: selected ? "2px solid hsl(var(--ring))" : "none",
        outlineOffset: 2,
        overflow: "hidden",
      }}
    >
      {!upload && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", color: "#64748b",
          background: "repeating-linear-gradient(45deg, rgba(15,23,42,0.03) 0 8px, transparent 8px 16px)",
        }}>
          {slotClickable && <ImagePlus size={28} />}
          {sticker.title && <div style={{ marginTop: 6, fontWeight: 600, fontSize: 14 }}>{sticker.title}</div>}
          {sticker.caption && <div style={{ fontSize: 11, opacity: 0.7 }}>{sticker.caption}</div>}
        </div>
      )}
      {showNumber && <div style={numberPos}>#{sticker.number}</div>}
      {sticker.title && upload && (
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "6px 8px", background: "linear-gradient(transparent, rgba(0,0,0,0.65))", color: "#fff", fontWeight: 600, fontSize: 12 }}>
          {sticker.title}
        </div>
      )}

      {mode === "admin" && selected && (
        <>
          {(["tl","tr","bl","br"] as const).map((c) => (
            <div
              key={c}
              onPointerDown={startResize(c)}
              style={{
                position: "absolute", width: 12, height: 12, background: "#fff",
                border: "2px solid hsl(var(--ring))", borderRadius: 3, zIndex: 5,
                cursor: c === "tl" || c === "br" ? "nwse-resize" : "nesw-resize",
                top: c.includes("t") ? -6 : undefined,
                bottom: c.includes("b") ? -6 : undefined,
                left: c.includes("l") ? -6 : undefined,
                right: c.includes("r") ? -6 : undefined,
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}