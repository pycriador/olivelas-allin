const CONNECTOR_ID = "google_calendar";

/** Waits for the OAuth popup to report completion on the app origin. */
export function waitForOAuthCompletion(popup: Window): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let poll: number | undefined;

    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      if (poll !== undefined) window.clearInterval(poll);
    };

    const onMessage = (event: MessageEvent) => {
      const type = (event.data as { type?: string } | null)?.type;
      if (
        event.origin !== window.location.origin ||
        event.source !== popup ||
        (event.data as { connectorId?: string } | null)?.connectorId !== CONNECTOR_ID ||
        (type !== "appUserConnectorOAuthComplete" &&
          type !== "appUserConnectorOAuthFailed")
      ) {
        return;
      }
      cleanup();
      if (type === "appUserConnectorOAuthComplete") {
        resolve();
        return;
      }
      popup.close();
      reject(new Error("A conexão com o Google falhou."));
    };

    window.addEventListener("message", onMessage);
    poll = window.setInterval(() => {
      if (!popup.closed) return;
      cleanup();
      reject(new Error("A janela foi fechada antes de concluir."));
    }, 500);
  });
}

export function openOAuthPopup(): Window {
  const popup = window.open("", "clinicflow-google-oauth", "width=620,height=740");
  if (!popup) {
    throw new Error("Pop-up bloqueado. Libere pop-ups para este site e tente novamente.");
  }
  return popup;
}
