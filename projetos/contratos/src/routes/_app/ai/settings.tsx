import { createFileRoute } from "@tanstack/react-router";
import { AISettingsPage } from "@/features/ai/ui/ai-settings";

export const Route = createFileRoute("/_app/ai/settings")({
  component: AISettingsPage,
});
