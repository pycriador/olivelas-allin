import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type MouseEvent,
} from "react";

import { NumberCard } from "./number-card";
import type { NumberGridController } from "../../hooks/use-number-grid";
import { buildNumberStateMap, resolveNumberStatus } from "../../hooks/use-realtime-campaign";
import { formatGridNumber } from "@/services/campaign-number.service";
import { cn } from "@/lib/utils";
import type { CampaignNumber } from "@/types/campaign-number";
import type { Campaign } from "@/types/campaign";

interface DragState {
  anchor: number;
  current: number;
  active: boolean;
  moved: boolean;
  pointerId: number | null;
  pointerType: string;
  startX: number;
  startY: number;
}

const DOUBLE_TAP_MS = 320;
const DRAG_THRESHOLD_PX = 12;
const LONG_PRESS_MS = 480;

export interface NumberGridProps {
  campaign: Campaign;
  numbers: CampaignNumber[];
  now: number;
  selected: ReadonlySet<number>;
  onToggle: (number: number) => void;
  onSelectDragRange: (from: number, to: number) => void;
  selectionDisabled: boolean;
  controller: NumberGridController;
  className?: string;
  /** Desktop double-click / mobile double-tap */
  requireDoubleTap?: boolean;
  onDoubleClick?: (number: number) => void;
  onContextMenu?: (event: MouseEvent<HTMLButtonElement>, number: number) => void;
  /** Mobile long-press fallback for admin edit menu */
  onLongPress?: (number: number) => void;
  compact?: boolean;
}

