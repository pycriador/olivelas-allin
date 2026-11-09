import { createFileRoute } from "@tanstack/react-router";
import { AICostsPage } from "@/features/ai/ui/ai-costs";

export const Route = createFileRoute("/_app/ai/costs")({
  component: AICostsPage,
});
