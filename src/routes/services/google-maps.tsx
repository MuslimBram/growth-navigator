import { createFileRoute } from "@tanstack/react-router";
import { ServicePageLayout } from "@/components/ServicePage";

const URL = "https://muslimi.lovable.app/services/google-maps";

export const Route = createFileRoute("/services/google-maps")({
  component: GoogleMapsPage,
  head: () => ({
    meta: [
      { title: "Google Maps for Business — Muslimi Digital" },
      { name: "description", content: "Optimize your Google Maps profile and become visible when customers search nearby." },
      { property: "og:title", content: "Google Maps for Business — Muslimi Digital" },
      { property: "og:description", content: "Found on the map with reviews that pull people in." },
      { property: "og:url", content: URL },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Service",
        name: "Google Maps for Business",
        provider: { "@type": "Organization", name: "Muslimi Digital", url: "https://muslimi.lovable.app" },
        url: URL,
        description: "Google Business Profile optimization for local visibility.",
      }),
    }],
  }),
});

function GoogleMapsPage() {
  return <ServicePageLayout serviceKey="google_maps" />;
}
