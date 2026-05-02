import { createFileRoute } from "@tanstack/react-router";
import { ServicePageLayout } from "@/components/ServicePage";

export const Route = createFileRoute("/services/seo")({
  component: SEOPage,
  head: () => ({
    meta: [
      { title: "SEO — Google Optimization — Muslimi Digital" },
      { name: "description", content: "Show up on the first page of Google when customers search for your service. Local and national SEO." },
      { property: "og:title", content: "SEO — Google Optimization — Muslimi Digital" },
      { property: "og:description", content: "Your site shows up on Google when customers search." },
    ],
  }),
});

function SEOPage() {
  return <ServicePageLayout serviceKey="seo" />;
}
