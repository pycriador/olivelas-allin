import { createFileRoute } from "@tanstack/react-router";
import { DocumentsPage } from "@/features/documents/ui/documents-page";

export const Route = createFileRoute("/_app/documents")({
  component: DocumentsPage,
});
