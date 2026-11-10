// Builder store — Zustand + zundo (undo/redo) holds the entire live schema.
// The editor UI, DnD sort handlers, inspector, and autosave loop all subscribe
// here. Persistence itself is not in the store; the autosave hook reads
// `schema` and pushes to the server function.

import { create } from "zustand";
import { temporal } from "zundo";
import { nanoid } from "nanoid";
import type { Field, FieldType, FormSchema, Page } from "./types";
import { emptySchema } from "./types";
import { createField, isDisplayField } from "@/modules/form-fields/registry";

type BuilderState = {
  formId: string | null;
  title: string;
  schema: FormSchema;
  selectedFieldId: string | null;
  activePageId: string;
  dirty: boolean;

  hydrate: (input: { formId: string; title: string; schema: FormSchema }) => void;
  markSaved: () => void;

  setTitle: (title: string) => void;
  setActivePage: (pageId: string) => void;
  selectField: (id: string | null) => void;

  addField: (type: FieldType, index?: number) => void;
  moveField: (from: number, to: number) => void;
  updateField: (id: string, patch: Partial<Field>) => void;
  duplicateField: (id: string) => void;
  removeField: (id: string) => void;

  addPage: () => void;
  removePage: (id: string) => void;
  renamePage: (id: string, title: string) => void;
};

function activePage(schema: FormSchema, pageId: string): Page {
  return schema.pages.find((p) => p.id === pageId) ?? schema.pages[0];
}

function replacePage(schema: FormSchema, next: Page): FormSchema {
  return { ...schema, pages: schema.pages.map((p) => (p.id === next.id ? next : p)) };
}

export const useBuilder = create<BuilderState>()(
  temporal(
    (set, get) => ({
      formId: null,
      title: "Sem título",
      schema: emptySchema(),
      selectedFieldId: null,
      activePageId: "p1",
      dirty: false,

      hydrate: ({ formId, title, schema }) =>
        set({
          formId,
          title,
          schema,
          activePageId: schema.pages[0]?.id ?? "p1",
          selectedFieldId: null,
          dirty: false,
        }),
      markSaved: () => set({ dirty: false }),

      setTitle: (title) => set({ title, dirty: true }),
      setActivePage: (pageId) => set({ activePageId: pageId, selectedFieldId: null }),
      selectField: (id) => set({ selectedFieldId: id }),

      addField: (type, index) => {
        const { schema, activePageId } = get();
        const page = activePage(schema, activePageId);
        const field = createField(type);
        const nextFields = [...page.fields];
        const at = index ?? nextFields.length;
        nextFields.splice(at, 0, field);
        set({
          schema: replacePage(schema, { ...page, fields: nextFields }),
          selectedFieldId: isDisplayField(type) ? null : field.id,
          dirty: true,
        });
      },
      moveField: (from, to) => {
        const { schema, activePageId } = get();
        const page = activePage(schema, activePageId);
        if (from === to || from < 0 || to < 0) return;
        const next = [...page.fields];
        const [m] = next.splice(from, 1);
        next.splice(to, 0, m);
        set({ schema: replacePage(schema, { ...page, fields: next }), dirty: true });
      },
      updateField: (id, patch) => {
        const { schema, activePageId } = get();
        const page = activePage(schema, activePageId);
        set({
          schema: replacePage(schema, {
            ...page,
            fields: page.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
          }),
          dirty: true,
        });
      },
      duplicateField: (id) => {
        const { schema, activePageId } = get();
        const page = activePage(schema, activePageId);
        const idx = page.fields.findIndex((f) => f.id === id);
        if (idx < 0) return;
        const clone: Field = {
          ...page.fields[idx],
          id: nanoid(8),
          name: `${page.fields[idx].name}_copy`,
        };
        const next = [...page.fields];
        next.splice(idx + 1, 0, clone);
        set({
          schema: replacePage(schema, { ...page, fields: next }),
          selectedFieldId: clone.id,
          dirty: true,
        });
      },
      removeField: (id) => {
        const { schema, activePageId, selectedFieldId } = get();
        const page = activePage(schema, activePageId);
        set({
          schema: replacePage(schema, {
            ...page,
            fields: page.fields.filter((f) => f.id !== id),
          }),
          selectedFieldId: selectedFieldId === id ? null : selectedFieldId,
          dirty: true,
        });
      },

      addPage: () => {
        const { schema } = get();
        const page: Page = { id: nanoid(6), title: `Página ${schema.pages.length + 1}`, fields: [] };
        set({
          schema: { ...schema, pages: [...schema.pages, page] },
          activePageId: page.id,
          dirty: true,
        });
      },
      removePage: (id) => {
        const { schema, activePageId } = get();
        if (schema.pages.length <= 1) return;
        const nextPages = schema.pages.filter((p) => p.id !== id);
        set({
          schema: { ...schema, pages: nextPages },
          activePageId: activePageId === id ? nextPages[0].id : activePageId,
          dirty: true,
        });
      },
      renamePage: (id, title) => {
        const { schema } = get();
        set({
          schema: {
            ...schema,
            pages: schema.pages.map((p) => (p.id === id ? { ...p, title } : p)),
          },
          dirty: true,
        });
      },
    }),
    {
      // Only version the schema graph — not selection/dirty flags.
      partialize: (s) => ({ schema: s.schema, title: s.title }) as Partial<BuilderState>,
      limit: 100,
    },
  ),
);

export const useBuilderTemporal = useBuilder.temporal;