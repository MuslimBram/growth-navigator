import { createFileRoute } from "@tanstack/react-router";
import { ServicePageLayout } from "@/components/ServicePage";

export const Route = createFileRoute("/services/google-maps")({
  component: GoogleMapsPage,
  head: () => ({
    meta: [
      { title: "Google Maps for Business — Muslimi Digital" },
      { name: "description", content: "Optimize your Google Maps profile and become visible when customers search nearby." },
      { property: "og:title", content: "Google Maps for Business — Muslimi Digital" },
      { property: "og:description", content: "Found on the map with reviews that pull people in." },
    ],
  }),
});

function GoogleMapsPage() {
  return <ServicePageLayout serviceKey="google_maps" />;
}
