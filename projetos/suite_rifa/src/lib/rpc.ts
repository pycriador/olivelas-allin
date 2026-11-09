/**
 * Strips `undefined` values so optional RPC arguments fall back to their
 * database defaults (required by `exactOptionalPropertyTypes`).
 */
export function rpcArgs<T>(args: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(args)) {
    if (value !== undefined && value !== null && value !== "") out[key] = value;
  }
  return out as T;
}
