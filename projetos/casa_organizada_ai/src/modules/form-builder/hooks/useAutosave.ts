import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useBuilder } from "@/modules/form-builder/store";
import { saveForm } from "@/modules/form-builder/forms.functions";
import { toast } from "sonner";

export function useAutosave() {
  const save = useServerFn(saveForm);
  const [saving, setSaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useBuilder((s) => s.dirty);
  const formId = useBuilder((s) => s.formId);

  useEffect(() => {
    if (!dirty || !formId) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const state = useBuilder.getState();
      if (!state.formId) return;
      setSaving(true);
      try {
        await save({ data: { id: state.formId, title: state.title, schema: state.schema } });
        useBuilder.getState().markSaved();
      } catch (e) {
        toast.error("Falha ao salvar", { description: (e as Error).message });
      } finally {
        setSaving(false);
      }
    }, 900);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [dirty, formId, save]);

  return { saving };
}