const INTERNAL_ERROR_PATTERNS = [
  /missing.*environment/i,
  /supabase/i,
  /eloable/i,
  /api.?key/i,
  /token/i,
  /secret/i,
  /password/i,
  /jwt/i,
  /credential/i,
  /connection.?string/i,
  /pg_/i,
  /database/i,
  /localhost/i,
  /127\.0\.0/i,
  /stack.?trace/i,
];

export function sanitizeErrorForClient(error: unknown): string {
  const msg = error instanceof Error ? error.message : "Erro interno do servidor";
  for (const pattern of INTERNAL_ERROR_PATTERNS) {
    if (pattern.test(msg)) {
      return "Ocorreu um erro inesperado. Tente novamente.";
    }
  }
  return msg;
}

export function sanitizeErrorMessage(error: unknown): string {
  const msg = error instanceof Error ? error.message : "Erro desconhecido";
  return msg.slice(0, 500);
}
