import { supabase } from "@/integrations/supabase/client";

export async function uploadToBucket(
  bucket: string,
  file: File,
  pathPrefix = ""
): Promise<{ path: string; signedUrl: string }> {
  const ext = file.name.split(".").pop() || "png";
  const path = `${pathPrefix}${pathPrefix ? "/" : ""}${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data, error: sErr } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 365);
  if (sErr || !data) throw sErr ?? new Error("Falha ao gerar URL");
  return { path, signedUrl: data.signedUrl };
}

/**
 * Stored URLs may expire — re-sign when needed. We store the full signed URL for simplicity;
 * if expiring becomes an issue we can refresh via this helper using the stored bucket+path.
 */
export async function signedUrl(bucket: string, path: string, expiresIn = 60 * 60 * 24) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

/** Upload preserving file name and signing for 1 year. Used for project attachments. */
export async function uploadProjectFile(projectId: string, file: File) {
  const path = `${projectId}/${crypto.randomUUID()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
  const { error } = await supabase.storage.from("project-files").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  const { data, error: sErr } = await supabase.storage
    .from("project-files")
    .createSignedUrl(path, 60 * 60 * 24 * 365);
  if (sErr || !data) throw sErr ?? new Error("Falha ao gerar URL");
  return { path, signedUrl: data.signedUrl };
}
