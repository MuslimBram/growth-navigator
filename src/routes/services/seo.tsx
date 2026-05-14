import { createFileRoute } from "@tanstack/react-router";
import { ServicePageLayout } from "@/components/ServicePage";

const URL = "https://muslimi.lovable.app/services/seo";

export const Route = createFileRoute("/services/seo")({
  component: SEOPage,
  head: () => ({
    meta: [
      { title: "SEO — Google Optimization — Muslimi Digital" },
      { name: "description", content: "Show up on the first page of Google when customers search for your service. Local and national SEO." },
      { property: "og:title", content: "SEO — Google Optimization — Muslimi Digital" },
      { property: "og:description", content: "Your site shows up on Google when customers search." },
      { property: "og:url", content: URL },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Service",
        name: "SEO — Google Optimization",
        provider: { "@type": "Organization", name: "Muslimi Digital", url: "https://muslimi.lovable.app" },
        url: URL,
        description: "First-page Google optimization for local and national businesses.",
      }),
    }],
  }),
});

function SEOPage() {
  return <ServicePageLayout serviceKey="seo" />;
}
