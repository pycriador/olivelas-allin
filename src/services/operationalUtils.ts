import {
  ApiEnvironmentEntity,
  ApiExecutionHistoryEntity,
  ApiServiceEntity,
  ApiTokenEntity,
} from '../types/domain';
import { generateId } from '../repositories/repositories';

export function exportRowsToCsv(filename: string, headers: string[], rows: (string | number | boolean | null | undefined)[][]): void {
  const escapeCsvCell = (cell: string | number | boolean | null | undefined): string => {
    if (cell === null || cell === undefined) return '';
    const str = String(cell).replace(/"/g, '""');
    return /[",\n\r;]/.test(str) ? `"${str}"` : str;
  };

  const csvContent = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validates URL safety in the API Hub to prevent arbitrary SSRF or unsafe scheme execution.
 */
export function validateSafeSandboxUrl(urlStr: string): { safe: boolean; reason?: string } {
  const trimmed = urlStr.trim();
  if (!trimmed) {
    return { safe: false, reason: 'URL de destino vazia.' };
  }
  if (/^(javascript|data|file|vbscript|ftp):/i.test(trimmed)) {
    return {
      safe: false,
      reason: 'Protocolo bloqueado por política de segurança (apenas https:// ou {{BASE_URL}} permitidos no simulador).',
    };
  }
  if (
    /(127\.0\.0\.1|localhost|169\.254\.169\.254|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|0\.0\.0\.0)/i.test(
      trimmed,
    )
  ) {
    return {
      safe: false,
      reason: 'Proteção Anti-SSRF Ativa: Endereços de loopback, metadados de nuvem ou redes internas privadas são bloqueados.',
    };
  }
  return { safe: true };
}

export function interpolateVariables(template: string, env?: ApiEnvironmentEntity): string {
  if (!env) return template;
  let result = template.replace(/\{\{BASE_URL\}\}/g, env.baseUrl);
  for (const [key, val] of Object.entries(env.variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, val);
  }
  return result;
}

export function executeSimulatedHttpCall(params: {
  service: ApiServiceEntity;
  environment?: ApiEnvironmentEntity;
  token?: ApiTokenEntity;
  selectedStatusCode?: number;
  customBody?: string;
  actorUserId: string;
  actorUserName: string;
}): { ok: boolean; error?: string; historyEntry?: ApiExecutionHistoryEntity } {
  const { service, environment, token, selectedStatusCode, customBody, actorUserId, actorUserName } = params;

  const base = interpolateVariables(service.baseUrl, environment);
  const path = interpolateVariables(service.path, environment);
  const enabledQuery = service.queryParams
    .filter((q) => q.enabled && q.key.trim().length > 0)
    .map((q) => `${encodeURIComponent(q.key)}=${encodeURIComponent(interpolateVariables(q.value, environment))}`)
    .join('&');

  const resolvedUrl = `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}${enabledQuery ? `?${enabledQuery}` : ''}`;

  const safety = validateSafeSandboxUrl(resolvedUrl);
  if (!safety.safe) {
    return { ok: false, error: safety.reason };
  }

  const requestHeaders: Record<string, string> = {};
  for (const h of service.defaultHeaders) {
    if (h.enabled && h.key.trim()) {
      requestHeaders[h.key] = interpolateVariables(h.value, environment);
    }
  }

  // Check token validity if service requires auth
  if (service.authType !== 'none') {
    if (!token) {
      const entry: ApiExecutionHistoryEntity = {
        id: generateId('hist'),
        serviceId: service.id,
        serviceName: service.name,
        environmentId: environment?.id || 'env-none',
        environmentName: environment?.name || 'Sem Ambiente',
        method: service.method,
        resolvedUrl,
        requestHeaders,
        requestBody: customBody ?? service.bodyTemplate,
        responseStatus: 401,
        responseLatencyMs: 18,
        responseHeaders: { 'content-type': 'application/json', 'x-allin-simulator': 'local-sandbox' },
        responseBody: JSON.stringify(
          {
            error: 'MISSING_CREDENTIALS',
            message: 'Este serviço exige um Token de API ativo no cabeçalho de autorização.',
          },
          null,
          2,
        ),
        executedByUserId: actorUserId,
        executedByUserName: actorUserName,
        executedAt: new Date().toISOString(),
        isSimulated: true,
      };
      return { ok: true, historyEntry: entry };
    }

    if (token.status !== 'active' || token.archiveMetadata.isArchived) {
      const entry: ApiExecutionHistoryEntity = {
        id: generateId('hist'),
        serviceId: service.id,
        serviceName: service.name,
        environmentId: environment?.id || 'env-none',
        environmentName: environment?.name || 'Sem Ambiente',
        tokenId: token.id,
        method: service.method,
        resolvedUrl,
        requestHeaders: {
          ...requestHeaders,
          Authorization: `Bearer ${token.maskedPreview}`,
        },
        requestBody: customBody ?? service.bodyTemplate,
        responseStatus: 403,
        responseLatencyMs: 22,
        responseHeaders: { 'content-type': 'application/json', 'x-allin-simulator': 'local-sandbox' },
        responseBody: JSON.stringify(
          {
            error: 'TOKEN_REVOKED_OR_EXPIRED',
            tokenStatus: token.status,
            message: `O token selecionado (${token.maskedPreview}) encontra-se ${token.status}.`,
          },
          null,
          2,
        ),
        executedByUserId: actorUserId,
        executedByUserName: actorUserName,
        executedAt: new Date().toISOString(),
        isSimulated: true,
      };
      return { ok: true, historyEntry: entry };
    }

    requestHeaders['Authorization'] =
      service.authType === 'bearer_token' ? `Bearer ${token.maskedPreview}` : token.maskedPreview;
  }

  const matchedSim =
    service.expectedResponses.find((r) => r.statusCode === selectedStatusCode) ||
    service.expectedResponses[0] || {
      statusCode: 200,
      label: '200 OK (Simulado)',
      latencyMs: 55,
      headers: { 'content-type': 'application/json' },
      bodyJson: JSON.stringify({ status: 'OK_SIMULATED', timestamp: new Date().toISOString() }, null, 2),
    };

  const entry: ApiExecutionHistoryEntity = {
    id: generateId('hist'),
    serviceId: service.id,
    serviceName: service.name,
    environmentId: environment?.id || 'env-none',
    environmentName: environment?.name || 'Sem Ambiente',
    tokenId: token?.id,
    method: service.method,
    resolvedUrl,
    requestHeaders,
    requestBody: customBody ?? service.bodyTemplate,
    responseStatus: matchedSim.statusCode,
    responseLatencyMs: matchedSim.latencyMs,
    responseHeaders: {
      ...matchedSim.headers,
      'x-allin-execution-mode': 'LOCAL_SANDBOX_SIMULATION',
    },
    responseBody: interpolateVariables(matchedSim.bodyJson, environment),
    executedByUserId: actorUserId,
    executedByUserName: actorUserName,
    executedAt: new Date().toISOString(),
    isSimulated: true,
  };

  return { ok: true, historyEntry: entry };
}
