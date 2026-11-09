import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { checkRateLimit, RATE_LIMITS, type RateLimitConfig } from "@/lib/security/rate-limit";

export function createRateLimitMiddleware(config: RateLimitConfig) {
  return createMiddleware({ type: "function" }).server(async ({ next }) => {
    const request = getRequest();
    const ip =
      request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request?.headers?.get("x-real-ip") ??
      "unknown";

    const result = checkRateLimit(ip, config);
    if (!result.allowed) {
      throw new Error("Rate limit excedido. Tente novamente mais tarde.");
    }
    return next();
  });
}

export const rateLimitServerFunction = createRateLimitMiddleware(RATE_LIMITS.serverFunction);
export const rateLimitAiAnalysis = createRateLimitMiddleware(RATE_LIMITS.aiAnalysis);
export const rateLimitSemanticSearch = createRateLimitMiddleware(RATE_LIMITS.semanticSearch);
