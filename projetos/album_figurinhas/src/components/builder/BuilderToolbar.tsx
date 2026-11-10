import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { Magnet, Plus, Redo2, Undo2, ZoomIn, ZoomOut, Grid3X3, FileDown } from "lucide-react";

type Props = {
  zoom: number;
  snap: boolean;
  onZoom: (z: number) => void;
  onToggleSnap: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onAddSticker: () => void;
  onAddGrid: () => void;
  onExportPage: () => void;
  onExportAlbum: () => void;
  exporting?: boolean;
};

export function BuilderToolbar({ zoom, snap, onZoom, onToggleSnap, onUndo, onRedo, onAddSticker, onAddGrid, onExportPage, onExportAlbum, exporting }: Props) {
  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-border/60 bg-card/70 backdrop-blur">
      <Button size="sm" onClick={onAddSticker}><Plus className="w-4 h-4 mr-1" />Figurinha</Button>
      <Button size="sm" variant="outline" onClick={onAddGrid}><Grid3X3 className="w-4 h-4 mr-1" />Grid</Button>
      <Separator orientation="vertical" className="mx-2 h-6" />
      <Button size="icon" variant="ghost" onClick={onUndo}><Undo2 className="w-4 h-4" /></Button>
      <Button size="icon" variant="ghost" onClick={onRedo}><Redo2 className="w-4 h-4" /></Button>
      <Separator orientation="vertical" className="mx-2 h-6" />
      <Toggle pressed={snap} onPressedChange={onToggleSnap} aria-label="Snap"><Magnet className="w-4 h-4" /></Toggle>
      <Separator orientation="vertical" className="mx-2 h-6" />
      <Button size="icon" variant="ghost" onClick={() => onZoom(zoom - 0.1)}><ZoomOut className="w-4 h-4" /></Button>
      <div className="text-xs w-12 text-center tabular-nums">{Math.round(zoom * 100)}%</div>
      <Button size="icon" variant="ghost" onClick={() => onZoom(zoom + 0.1)}><ZoomIn className="w-4 h-4" /></Button>
      <div className="ml-auto flex items-center gap-2">
        <Button size="sm" variant="outline" disabled={exporting} onClick={onExportPage}><FileDown className="w-4 h-4 mr-1" />PDF página</Button>
        <Button size="sm" disabled={exporting} onClick={onExportAlbum}><FileDown className="w-4 h-4 mr-1" />PDF álbum</Button>
      </div>
    </div>
  );
}