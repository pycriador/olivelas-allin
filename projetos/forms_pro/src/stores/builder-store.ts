import { create } from "zustand";
import {
  createField,
  createPage,
  uid,
  type FieldType,
  type FormDefinition,
  type FormField,
  type FormPage,
} from "@/types/forms";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface HistoryEntry {
  pages: FormPage[];
}

interface BuilderState {
  form: FormDefinition | null;
  pages: FormPage[];
  activePageId: string | null;
  selectedFieldId: string | null;
  past: HistoryEntry[];
  future: HistoryEntry[];
  dirty: boolean;
  saveStatus: SaveStatus;
  lastSavedAt: string | null;

  load: (form: FormDefinition) => void;
  reset: () => void;
  setActivePage: (id: string) => void;
  selectField: (id: string | null) => void;

  addField: (type: FieldType, index?: number) => void;
  updateField: (id: string, patch: Partial<FormField>) => void;
  removeField: (id: string) => void;
  duplicateField: (id: string) => void;
  moveField: (from: number, to: number) => void;

  addPage: () => void;
  updatePage: (id: string, patch: Partial<FormPage>) => void;
  removePage: (id: string) => void;
  duplicatePage: (id: string) => void;
  movePage: (from: number, to: number) => void;

  undo: () => void;
  redo: () => void;
  markSaving: () => void;
  markSaved: (at: string) => void;
  markError: () => void;
}

const reorder = <T>(list: T[], from: number, to: number): T[] => {
  const next = [...list];
  const [item] = next.splice(from, 1);
  if (!item) return list;
  next.splice(to, 0, item);
  return next;
};

const withOrder = <T extends { order: number }>(list: T[]): T[] =>
  list.map((item, i) => ({ ...item, order: i }));

export const useBuilderStore = create<BuilderState>()((set, get) => {
  /** Applies a mutation to pages, pushing the previous state onto history */
  const commit = (mutate: (pages: FormPage[]) => FormPage[]) => {
    const { pages, past } = get();
    set({
      past: [...past, { pages }].slice(-50),
      future: [],
      pages: mutate(pages),
      dirty: true,
    });
  };

  const mutateActivePage = (
    pages: FormPage[],
    activePageId: string | null,
    fn: (fields: FormField[]) => FormField[],
  ) =>
    pages.map((p) => (p.id === activePageId ? { ...p, fields: withOrder(fn(p.fields)) } : p));

  return {
    form: null,
    pages: [],
    activePageId: null,
    selectedFieldId: null,
    past: [],
    future: [],
    dirty: false,
    saveStatus: "idle",
    lastSavedAt: null,

    load(form) {
      set({
        form,
        pages: structuredClone(form.pages),
        activePageId: form.pages[0]?.id ?? null,
        selectedFieldId: null,
        past: [],
        future: [],
        dirty: false,
        saveStatus: "idle",
        lastSavedAt: form.updatedAt,
      });
    },
    reset() {
      set({
        form: null,
        pages: [],
        activePageId: null,
        selectedFieldId: null,
        past: [],
        future: [],
        dirty: false,
        saveStatus: "idle",
        lastSavedAt: null,
      });
    },
    setActivePage(id) {
      set({ activePageId: id, selectedFieldId: null });
    },
    selectField(id) {
      set({ selectedFieldId: id });
    },

    addField(type, index) {
      const { activePageId, pages } = get();
      const page = pages.find((p) => p.id === activePageId);
      if (!page) return;
      const field = createField(type, page.fields.length);
      commit((current) =>
        mutateActivePage(current, activePageId, (fields) => {
          const next = [...fields];
          next.splice(index ?? next.length, 0, field);
          return next;
        }),
      );
      set({ selectedFieldId: field.id });
    },
    updateField(id, patch) {
      const { activePageId } = get();
      commit((current) =>
        mutateActivePage(current, activePageId, (fields) =>
          fields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
        ),
      );
    },
    removeField(id) {
      const { activePageId, selectedFieldId } = get();
      commit((current) =>
        mutateActivePage(current, activePageId, (fields) => fields.filter((f) => f.id !== id)),
      );
      if (selectedFieldId === id) set({ selectedFieldId: null });
    },
    duplicateField(id) {
      const { activePageId } = get();
      let newId: string | null = null;
      commit((current) =>
        mutateActivePage(current, activePageId, (fields) => {
          const idx = fields.findIndex((f) => f.id === id);
          if (idx < 0) return fields;
          const src = fields[idx]!;
          newId = uid("fld");
          const copy: FormField = {
            ...structuredClone(src),
            id: newId,
            options: src.options.map((o) => ({ ...o, id: uid("opt") })),
          };
          const next = [...fields];
          next.splice(idx + 1, 0, copy);
          return next;
        }),
      );
      if (newId) set({ selectedFieldId: newId });
    },
    moveField(from, to) {
      if (from === to) return;
      const { activePageId } = get();
      commit((current) =>
        mutateActivePage(current, activePageId, (fields) => reorder(fields, from, to)),
      );
    },

    addPage() {
      const { pages } = get();
      const page = createPage(pages.length, `Página ${pages.length + 1}`);
      commit((current) => withOrder([...current, page]));
      set({ activePageId: page.id, selectedFieldId: null });
    },
    updatePage(id, patch) {
      commit((current) => current.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    },
    removePage(id) {
      const { pages, activePageId } = get();
      if (pages.length <= 1) return;
      commit((current) => withOrder(current.filter((p) => p.id !== id)));
      if (activePageId === id) {
        const remaining = get().pages;
        set({ activePageId: remaining[0]?.id ?? null, selectedFieldId: null });
      }
    },
    duplicatePage(id) {
      let newId: string | null = null;
      commit((current) => {
        const idx = current.findIndex((p) => p.id === id);
        if (idx < 0) return current;
        const src = current[idx]!;
        newId = uid("pg");
        const copy: FormPage = {
          ...structuredClone(src),
          id: newId,
          title: `${src.title} (cópia)`,
          fields: src.fields.map((f) => ({
            ...structuredClone(f),
            id: uid("fld"),
            options: f.options.map((o) => ({ ...o, id: uid("opt") })),
          })),
        };
        const next = [...current];
        next.splice(idx + 1, 0, copy);
        return withOrder(next);
      });
      if (newId) set({ activePageId: newId, selectedFieldId: null });
    },
    movePage(from, to) {
      if (from === to) return;
      commit((current) => withOrder(reorder(current, from, to)));
    },

    undo() {
      const { past, future, pages } = get();
      const previous = past[past.length - 1];
      if (!previous) return;
      set({
        past: past.slice(0, -1),
        future: [{ pages }, ...future].slice(0, 50),
        pages: previous.pages,
        dirty: true,
      });
    },
    redo() {
      const { past, future, pages } = get();
      const next = future[0];
      if (!next) return;
      set({
        past: [...past, { pages }].slice(-50),
        future: future.slice(1),
        pages: next.pages,
        dirty: true,
      });
    },

    markSaving() {
      set({ saveStatus: "saving" });
    },
    markSaved(at) {
      set({ saveStatus: "saved", lastSavedAt: at, dirty: false });
    },
    markError() {
      set({ saveStatus: "error" });
    },
  };
});
