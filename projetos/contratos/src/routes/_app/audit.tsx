import { createFileRoute } from "@tanstack/react-router";
import { AuditPage } from "@/features/audit/ui/audit-page";

export const Route = createFileRoute("/_app/audit")({
  component: AuditPage,
});
