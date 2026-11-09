// Service-layer authorization guard. Every write path goes through here.
import { authService } from "./auth.service";
import { iamService, ForbiddenError } from "./iam.service";

export { ForbiddenError };

export function currentActor(): { id?: string; name: string } {
  const s = authService.current();
  return s ? { id: s.userId, name: s.name } : { name: "system" };
}

/** Throws ForbiddenError when the signed-in user lacks the permission. */
export async function requirePermission(resource: string, action: string, resourceId?: string) {
  const session = authService.current();
  await iamService.require(session?.userId, resource, action, resourceId);
}
