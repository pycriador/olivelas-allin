export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-]+|[-]+$/g, "")
    .slice(0, 80);
}

export function isReservedSlug(slug: string): boolean {
  const reserved = new Set(["nova", "admin", "api", "auth", "dashboard", "perfil"]);
  return reserved.has(slug);
}
