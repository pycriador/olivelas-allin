import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { PageRow, StickerRow } from "@/lib/types";

type Snapshot = { pages: PageRow[]; stickersByPage: Record<string, StickerRow[]> };

type State = {
  albumId: string | null;
  currentPageId: string | null;
  selectedStickerId: string | null;
  zoom: number;
  snap: boolean;
  pages: PageRow[];
  stickersByPage: Record<string, StickerRow[]>;
  history: Snapshot[];
  future: Snapshot[];
  setAlbum: (id: string) => void;
  setPages: (pages: PageRow[]) => void;
  setStickers: (pageId: string, stickers: StickerRow[]) => void;
  setCurrentPage: (id: string | null) => void;
  selectSticker: (id: string | null) => void;
  setZoom: (z: number) => void;
  toggleSnap: () => void;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  patchSticker: (id: string, patch: Partial<StickerRow>) => void;
  addStickerLocal: (s: StickerRow) => void;
  removeStickerLocal: (id: string) => void;
};

export const useBuilder = create<State>()(
  immer((set, get) => ({
    albumId: null,
    currentPageId: null,
    selectedStickerId: null,
    zoom: 1,
    snap: true,
    pages: [],
    stickersByPage: {},
    history: [],
    future: [],
    setAlbum: (id) => set((s) => { s.albumId = id; }),
    setPages: (pages) => set((s) => {
      s.pages = pages;
      if (!s.currentPageId && pages[0]) s.currentPageId = pages[0].id;
    }),
    setStickers: (pageId, stickers) => set((s) => { s.stickersByPage[pageId] = stickers; }),
    setCurrentPage: (id) => set((s) => { s.currentPageId = id; s.selectedStickerId = null; }),
    selectSticker: (id) => set((s) => { s.selectedStickerId = id; }),
    setZoom: (z) => set((s) => { s.zoom = Math.max(0.2, Math.min(3, z)); }),
    toggleSnap: () => set((s) => { s.snap = !s.snap; }),
    pushHistory: () => set((s) => {
      s.history.push({ pages: JSON.parse(JSON.stringify(s.pages)), stickersByPage: JSON.parse(JSON.stringify(s.stickersByPage)) });
      if (s.history.length > 50) s.history.shift();
      s.future = [];
    }),
    undo: () => set((s) => {
      const snap = s.history.pop();
      if (!snap) return;
      s.future.push({ pages: s.pages, stickersByPage: s.stickersByPage });
      s.pages = snap.pages;
      s.stickersByPage = snap.stickersByPage;
    }),
    redo: () => set((s) => {
      const snap = s.future.pop();
      if (!snap) return;
      s.history.push({ pages: s.pages, stickersByPage: s.stickersByPage });
      s.pages = snap.pages;
      s.stickersByPage = snap.stickersByPage;
    }),
    patchSticker: (id, patch) => set((s) => {
      for (const pid in s.stickersByPage) {
        const arr = s.stickersByPage[pid];
        const i = arr.findIndex((x) => x.id === id);
        if (i >= 0) { arr[i] = { ...arr[i], ...patch } as StickerRow; return; }
      }
    }),
    addStickerLocal: (st) => set((s) => {
      const arr = s.stickersByPage[st.page_id] ?? [];
      arr.push(st);
      s.stickersByPage[st.page_id] = arr;
      s.selectedStickerId = st.id;
    }),
    removeStickerLocal: (id) => set((s) => {
      for (const pid in s.stickersByPage) {
        s.stickersByPage[pid] = s.stickersByPage[pid].filter((x) => x.id !== id);
      }
      if (s.selectedStickerId === id) s.selectedStickerId = null;
    }),
  }))
);