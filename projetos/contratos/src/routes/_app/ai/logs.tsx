import { createFileRoute } from "@tanstack/react-router";
import { AILogsPage } from "@/features/ai/ui/ai-logs";

export const Route = createFileRoute("/_app/ai/logs")({
  component: AILogsPage,
});
