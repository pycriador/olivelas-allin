import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  buildObjectPath,
  encodeStoredImage,
  getPublicUrl,
  validateFile,
  STORAGE_BUCKETS,
} from "@/lib/services/storage";
import { artworksRepo } from "@/lib/repositories/artworks";
import { analyzeArtworks } from "@/lib/ai/analyze-artwork.functions";

export type ImportItemStatus = "queued" | "uploading" | "uploaded" | "analyzing" | "done" | "error";

export interface ImportItem {
  id: string;
  fileName: string;
  fileSize: number;
  previewUrl: string;
  progress: number;
  status: ImportItemStatus;
  error?: string;
  artworkId?: string;
  storedImage?: string;
  code?: string;
  title: string;
  createdAt: number;
}

export interface ImportSettings {
  collectionId: string | null;
  category: string;
  status: "active" | "draft" | "inactive";
  publish: boolean;
  runAI: boolean;
  autoSlug: boolean;
  autoCode: boolean;
  promptSlug?: string | null;
}

export interface ImportState {
  items: ImportItem[];
  settings: ImportSettings;
  running: boolean;
}

const DEFAULT_SETTINGS: ImportSettings = {
  collectionId: null,
  category: "",
  status: "active",
  publish: true,
  runAI: true,
  autoSlug: true,
  autoCode: true,
};

const state: ImportState = {
  items: [],
  settings: DEFAULT_SETTINGS,
  running: false,
};

const listeners = new Set<() => void>();
let snapshotVersion = 0;
let cachedSnapshot: ImportState | null = null;

