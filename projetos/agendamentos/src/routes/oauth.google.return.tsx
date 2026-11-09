import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { completeGoogleConnection } from "@/integrations/google/google-calendar.functions";

export const Route = createFileRoute("/oauth/google/return")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Conectando Google — ClinicFlow" },
      { name: "description", content: "Finalizando a conexão com o Google Calendar." },
    ],
  }),
  component: OAuthReturn,
});

const CONNECTOR_ID = "google_calendar";

function OAuthReturn() {
  const [message, setMessage] = useState("Finalizando conexão com o Google…");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const notifyOpenerAndClose = (
      type: "appUserConnectorOAuthComplete" | "appUserConnectorOAuthFailed",
    ) => {
      window.opener?.postMessage(
        { type, connectorId: CONNECTOR_ID },
        window.location.origin,
      );
      window.close();
    };

    if (params.get("success") !== "true") {
      setMessage(params.get("error") ?? "A autorização não foi concluída.");
      notifyOpenerAndClose("appUserConnectorOAuthFailed");
      return;
    }

    const code = params.get("code");
    if (!code) {
      if (params.get("offline_access_allowed") === "false") {
        notifyOpenerAndClose("appUserConnectorOAuthComplete");
        return;
      }
      setMessage("A autorização terminou sem código de troca.");
      notifyOpenerAndClose("appUserConnectorOAuthFailed");
      return;
    }

    void completeGoogleConnection({ data: { code } })
      .then(() => notifyOpenerAndClose("appUserConnectorOAuthComplete"))
      .catch((err) => {
        console.error(err);
        setMessage("Não foi possível concluir a conexão.");
        notifyOpenerAndClose("appUserConnectorOAuthFailed");
      });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
