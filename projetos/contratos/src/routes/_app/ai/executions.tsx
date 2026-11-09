import { createFileRoute } from "@tanstack/react-router";
import { AIExecutionsPage } from "@/features/ai/ui/ai-executions";

export const Route = createFileRoute("/_app/ai/executions")({
  component: AIExecutionsPage,
});