function emit() {
  snapshotVersion++;
  cachedSnapshot = null;
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot(): ImportState {
  if (cachedSnapshot === null) {
    cachedSnapshot = { ...state, items: [...state.items], settings: { ...state.settings } };
  }
  return cachedSnapshot;
}

function update(mutator: (s: ImportState) => void) {
  mutator(state);
  state.items = [...state.items];
  emit();
}

function patchItem(id: string, patch: Partial<ImportItem>) {
  const i = state.items.findIndex((x) => x.id === id);
  if (i === -1) return;
  state.items[i] = { ...state.items[i], ...patch };
  state.items = [...state.items];
  emit();
}

let seq = 0;
function nextCode() {
  seq += 1;
  const stamp = Date.now().toString(36).slice(-4).toUpperCase();
  return `ART-${stamp}${seq.toString().padStart(2, "0")}`;
}

function titleFromFile(name: string) {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function processItem(item: ImportItem) {
  const s = state.settings;
  if (!s.collectionId) {
    patchItem(item.id, { status: "error", error: "Selecione uma coleção antes de iniciar." });
    return;
  }

  const validation = validateFile(new File([], item.fileName, { type: "image/*" }));
  if (!validation.ok && item.fileSize === 0) {
    patchItem(item.id, { status: "error", error: validation.error });
    return;
  }

  // Retrieve the actual File from queue
  const file = fileMap.get(item.id);
  if (!file) {
    patchItem(item.id, { status: "error", error: "Arquivo perdido" });
    return;
  }

  patchItem(item.id, { status: "uploading", progress: 10 });

  const path = buildObjectPath("items", file.name);
  const bucket = STORAGE_BUCKETS.artworks;

  const timer = setInterval(() => {
    const cur = state.items.find((x) => x.id === item.id);
    if (!cur || cur.status !== "uploading") return;
    if (cur.progress < 80) patchItem(item.id, { progress: cur.progress + 8 });
  }, 220);

  try {
    const { error: upErr } = await supabase.storage
      .from(bucket)
      .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
    clearInterval(timer);
    if (upErr) throw upErr;

    const stored = encodeStoredImage(bucket, path);
    const preview = getPublicUrl(stored) ?? item.previewUrl;

    patchItem(item.id, {
      status: "uploaded",
      progress: 90,
      storedImage: stored,
      previewUrl: preview,
    });

    const title = item.title || titleFromFile(item.fileName);
    const code = s.autoCode ? (item.code ?? nextCode()) : (item.code ?? null);

    const artwork = await artworksRepo.create({
      title,
      code,
      collection_id: s.collectionId,
      image_url: stored,
      status: s.publish ? "active" : s.status,
    } as never);

    patchItem(item.id, { artworkId: artwork.id, progress: 95 });

    if (s.runAI) {
      patchItem(item.id, { status: "analyzing" });
      try {
        const aiParams: { artworkIds: string[]; promptSlug?: string } = { artworkIds: [artwork.id] };
        if (s.promptSlug) aiParams.promptSlug = s.promptSlug;
        await analyzeArtworks({ data: aiParams });
      } catch (e) {
        // Non-fatal: keep artwork
        patchItem(item.id, {
          status: "done",
          progress: 100,
          error: e instanceof Error ? `IA: ${e.message}` : "IA falhou",
        });
        return;
      }
    }

    patchItem(item.id, { status: "done", progress: 100 });
  } catch (err) {
    clearInterval(timer);
    patchItem(item.id, {
      status: "error",
      error: err instanceof Error ? err.message : "Erro no upload",
    });
  } finally {
    retainedFiles.set(item.id, file);
    fileMap.delete(item.id);
  }
}

const fileMap = new Map<string, File>();
const retainedFiles = new Map<string, File>();
const CONCURRENCY = 3;

async function runQueue() {
  if (state.running) return;
  state.running = true;
  emit();
  const pending = () => state.items.filter((i) => i.status === "queued");
  while (pending().length > 0) {
    const batch = pending().slice(0, CONCURRENCY);
    await Promise.all(batch.map((it) => processItem(it)));
  }
  state.running = false;
  emit();
}

export const importStore = {
  subscribe,
  getSnapshot,
  getSettings: () => state.settings,
  setSettings(next: Partial<ImportSettings>) {
    update((s) => {
      s.settings = { ...s.settings, ...next };
    });
  },
  addFiles(files: File[]) {
    const newItems: ImportItem[] = [];
    for (const file of files) {
      const validation = validateFile(file);
      const id = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      const item: ImportItem = {
        id,
        fileName: file.name,
        fileSize: file.size,
        previewUrl,
        progress: 0,
        status: validation.ok ? "queued" : "error",
        error: validation.ok ? undefined : validation.error,
        title: titleFromFile(file.name),
        createdAt: Date.now(),
      };
      if (validation.ok) fileMap.set(id, file);
      newItems.push(item);
    }
    update((s) => {
      s.items = [...s.items, ...newItems];
    });
    void runQueue();
  },
  removeItem(id: string) {
    const it = state.items.find((x) => x.id === id);
    if (it) URL.revokeObjectURL(it.previewUrl);
    fileMap.delete(id);
    update((s) => {
      s.items = s.items.filter((x) => x.id !== id);
    });
  },
  retryItem(id: string) {
    patchItem(id, { status: "queued", progress: 0, error: undefined });
    void runQueue();
  },
  clearCompleted() {
    update((s) => {
      s.items = s.items.filter((x) => x.status !== "done");
    });
  },
  clearAll() {
    state.items.forEach((i) => URL.revokeObjectURL(i.previewUrl));
    fileMap.clear();
    retainedFiles.clear();
    update((s) => {
      s.items = [];
    });
  },
  duplicateItem(id: string) {
    const original = state.items.find((x) => x.id === id);
    if (!original) return;
    const file = retainedFiles.get(id);
    if (file) {
      this.addFiles([file]);
    }
  },
  async moveItemCollection(id: string, collectionId: string) {
    const item = state.items.find((x) => x.id === id);
    if (!item) return;
    patchItem(id, {});
    if (item.artworkId) {
      await artworksRepo.update(item.artworkId, { collection_id: collectionId } as never);
    }
  },
  updateItem(id: string, patch: Partial<ImportItem>) {
    patchItem(id, patch);
  },
  async reprocessAI(ids: string[]) {
    const artworkIds = state.items
      .filter((i) => ids.includes(i.id) && i.artworkId)
      .map((i) => i.artworkId!) as string[];
    if (!artworkIds.length) return;
    ids.forEach((id) => patchItem(id, { status: "analyzing" }));
    try {
      await analyzeArtworks({ data: { artworkIds } });
      ids.forEach((id) => patchItem(id, { status: "done", progress: 100 }));
    } catch (e) {
      ids.forEach((id) =>
        patchItem(id, { status: "error", error: e instanceof Error ? e.message : "Erro IA" }),
      );
    }
  },
};

export function useImportStore(): ImportState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
