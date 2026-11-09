const ILIKE_SPECIAL = /[%_]/g;

export function escapeILike(value: string): string {
  return value.replace(ILIKE_SPECIAL, "\\$&");
}

export function safeILike(value: string): string {
  return `%${escapeILike(value)}%`;
}

export function sanitizeSearchInput(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;
  return trimmed.slice(0, 500);
}
