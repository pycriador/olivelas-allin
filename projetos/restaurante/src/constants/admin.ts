/**
 * Global Admin / SaaS Superadmin configuration
 */
export const GLOBAL_ADMIN_EMAILS: string[] = [
  'willian.o.jesus@gmail.com',
];

/**
 * Checks whether an email address belongs to a Global Admin
 */
export function isGlobalAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return GLOBAL_ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
