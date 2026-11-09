import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/page-header";
import { ArtworkForm } from "@/components/artworks/artwork-form";

export const Route = createFileRoute("/_authenticated/admin/artworks/new")({
  component: NewArtwork,
});

function NewArtwork() {
  return (
    <div className="space-y-8">
      <PageHeader title="Nova arte" description="Cadastre uma nova arte." />
      <ArtworkForm />
    </div>
  );
}
