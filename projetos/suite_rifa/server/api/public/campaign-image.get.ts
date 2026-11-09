import { supabaseAdmin } from "@/integrations/supabase/client.server";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const p = typeof query.p === "string" ? query.p : null;

  if (!p) {
    throw createError({ statusCode: 400, statusMessage: "Missing path parameter" });
  }

  // Security: only allow paths within the org-assets bucket
  if (p.includes("..") || !p.startsWith("organizations/")) {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }

  try {
    const { data, error } = await supabaseAdmin.storage.from("org-assets").download(p);
    if (error || !data) {
      throw createError({ statusCode: 404, statusMessage: "Not found" });
    }

    const ext = p.split(".").pop()?.toLowerCase() ?? "jpg";
    const mime =
      ext === "png" ? "image/png"
      : ext === "webp" ? "image/webp"
      : ext === "avif" ? "image/avif"
      : "image/jpeg";

    const buffer = Buffer.from(await data.arrayBuffer());

    setResponseHeader(event, "Content-Type", mime);
    setResponseHeader(event, "Cache-Control", "public, max-age=3600, s-maxage=86400");
    return buffer;
  } catch (err) {
    throw createError({ statusCode: 500, statusMessage: "Internal server error" });
  }
});
