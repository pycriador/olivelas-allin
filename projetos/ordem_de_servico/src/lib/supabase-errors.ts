const MAP: Record<string, string> = {
  invalid_credentials: "E-mail ou senha incorretos.",
  invalid_login_credentials: "E-mail ou senha incorretos.",
  email_not_confirmed: "Confirme seu e-mail antes de entrar.",
  user_already_registered: "Este e-mail já está cadastrado.",
  user_already_exists: "Este e-mail já está cadastrado.",
  weak_password: "Senha muito fraca. Use pelo menos 6 caracteres.",
  over_email_send_rate_limit: "Muitas tentativas. Aguarde alguns minutos.",
  otp_expired: "O link expirou. Solicite um novo.",
  same_password: "A nova senha deve ser diferente da atual.",
};

export function friendlyAuthError(err: unknown): string {
  if (!err) return "Erro desconhecido.";
  const anyErr = err as { code?: string; message?: string };
  if (anyErr.code && MAP[anyErr.code]) return MAP[anyErr.code];
  const msg = (anyErr.message ?? String(err)).toLowerCase();
  for (const [key, friendly] of Object.entries(MAP)) {
    if (msg.includes(key)) return friendly;
  }
  if (msg.includes("network")) return "Falha de conexão. Verifique sua internet.";
  if (msg.includes("fetch")) return "Não foi possível conectar ao servidor.";
  return anyErr.message ?? "Ocorreu um erro. Tente novamente.";
}
