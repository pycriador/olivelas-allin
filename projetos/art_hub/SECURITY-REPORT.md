# Security Implementation Report — Olivelas Art Hub

This document records every security change applied to the project, the errors each
caused in production, and the correct approach to avoid repeating them. It is meant
to be used as a system prompt / context for future AI assistants working on this codebase.

---

## Table of Contents

1. [What Was Changed](#1-what-was-changed)
2. [What Broke and Why](#2-what-broke-and-why)
3. [Root Cause Analysis](#3-root-cause-analysis)
4. [Correct Prompt for Future Security Work](#4-correct-prompt-for-future-security-work)
5. [Lessons Learned](#5-lessons-learned)

---

## 1. What Was Changed

### 1.1 Security Headers in `server.ts`

**Commit:** `87ee70e` — feat: enterprise security foundation

Added the following headers to ALL HTTP responses:

```ts
const SECURITY_HEADERS = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",       // ← BROKE IMAGES
  "Cross-Origin-Embedder-Policy": "credentialless",    // ← BROKE FONTS
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self'",                                // ← BROKE INLINE SCRIPTS
    "style-src 'self' 'unsafe-inline'",                 // ← BROKE GOOGLE FONTS
    "img-src 'self' https://*.supabase.co data: blob:",
    "connect-src 'self' https://*.supabase.co https://ai.gateway.lovable.dev wss://*.supabase.co",
    "font-src 'self'",                                  // ← BROKE EXTERNAL FONTS
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
};
```

### 1.2 Soft Delete Columns (Migration `20260719000000`)

Added `deleted_at`, `deleted_by`, `delete_reason` to `collections` and `artworks` tables.

Client code in `artworks.ts` and `collections.ts` was updated to filter with
`.is("deleted_at", null)` on every query.

### 1.3 Storage Made Public (Migration `20260719100000`)

Made `collection-images`, `artwork-images`, `branding` buckets public and added
anon SELECT policies on `storage.objects`.

Changed `resolveImageUrl()` from async (`createSignedUrl`) to sync (`getPublicUrl`).

### 1.4 AI Settings Restricted (Migration `20260719110000`)

Removed `anon` SELECT from `ai_settings`, dropped public read policy, added
admin-only read policy.

### 1.5 Image URL Resolution Rewritten

Replaced manual `SUPABASE_URL` construction with `supabase.storage.from(bucket).getPublicUrl(path)`.

---

## 2. What Broke and Why

### Error 1: CSP Blocks Google Fonts, Inline Scripts, and External Fonts

**Symptom:**
```
Loading the stylesheet 'https://fonts.googleapis.com/css2?family=Inter...' violates CSP: "style-src 'self' 'unsafe-inline'"
Executing inline script violates CSP directive 'script-src 'self'"
Loading the font 'https://cdn.gpteng.co/...' violates CSP: "font-src 'self'"
```

**Root cause:**
- Vite/TanStack Start injects **inline `<script>` tags** for hydration. CSP
  `script-src 'self'` without `'unsafe-inline'` blocks them.
- Google Fonts is loaded via a `<link>` stylesheet from `fonts.googleapis.com`.
  CSP `style-src 'self'` blocks external stylesheets.
- Font files are served from `fonts.gstatic.com` and `cdn.gpteng.co`. CSP
  `font-src 'self'` blocks them.
- `Cross-Origin-Embedder-Policy: credentialless` forces all cross-origin
  sub-requests to use CORS, breaking stylesheets and fonts.

**Fix (commit `494eb76`):**
```ts
"script-src 'self' 'unsafe-inline'",                     // allow Vite hydration
"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
"font-src 'self' https://fonts.gstatic.com https://cdn.gpteng.co",
"Cross-Origin-Embedder-Policy": "unsafe-none",           // allow cross-origin resources
```

**Lesson:** TanStack Start/Vite generates inline scripts. Any CSP must include
`'unsafe-inline'` for `script-src`, or use nonces/hashes per-request (complex
with SSR frameworks).

---

### Error 2: CORB Blocks All Cross-Origin Images (109 blocked requests)

**Symptom:**
```
Response was blocked by CORB (Cross-Origin Read Blocking)
109 requests blocked (all artwork/collection images)
```

Retry logic fired `_r=1`, `_r=2`, `_r=3` for every image — all failed.

**Root cause:**
Two issues combined:

1. `Cross-Origin-Resource-Policy: cross-origin` header confused the browser's
   CORB algorithm for cross-origin image loads from Supabase storage.
2. The `20260719100000_public_buckets.sql` migration had NOT been applied in
   production. Without it, `getPublicUrl()` returned URLs that returned 403
   HTML error pages. CORB blocks HTML responses to image sub-requests.

**Fix (commit `bebecda`):**
- Removed `Cross-Origin-Resource-Policy` header entirely (not needed for a
  public gallery).
- User manually ran the SQL in Supabase Dashboard.

**Lesson:** Never add `Cross-Origin-Resource-Policy` to a site that loads
resources from third-party CDNs (Supabase Storage, Google Fonts, etc.) unless
you control the response headers of those CDNs too.

---

### Error 3: `deleted_at` Column Does Not Exist → 400 Bad Request

**Symptom:**
```
GET /rest/v1/collections?select=*&status=eq.active&deleted_at=is.null&order=display_order.asc 400 (Bad Request)
```

Repeated on every page load — collections and artworks could not be fetched.

**Root cause:**
Migration `20260719000000_security_improvements.sql` added `deleted_at` columns,
but it was never applied to the production database. Supabase PostgREST returns
400 when a query references a non-existent column.

**Fix (commit `94b8dd6`):**
- Removed all `.is("deleted_at", null)` filters from client queries.
- Changed `remove()` from soft delete (`update({ deleted_at })`) to hard delete
  (`.delete()`).

**Lesson:** Never add code that depends on a migration that hasn't been applied
yet. Either:
- Apply the migration first, then write the code.
- Write the code defensively (try/catch, check column existence).
- Never mix schema changes and code changes in the same deploy cycle.

---

### Error 4: Images Return Empty URLs (SUPABASE_URL is "")

**Symptom:**
All images show placeholder fallback. No 404/403 errors — the `<img src>` is
literally `/storage/v1/object/public/...` (missing the hostname).

**Root cause:**
`storage.ts` used a self-invoking function to read `SUPABASE_URL`:

```ts
const SUPABASE_URL = (() => {
  try {
    return (
      (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) ||
      process.env.SUPABASE_URL ||
      ""
    );
  } catch {
    return "";
  }
})();
```

In TanStack Start's bundled output, `import.meta.env` is replaced at build time.
The `typeof import.meta !== "undefined"` guard works in source but the fallback
to `process.env.SUPABASE_URL` evaluates to `""` in the client bundle. The IIFE
captures an empty string at module load time, and all `getPublicUrl()` calls
produce URLs without a hostname.

**Fix (commit `c4af705`):**
Replaced manual URL construction with the Supabase SDK method:

```ts
export function getPublicUrl(stored: string | null | undefined): string | null {
  const decoded = decodeStoredImage(stored);
  if (!decoded) return null;
  const { data } = supabase.storage.from(decoded.bucket).getPublicUrl(decoded.path);
  return data?.publicUrl ?? null;
}
```

The SDK's `getPublicUrl()` uses the URL already configured in the Supabase
client — no manual construction needed.

**Lesson:** Never manually construct Supabase URLs. Always use the SDK's
built-in methods (`getPublicUrl()`, `getPublicUrl()`). The SDK knows its own
URL.

---

### Error 5: `ai_settings` Table Exposed to Anonymous Users

**Symptom:**
Security audit flagged: "Internal AI configuration exposed to all site visitors."

**Root cause:**
Migration `20260718015314` created:
```sql
GRANT SELECT ON public.ai_settings TO anon, authenticated;
CREATE POLICY "ai_settings public read" ON public.ai_settings FOR SELECT USING (true);
```

This allows anyone (including unauthenticated visitors) to query the Supabase
REST API directly and retrieve: `chat_model`, `embedding_model`, `temperature`,
`active_prompt_slug`, `enabled`, `timeout_ms`, etc.

**Fix (commit `832999e`):**
```sql
REVOKE SELECT ON public.ai_settings FROM anon;
DROP POLICY IF EXISTS "ai_settings public read" ON public.ai_settings;
CREATE POLICY "ai_settings admin read" ON public.ai_settings
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
```

**Lesson:** Configuration tables with internal details (model names, parameters,
feature flags) should NEVER have public read access. Match the pattern used for
similar tables (e.g., `ai_prompts` already had admin-only access).

---

## 3. Root Cause Analysis

| Category | Problem |
|----------|---------|
| **Headers** | Applied enterprise-grade security headers without checking if the app uses external resources (Google Fonts, Supabase Storage, Vite inline scripts). |
| **Migrations** | Added code that depends on migrations that were never applied to production. |
| **URL construction** | Manually built URLs instead of using SDK methods, causing empty hostname in client bundles. |
| **RLS policies** | Created permissive RLS policies (`USING (true)`) for configuration tables during development, forgot to tighten them before production. |

---

## 4. Correct Prompt for Future Security Work

Use this prompt when asking an AI to add security to this project:

```
Add security improvements to this TanStack Start + Supabase project.
CRITICAL RULES — follow ALL of them:

1. DO NOT add Cross-Origin-Resource-Policy, Cross-Origin-Embedder-Policy, or
   Cross-Origin-Opener-Policy headers. This app loads images from Supabase
   Storage (cross-origin) and fonts from Google Fonts (cross-origin). These
   headers WILL break image loading and font rendering.

2. CSP must include:
   - script-src: 'self' 'unsafe-inline' (Vite/TanStack Start injects inline
     scripts for hydration — there is no way around this without nonces)
   - style-src: 'self' 'unsafe-inline' https://fonts.googleapis.com
   - font-src: 'self' https://fonts.gstatic.com https://cdn.gpteng.co
   - img-src: 'self' https://*.supabase.co data: blob:
   - connect-src: 'self' https://*.supabase.co https://ai.gateway.lovable.dev
     wss://*.supabase.co

3. DO NOT reference database columns (like deleted_at) in client queries unless
   the migration adding those columns has ALREADY been applied in production.
   Always assume migrations have not been applied. Test queries against the
   actual database schema.

4. DO NOT manually construct Supabase URLs. Always use:
   - supabase.storage.from(bucket).getPublicUrl(path) for public URLs
   - supabase.storage.from(bucket).createSignedUrl(path, ttl) for signed URLs
   The Supabase SDK handles URL resolution internally.

5. DO NOT create RLS policies with USING (true) on tables that contain
   configuration, internal data, or anything the public should not see.
   Default to admin-only access (has_role(auth.uid(), 'admin')) unless there
   is a specific reason for public access.

6. For storage buckets, only the anon SELECT policy is needed for public
   galleries. NEVER add anon INSERT/UPDATE/DELETE/ALL policies on storage.objects.

7. After making changes, always verify:
   - Run: npx eslint <modified-files>
   - Confirm no new Supabase column references without existing migrations
   - Confirm CSP allows all external resources the app actually uses
```

---

## 5. Lessons Learned

| # | Lesson |
|---|--------|
| 1 | **Security headers are not one-size-fits-all.** Enterprise defaults (COEP, CORP, strict CSP) break apps that use cross-origin resources. Always audit what external domains the app connects to BEFORE adding headers. |
| 2 | **Never commit code that depends on unapplied migrations.** The `deleted_at` filter broke every page because the column didn't exist. Schema and code must be deployed together or in the correct order. |
| 3 | **Never manually construct Supabase storage URLs.** Use `supabase.storage.from(bucket).getPublicUrl(path)`. The SDK resolves the project URL correctly in all environments (client, SSR, edge). |
| 4 | **Configuration tables should never be public by default.** `ai_settings` had `USING (true)` which exposed model names and parameters to anonymous users. Match the restriction level of similar tables. |
| 5 | **Test security changes in the browser, not just in code.** All five errors above passed lint and type-check but broke the live app. Security headers must be verified by loading the actual pages. |
| 6 | **`'unsafe-inline'` for scripts is required with Vite/TanStack Start.** The framework injects inline `<script>` tags for hydration. Without `'unsafe-inline'`, the entire app fails to hydrate. Use nonces only if you implement a full SSR nonce injection system. |
| 7 | **CORB is triggered by error pages.** If a cross-origin request returns 403 HTML instead of the expected image/font, CORB blocks it. Fix the access permissions first, not the browser security headers. |

---

## Final Security Headers (Working Configuration)

These are the headers that work correctly for this project:

```ts
const SECURITY_HEADERS = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "unsafe-none",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' https://*.supabase.co data: blob:",
    "connect-src 'self' https://*.supabase.co https://ai.gateway.lovable.dev wss://*.supabase.co",
    "font-src 'self' https://fonts.gstatic.com https://cdn.gpteng.co",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
};
```

**Note:** No `Cross-Origin-Resource-Policy` header. This is intentional.
