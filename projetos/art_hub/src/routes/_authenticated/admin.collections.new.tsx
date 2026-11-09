import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/page-header";
import { CollectionForm } from "@/components/collections/collection-form";

export const Route = createFileRoute("/_authenticated/admin/collections/new")({
  component: NewCollection,
});

function NewCollection() {
  return (
    <div className="space-y-8">
      <PageHeader title="Nova coleção" description="Cadastre uma nova coleção de artes." />
      <CollectionForm />
    </div>
  );
}
