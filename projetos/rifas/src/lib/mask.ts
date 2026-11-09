/**
 * Data masking helpers para conformidade LGPD.
 * Nunca expoe dados completos em listagens publicas.
 */

export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "--";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return phone;
  const area = digits.slice(0, 2);
  const last = digits.slice(-4);
  return `(${area}) *****-${last}`;
}

export function maskEmail(email: string | null | undefined): string {
  if (!email) return "--";
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  if (user.length <= 2) return `${user[0]}***@${domain}`;
  return `${user[0]}${"*".repeat(Math.min(user.length - 1, 5))}@${domain}`;
}

export function maskCPF(cpf: string | null | undefined): string {
  if (!cpf) return "--";
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return cpf;
  return `***.***.***-${digits.slice(-2)}`;
}
