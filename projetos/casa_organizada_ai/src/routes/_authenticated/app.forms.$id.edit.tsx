import { createFileRoute, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { getForm } from "@/modules/form-builder/forms.functions";
import { BuilderShell } from "@/modules/form-builder/components/BuilderShell";
import { useBuilder } from "@/modules/form-builder/store";
import { emptySchema, type FormSchema } from "@/modules/form-builder/types";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/app/forms/$id/edit")({
  component: EditForm,
});

function EditForm() {
  const { id } = useParams({ from: "/_authenticated/app/forms/$id/edit" });
  const get = useServerFn(getForm);
  const hydrate = useBuilder((s) => s.hydrate);
  const currentId = useBuilder((s) => s.formId);

  const { data, isLoading, error } = useQuery({
    queryKey: ["forms", id],
    queryFn: () => get({ data: { id } }),
  });

  useEffect(() => {
    if (!data) return;
    const schema = (data.schema && typeof data.schema === "object")
      ? (data.schema as unknown as FormSchema)
      : emptySchema();
    // ensure at least one page
    if (!schema.pages || schema.pages.length === 0) schema.pages = emptySchema().pages;
    if (data.id !== currentId) {
      hydrate({ formId: data.id, title: data.title, schema });
    }
  }, [data, currentId, hydrate]);

  if (isLoading || !data) {
    return (
      <div className="space-y-3 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[70vh] rounded-xl" />
      </div>
    );
  }
  if (error) {
    return <div className="p-6 text-sm text-destructive">Erro ao carregar: {(error as Error).message}</div>;
  }
  return <BuilderShell />;
}