import type { PointerEvent, MouseEvent } from "react";

import { cn } from "@/lib/utils";
import { NUMBER_STATUS_CLASSES } from "./number-visuals";
import type { NumberGridStatus } from "@/types/campaign-number";

export interface NumberCardProps {
  number: number;
  label: string;
  status: NumberGridStatus;
  selected: boolean;
  highlight: boolean;
  selectable: boolean;
  compact?: boolean;
  onPointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerEnter: () => void;
  onPointerUp?: (event: PointerEvent<HTMLButtonElement>) => void;
  onDoubleClick?: (number: number) => void;
  onContextMenu?: (event: MouseEvent<HTMLButtonElement>, number: number) => void;
  onLongPress?: (number: number) => void;
}

export function NumberCard({
  number,
  label,
  status,
  selected,
  highlight,
  selectable,
  compact = false,
  onPointerDown,
  onPointerEnter,
  onPointerUp,
  onDoubleClick,
  onContextMenu,
  onLongPress,
}: NumberCardProps) {
  const canEdit = Boolean(onContextMenu || onLongPress) && !selectable;

  return (
    <button
      type="button"
      data-number={number}
      aria-pressed={selected}
      aria-label={`Número ${label}${
        canEdit
          ? " — toque longo ou clique para editar"
          : selectable
            ? " — toque duas vezes para selecionar"
            : ""
      }`}
      title={
        canEdit
          ? "Toque longo / clique para editar o status"
          : selectable
            ? "Toque duas vezes para selecionar"
            : undefined
      }
      disabled={!selectable && !canEdit}
      onPointerDown={onPointerDown}
      onPointerEnter={onPointerEnter}
      onPointerUp={onPointerUp}
      onDoubleClick={
        onDoubleClick
          ? (event) => {
              event.preventDefault();
              event.stopPropagation();
              onDoubleClick(number);
            }
          : undefined
      }
      onClick={
        canEdit
          ? (event) => {
              event.preventDefault();
              if (onContextMenu) {
                onContextMenu(event as unknown as MouseEvent<HTMLButtonElement>, number);
              } else if (onLongPress) {
                onLongPress(number);
              }
            }
          : undefined
      }
      onContextMenu={(event) => {
        event.preventDefault();
        onContextMenu?.(event, number);
      }}
      className={cn(
        "flex select-none items-center justify-center rounded-md border font-medium tabular-nums transition-colors",
        compact ? "h-10 min-h-10 text-xs sm:h-11 sm:text-sm" : "h-11 min-h-11 text-sm sm:h-12",
        "active:scale-[0.97]",
        NUMBER_STATUS_CLASSES[status],
        selected &&
          "ring-2 ring-primary ring-offset-1 ring-offset-background hover:bg-primary/10 sm:ring-offset-2",
        highlight && "animate-pulse ring-2 ring-ring ring-offset-1 ring-offset-background",
        selectable
          ? "cursor-pointer touch-manipulation"
          : canEdit
            ? "cursor-pointer touch-manipulation hover:brightness-110"
            : "cursor-not-allowed opacity-90",
      )}
      style={{
        touchAction: selectable ? "manipulation" : "manipulation",
        WebkitUserSelect: "none",
      }}
    >
      {label}
    </button>
  );
}
