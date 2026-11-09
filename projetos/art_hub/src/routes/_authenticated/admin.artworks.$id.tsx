import { createFileRoute, notFound } from "@tanstack/react-router";
import { useRef } from "react";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { ArtworkForm, type ArtworkFormHandle } from "@/components/artworks/artwork-form";
import { ArtworkAIPanel } from "@/components/artworks/artwork-ai-panel";
import { artworksRepo } from "@/lib/repositories/artworks";
import { Palette } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/artworks/$id")({
  loader: async ({ params }) => {
    const artwork = await artworksRepo.getById(params.id);
    if (!artwork) throw notFound();
    return { artwork };
  },
  component: EditArtwork,
  notFoundComponent: () => (
    <div className="space-y-8">
      <PageHeader title="Arte não encontrada" description="O ID informado não existe." />
      <EmptyState icon={Palette} title="Arte não encontrada" description="Verifique o ID e tente novamente." />
    </div>
  ),
});

function EditArtwork() {
  const { artwork } = Route.useLoaderData();
  const formRef = useRef<ArtworkFormHandle>(null);

  return (
    <div className="space-y-8">
      <PageHeader title={artwork.title} description="Editar arte" />
      <ArtworkForm ref={formRef} initial={artwork} />
      <ArtworkAIPanel
        artworkId={artwork.id}
        hasImage={!!artwork.image_url}
        onAutoFill={(title, description) => {
          if (title) formRef.current?.setValue("title", title);
          if (description) formRef.current?.setValue("description", description);
        }}
      />
    </div>
  );
}
