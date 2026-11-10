import type { Album, PageRow, StickerRow, UploadRow } from "./types";

async function getSupabase() {
  const { supabase } = await import("@/integrations/supabase/client");
  return supabase;
}

/* ===================== ALBUMS ===================== */
export async function listAlbums() {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("albums")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Album[];
}

export async function getAlbumBySlug(slug: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from("albums").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data as unknown as Album | null;
}

export async function getAlbumById(id: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from("albums").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as unknown as Album | null;
}

export async function createAlbum(input: { name: string; slug: string; description?: string }) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("albums")
    .insert({ name: input.name, slug: input.slug, description: input.description ?? null })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Album;
}

export async function updateAlbum(id: string, patch: Partial<Album>) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("albums")
    .update({ ...(patch as any), updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Album;
}

export async function deleteAlbum(id: string) {
  const supabase = await getSupabase();
  const { error } = await supabase.from("albums").delete().eq("id", id);
  if (error) throw error;
}

/* ===================== PAGES ===================== */
export async function listPages(albumId: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("album_id", albumId)
    .order("order_index", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as PageRow[];
}

export async function createPage(albumId: string, order_index: number, page_type: string = "common") {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("pages")
    .insert({ album_id: albumId, order_index, page_type, name: page_type === "cover" ? "Capa" : page_type === "back_cover" ? "Contracapa" : `Página ${order_index + 1}` })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as PageRow;
}

export async function updatePage(id: string, patch: Partial<PageRow>) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("pages")
    .update({ ...(patch as any), updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as PageRow;
}

export async function deletePage(id: string) {
  const supabase = await getSupabase();
  const { error } = await supabase.from("pages").delete().eq("id", id);
  if (error) throw error;
}

export async function duplicatePage(page: PageRow, newOrderIndex: number) {
  const stickers = await listStickers(page.id);
  const newPage = await createPage(page.album_id, newOrderIndex, page.page_type);
  await updatePage(newPage.id, {
    name: page.name + " (cópia)",
    background: page.background,
    settings: page.settings,
  } as Partial<PageRow>);
  for (const s of stickers) {
    await createSticker(newPage.id, {
      x_cm: s.x_cm, y_cm: s.y_cm, width_cm: s.width_cm, height_cm: s.height_cm,
      rotation: s.rotation, number: s.number, number_enabled: s.number_enabled,
      number_position: s.number_position, title: s.title, caption: s.caption,
      style: s.style, order_index: s.order_index,
    });
  }
  return newPage;
}

export async function reorderPages(pages: { id: string; order_index: number }[]) {
  const supabase = await getSupabase();
  await Promise.all(
    pages.map((p) =>
      supabase.from("pages").update({ order_index: p.order_index }).eq("id", p.id)
    )
  );
}

/* ===================== STICKERS ===================== */
export async function listStickers(pageId: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("stickers")
    .select("*")
    .eq("page_id", pageId)
    .order("order_index", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as StickerRow[];
}

export async function listStickersByAlbum(albumId: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("stickers")
    .select("*, pages!inner(album_id)")
    .eq("pages.album_id", albumId);
  if (error) throw error;
  return (data ?? []) as unknown as (StickerRow & { pages: { album_id: string } })[];
}

export async function createSticker(pageId: string, patch: Partial<StickerRow> = {}) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("stickers")
    .insert({
      page_id: pageId,
      x_cm: patch.x_cm ?? 2,
      y_cm: patch.y_cm ?? 2,
      width_cm: patch.width_cm ?? 5,
      height_cm: patch.height_cm ?? 7,
      rotation: patch.rotation ?? 0,
      number: patch.number ?? null,
      number_enabled: patch.number_enabled ?? true,
      number_position: patch.number_position ?? "bottom-right",
      title: patch.title ?? null,
      caption: patch.caption ?? null,
      style: patch.style ?? {},
      order_index: patch.order_index ?? 0,
    })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as StickerRow;
}

export async function updateSticker(id: string, patch: Partial<StickerRow>) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("stickers")
    .update(patch as any)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as StickerRow;
}

export async function deleteSticker(id: string) {
  const supabase = await getSupabase();
  const { error } = await supabase.from("stickers").delete().eq("id", id);
  if (error) throw error;
}

/* ===================== UPLOADS ===================== */
export async function listUploadsByAlbum(albumId: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("uploads")
    .select("*")
    .eq("album_id", albumId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as UploadRow[];
}

export async function getLatestUploadForSticker(stickerId: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("uploads")
    .select("*")
    .eq("sticker_id", stickerId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as UploadRow | null;
}

export async function uploadStickerPhoto(
  file: File,
  ctx: { albumId: string; pageId: string; stickerId: string }
) {
  const supabase = await getSupabase();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${ctx.albumId}/${ctx.pageId}/${ctx.stickerId}-${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from("sticker-uploads")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (upErr) throw upErr;
  const { data: pub } = supabase.storage.from("sticker-uploads").getPublicUrl(path);
  const dims = await readImageDimensions(file).catch(() => ({ w: null, h: null }));
  const { data, error } = await supabase
    .from("uploads")
    .insert({
      sticker_id: ctx.stickerId,
      page_id: ctx.pageId,
      album_id: ctx.albumId,
      file_url: pub.publicUrl,
      file_path: path,
      original_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      width_px: dims.w,
      height_px: dims.h,
    })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as UploadRow;
}

export async function uploadAlbumAsset(file: File, folder = "backgrounds") {
  const supabase = await getSupabase();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from("album-assets")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("album-assets").getPublicUrl(path);
  return data.publicUrl;
}

function readImageDimensions(file: File): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ w: img.naturalWidth, h: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = reject;
    img.src = url;
  });
}