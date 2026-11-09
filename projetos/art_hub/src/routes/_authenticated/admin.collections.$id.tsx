import { createFileRoute, notFound } from "@tanstack/react-router";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { CollectionForm } from "@/components/collections/collection-form";
import { collectionsRepo } from "@/lib/repositories/collections";
import { Coffee } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/collections/$id")({
  loader: async ({ params }) => {
    const collection = await collectionsRepo.getById(params.id);
    if (!collection) throw notFound();
    return { collection };
  },
  component: EditCollection,
  notFoundComponent: () => (
    <div className="space-y-8">
      <PageHeader title="Coleção não encontrada" description="O ID informado não existe." />
      <EmptyState icon={Coffee} title="Coleção não encontrada" description="Verifique o ID e tente novamente." />
    </div>
  ),
});

function EditCollection() {
  const { collection } = Route.useLoaderData();
  return (
    <div className="space-y-8">
      <PageHeader title={collection.name} description="Editar coleção" />
      <CollectionForm initial={collection} />
    </div>
  );
}
