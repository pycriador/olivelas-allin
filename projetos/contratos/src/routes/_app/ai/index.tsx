import { createFileRoute } from "@tanstack/react-router";
import { AIDashboardPage } from "@/features/ai/ui/ai-dashboard";

export const Route = createFileRoute("/_app/ai/")({
  component: AIDashboardPage,
});
