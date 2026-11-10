// Native Olivelas OAuth & Connector Bridge (self-hosted, zero third-party Lovable dependencies)

export interface AuthorizeAppUserOAuthParams {
  gatewayBaseUrl: string;
  connectorId: string;
  appUserId: string;
  clientAPIKey: string;
  returnUrl: string;
  connectionAPIKey?: string;
  credentialsConfiguration?: Record<string, unknown>;
}

export async function authorizeAppUserOAuth(
  params: AuthorizeAppUserOAuthParams,
): Promise<{ authorizationUrl: string }> {
  const res = await fetch(`${params.gatewayBaseUrl}/v1/oauth/authorize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.clientAPIKey}`,
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    throw new Error(`OAuth authorization failed (${res.status})`);
  }
  return (await res.json()) as { authorizationUrl: string };
}

export async function exchangeAppUserOAuthCode(
  gatewayBaseUrl: string,
  code: string,
): Promise<{ connectionAPIKey: string; connectorId: string }> {
  const res = await fetch(`${gatewayBaseUrl}/v1/oauth/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) {
    throw new Error(`OAuth token exchange failed (${res.status})`);
  }
  return (await res.json()) as { connectionAPIKey: string; connectorId: string };
}

export interface CallAsAppUserParams {
  gatewayBaseUrl: string;
  connectionAPIKey: string;
  connectorId: string;
  path: string;
  init?: RequestInit;
}

export async function callAsAppUser(params: CallAsAppUserParams): Promise<Response> {
  const target = `${params.gatewayBaseUrl}/v1/proxy/${params.connectorId}${params.path}`;
  const headers = new Headers(params.init?.headers);
  headers.set("X-Connection-Api-Key", params.connectionAPIKey);
  return fetch(target, {
    ...params.init,
    headers,
  });
}

export function initAppUserConnector() {}
