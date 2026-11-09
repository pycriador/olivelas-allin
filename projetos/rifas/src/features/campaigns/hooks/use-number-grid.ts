import { useEffect, useMemo, useRef, useState, type RefObject, type UIEvent } from "react";

import { buildNumberRange } from "@/services/campaign-number.service";
import type { NumberGridStatus } from "@/types/campaign-number";

export const NUMBER_FILTER_VALUES = ["ALL", "AVAILABLE", "RESERVED", "PAID", "BLOCKED"] as const;

export type NumberFilterValue = (typeof NUMBER_FILTER_VALUES)[number];

export const NUMBER_FILTER_LABELS: Record<NumberFilterValue, string> = {
  ALL: "Todos",
  AVAILABLE: "Disponíveis",
  RESERVED: "Reservados",
  PAID: "Pagos",
  BLOCKED: "Bloqueados",
};

const CELL_MIN_WIDTH = 52;
const ROW_HEIGHT = 56;
const GRID_GAP = 8;
const OVERSCAN_ROWS = 3;

export function statusMatchesFilter(status: NumberGridStatus, filter: NumberFilterValue): boolean {
  switch (filter) {
    case "ALL":
      return true;
    case "AVAILABLE":
      return status === "AVAILABLE";
    case "RESERVED":
      return status === "RESERVED" || status === "PENDING_PAYMENT";
    case "PAID":
      return status === "PAID" || status === "WINNER";
    case "BLOCKED":
      return status === "BLOCKED" || status === "CANCELLED";
    default:
      return true;
  }
}

export interface UseNumberGridOptions {
  numberStart: number;
  numberEnd: number;
  getStatus: (number: number) => NumberGridStatus;
  filter: NumberFilterValue;
  onFilterChange: (filter: NumberFilterValue) => void;
}

export interface NumberGridController {
  containerRef: RefObject<HTMLDivElement | null>;
  onScroll: (event: UIEvent<HTMLDivElement>) => void;
  columns: number;
  items: number[];
  visibleStartIndex: number;
  visibleEndIndex: number;
  totalHeight: number;
  startOffset: number;
  rowHeight: number;
  highlightNumber: number | null;
  goToNumber: (number: number) => void;
}

export function useNumberGrid(options: UseNumberGridOptions): NumberGridController {
  const { numberStart, numberEnd, getStatus, filter, onFilterChange } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const pendingGoToRef = useRef<number | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [scrollTop, setScrollTop] = useState(0);
  const [highlightNumber, setHighlightNumber] = useState<number | null>(null);
  const highlightTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const update = () => {
      setViewport({ width: element.clientWidth, height: element.clientHeight });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const range = useMemo(() => buildNumberRange(numberStart, numberEnd), [numberStart, numberEnd]);

  const items = useMemo(() => {
    if (filter === "ALL") return range;
    return range.filter((number) => statusMatchesFilter(getStatus(number), filter));
  }, [range, filter, getStatus]);

  const columns = Math.max(
    1,
    Math.floor((viewport.width + GRID_GAP) / (CELL_MIN_WIDTH + GRID_GAP)),
  );
  const totalRows = Math.max(1, Math.ceil(items.length / columns));
  const totalHeight = totalRows * ROW_HEIGHT;

  const startRow = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN_ROWS);
  const endRow = Math.min(
    totalRows,
    Math.ceil((scrollTop + viewport.height) / ROW_HEIGHT) + OVERSCAN_ROWS,
  );
  const visibleStartIndex = startRow * columns;
  const visibleEndIndex = Math.min(items.length, endRow * columns);

  useEffect(() => {
    if (pendingGoToRef.current == null) return;
    const target = pendingGoToRef.current;
    pendingGoToRef.current = null;
    const index = items.indexOf(target);
    if (index < 0) return;
    const row = Math.floor(index / columns);
    const top = Math.max(0, row * ROW_HEIGHT - Math.max(0, viewport.height - ROW_HEIGHT) / 2);
    containerRef.current?.scrollTo({ top, behavior: "smooth" });
    const number = items[index];
    if (number != null) {
      setHighlightNumber(number);
      if (highlightTimerRef.current != null) window.clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = window.setTimeout(() => setHighlightNumber(null), 2200);
    }
  }, [items, columns, viewport]);

  function scrollToIndex(index: number) {
    const row = Math.floor(index / columns);
    const top = Math.max(0, row * ROW_HEIGHT - Math.max(0, viewport.height - ROW_HEIGHT) / 2);
    containerRef.current?.scrollTo({ top, behavior: "smooth" });
    const number = items[index];
    if (number != null) {
      setHighlightNumber(number);
      if (highlightTimerRef.current != null) window.clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = window.setTimeout(() => setHighlightNumber(null), 2200);
    }
  }

  function goToNumber(number: number) {
    const clamped = Math.min(Math.max(number, numberStart), numberEnd);
    const index = items.indexOf(clamped);
    if (index >= 0) {
      scrollToIndex(index);
      return;
    }
    if (filter !== "ALL") {
      pendingGoToRef.current = clamped;
      onFilterChange("ALL");
    }
  }

  return {
    containerRef,
    onScroll: (event) => setScrollTop(event.currentTarget.scrollTop),
    columns,
    items,
    visibleStartIndex,
    visibleEndIndex,
    totalHeight,
    startOffset: startRow * ROW_HEIGHT,
    rowHeight: ROW_HEIGHT,
    highlightNumber,
    goToNumber,
  };
}
