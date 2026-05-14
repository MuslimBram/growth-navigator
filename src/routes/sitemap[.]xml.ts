import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://muslimi.lovable.app";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const CITIES = ["tirane", "durres", "vlore", "shkoder", "elbasan", "korce"];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/diagnoze", changefreq: "monthly", priority: "0.9" },
          { path: "/analizo-biznesin", changefreq: "monthly", priority: "0.9" },
          { path: "/case-studies", changefreq: "monthly", priority: "0.8" },
          { path: "/krahaso", changefreq: "monthly", priority: "0.7" },
          { path: "/historiku", changefreq: "monthly", priority: "0.5" },
          { path: "/services/web-3d", changefreq: "monthly", priority: "0.8" },
          { path: "/services/seo", changefreq: "monthly", priority: "0.8" },
          { path: "/services/google-maps", changefreq: "monthly", priority: "0.8" },
          { path: "/services/social-media", changefreq: "monthly", priority: "0.8" },
          { path: "/services/360-media", changefreq: "monthly", priority: "0.8" },
          ...CITIES.map((c) => ({ path: `/qytete/${c}`, changefreq: "monthly" as const, priority: "0.7" })),
        ];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
