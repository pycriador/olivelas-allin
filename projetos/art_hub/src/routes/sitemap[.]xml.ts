import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { collectionsRepo } from "@/lib/repositories/collections";
import { artworksRepo } from "@/lib/repositories/artworks";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const base = new URL(request.url).origin;
        const entries: string[] = ["/", "/collections"];
        try {
          const [collections, artworks] = await Promise.all([
            collectionsRepo.listPublic(),
            (async () => {
              const { rows } = await artworksRepo.listAdmin({ pageSize: 500 });
              return rows.filter((a) => a.status === "active");
            })(),
          ]);
          for (const c of collections) entries.push(`/collections/${c.slug}`);
          for (const a of artworks) entries.push(`/artworks/${a.id}`);
        } catch (e) {
          console.error(e);
        }
        const urls = entries
          .map((p) => `  <url><loc>${base}${p}</loc><changefreq>weekly</changefreq></url>`)
          .join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
