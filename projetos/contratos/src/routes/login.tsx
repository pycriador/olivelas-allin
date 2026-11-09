import { createFileRoute } from "@tanstack/react-router";
import { LoginPage, type LoginView } from "@/features/auth/ui/login-page";

function validateSearch(search: Record<string, unknown>): { view?: LoginView } {
  const raw = search["view"];
  if (raw === "signup" || raw === "forgot" || raw === "login") {
    return { view: raw };
  }
  return { view: "login" };
}

export const Route = createFileRoute("/login")({
  validateSearch,
  component: LoginRouteComponent,
});

function LoginRouteComponent() {
  const { view = "login" } = Route.useSearch();
  return <LoginPage view={view} />;
}
