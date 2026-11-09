import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/useTenant";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RaffleHub — SaaS multiempresa para campanhas" },
      {
        name: "description",
        content:
          "RaffleHub é a plataforma multiempresa para gerir organizações, equipes, planos e campanhas com isolamento total de dados.",
      },
      { property: "og:title", content: "RaffleHub — SaaS multiempresa para campanhas" },
      {
        property: "og:description",
        content: "Gerencie organizações, equipes, planos e campanhas com isolamento total de dados.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUser();

  useEffect(() => {
    if (isPending) return;
    void navigate({ to: user ? "/dashboard" : "/auth", replace: true });
  }, [isPending, user, navigate]);

  return (
    <div className="grid min-h-screen place-items-center bg-muted/40">
      <Skeleton className="h-10 w-48" />
    </div>
  );
}