export function NumberGrid({
  campaign,
  numbers,
  now,
  selected,
  onToggle,
  onSelectDragRange,
  selectionDisabled,
  controller,
  className,
  requireDoubleTap = true,
  onDoubleClick,
  onContextMenu,
  onLongPress,
  compact = false,
}: NumberGridProps) {
  const stateMap = buildNumberStateMap(numbers);
  const getStatus = (number: number) => resolveNumberStatus(stateMap.get(number) ?? null, now);

  const dragRef = useRef<DragState>({
    anchor: 0,
    current: 0,
    active: false,
    moved: false,
    pointerId: null,
    pointerType: "mouse",
    startX: 0,
    startY: 0,
  });
  const lastTapRef = useRef<{ number: number; at: number } | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  // Quando um double-tap por touch é detectado via pointerup, o dblclick nativo
  // dispara logo em seguida no navegador — este timestamp suprime esse segundo disparo.
  const suppressNativeDblClickRef = useRef<number>(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const end = (event: PointerEvent) => {
      // Qualquer liberação do dedo/tecla cancela um long-press pendente
      if (longPressTimerRef.current != null) {
        window.clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      const drag = dragRef.current;
      if (!drag.active) return;
      if (drag.pointerId != null && event.pointerId !== drag.pointerId) return;

      const wasDrag = drag.moved;
      const number = drag.current || drag.anchor;
      const pointerType = drag.pointerType;
      drag.active = false;
      drag.pointerId = null;
      setIsDragging(false);

      if (wasDrag) return;

      // Touch / pen: double-tap para alternar (dblclick nativo é lento/não confiável).
      if (pointerType === "touch" || pointerType === "pen") {
        const nowTs = Date.now();
        const last = lastTapRef.current;
        if (last && last.number === number && nowTs - last.at <= DOUBLE_TAP_MS) {
          lastTapRef.current = null;
          suppressNativeDblClickRef.current = nowTs;
          if (onDoubleClick) onDoubleClick(number);
          else onToggle(number);
        } else {
          lastTapRef.current = { number, at: nowTs };
        }
        return;
      }

      // Mouse desktop: clique simples só alterna quando double-tap não é exigido.
      // Sem a supressão, dois cliques + dblclick nativo resultariam em 3 toggles.
      if (!requireDoubleTap) {
        suppressNativeDblClickRef.current = Date.now();
        onToggle(number);
      }
    };

    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      if (longPressTimerRef.current != null) window.clearTimeout(longPressTimerRef.current);
    };
  }, [onToggle, onDoubleClick, requireDoubleTap]);

  function clearLongPress() {
    if (longPressTimerRef.current != null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (selectionDisabled) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const number = Number(event.currentTarget.dataset["number"]);
    // Allow vertical scroll on touch: don't preventDefault immediately
    if (event.pointerType === "mouse") {
      event.preventDefault();
    }

    dragRef.current = {
      anchor: number,
      current: number,
      active: true,
      moved: false,
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      startX: event.clientX,
      startY: event.clientY,
    };
    setIsDragging(false);

    // Long-press for admin edit on occupied numbers is handled via canEdit path.
    // For selectable cells, long-press is not used.
    clearLongPress();
  }

  function handlePointerEnter(number: number) {
    const drag = dragRef.current;
    if (!drag.active) return;
    // Mouse: arrastar sobre células marca um intervalo
    if (drag.pointerType === "mouse" && drag.current !== number) {
      drag.current = number;
      drag.moved = true;
      setIsDragging(true);
      onSelectDragRange(drag.anchor, number);
    }
  }

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag.active || drag.pointerId !== event.pointerId) return;

      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      const dist = Math.hypot(dx, dy);

      if (!drag.moved && dist < DRAG_THRESHOLD_PX) return;

      // Touch: prefer vertical scroll — cancel selection drag if mostly vertical
      if (drag.pointerType === "touch" && !drag.moved && Math.abs(dy) > Math.abs(dx) * 1.2) {
        drag.active = false;
        drag.pointerId = null;
        setIsDragging(false);
        clearLongPress();
        lastTapRef.current = null;
        return;
      }

      // Mouse multi-select by drag; touch multi-select only horizontal-ish
      if (
        drag.pointerType === "mouse" ||
        (drag.pointerType === "touch" && Math.abs(dx) >= Math.abs(dy))
      ) {
        drag.moved = true;
        setIsDragging(true);
        clearLongPress();
        const el = document.elementFromPoint(event.clientX, event.clientY);
        const btn = el?.closest?.("[data-number]") as HTMLElement | null;
        if (btn?.dataset?.["number"]) {
          const number = Number(btn.dataset["number"]);
          if (!Number.isNaN(number) && drag.current !== number) {
            drag.current = number;
            onSelectDragRange(drag.anchor, number);
          }
        }
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [onSelectDragRange]);

  // Click / long-press on non-selectable (admin edit)
  function handleOccupiedPointerDown(event: ReactPointerEvent<HTMLButtonElement>, number: number) {
    if (!onLongPress && !onContextMenu) return;
    if (event.pointerType === "mouse") {
      if (onContextMenu) {
        onContextMenu(event as unknown as MouseEvent<HTMLButtonElement>, number);
      } else if (onLongPress) {
        onLongPress(number);
      }
      return;
    }
    clearLongPress();
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTimerRef.current = null;
      if (navigator.vibrate) navigator.vibrate(12);
      onLongPress?.(number);
    }, LONG_PRESS_MS);
  }

  const visibleNumbers: number[] = [];
  for (let index = controller.visibleStartIndex; index < controller.visibleEndIndex; index++) {
    const number = controller.items[index];
    if (number != null) visibleNumbers.push(number);
  }

  return (
    <div
      ref={controller.containerRef}
      onScroll={controller.onScroll}
      className={cn(
        "relative overflow-auto overscroll-y-contain rounded-xl border bg-card",
        "h-[min(62dvh,520px)] sm:h-[560px]",
        isDragging && "select-none",
        className,
      )}
      style={{ touchAction: "pan-y", WebkitOverflowScrolling: "touch" }}
      aria-label="Grade de números"
    >
      {controller.visibleEndIndex <= 0 ? (
        <p className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
          Nenhum número encontrado para este filtro.
        </p>
      ) : (
        <div style={{ height: controller.totalHeight, position: "relative" }}>
          <div
            className="grid gap-1.5 p-2 sm:gap-2"
            style={{
              transform: `translateY(${controller.startOffset}px)`,
              gridTemplateColumns: `repeat(${controller.columns}, minmax(0, 1fr))`,
            }}
          >
            {visibleNumbers.map((number) => {
              const status = getStatus(number);
              const selectable =
                !selectionDisabled && status === "AVAILABLE" && campaign.status === "ACTIVE";
              const canEdit = Boolean(onContextMenu || onLongPress) && !selectable;

              return (
                <NumberCard
                  key={number}
                  number={number}
                  label={formatGridNumber(number, campaign.number_end)}
                  status={status}
                  selected={selected.has(number)}
                  highlight={controller.highlightNumber === number}
                  selectable={selectable}
                  compact={compact}
                  onPointerDown={(event) => {
                    if (canEdit) {
                      handleOccupiedPointerDown(event, number);
                      return;
                    }
                    handlePointerDown(event);
                  }}
                  onPointerEnter={() => handlePointerEnter(number)}
                  onPointerUp={() => {
                    clearLongPress();
                  }}
                  onDoubleClick={(n) => {
                    // Desktop: dblclick nativo. Ignora quando o double-tap por
                    // touch já tratou a seleção (evita alternar duas vezes).
                    if (Date.now() - suppressNativeDblClickRef.current < DOUBLE_TAP_MS * 3) return;
                    if (onDoubleClick) onDoubleClick(n);
                    else onToggle(n);
                  }}
                  {...(onContextMenu ? { onContextMenu } : {})}
                  {...(onLongPress ? { onLongPress } : {})}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
