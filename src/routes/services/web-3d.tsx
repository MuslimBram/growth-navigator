import { createFileRoute } from "@tanstack/react-router";
import { ServicePageLayout } from "@/components/ServicePage";

const URL = "https://muslimi.lovable.app/services/web-3d";

export const Route = createFileRoute("/services/web-3d")({
  component: Web3DPage,
  head: () => ({
    meta: [
      { title: "Professional 3D Website — Muslimi Digital" },
      { name: "description", content: "Modern 3D websites that convert visitors into customers. Fast, optimized, mobile-first." },
      { property: "og:title", content: "Professional 3D Website — Muslimi Digital" },
      { property: "og:description", content: "The website that makes customers say: 'Yes, this is the professional I was looking for.'" },
      { property: "og:url", content: URL },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Service",
        name: "Professional 3D Website",
        provider: { "@type": "Organization", name: "Muslimi Digital", url: "https://muslimi.lovable.app" },
        url: URL,
        description: "Modern 3D websites that convert visitors into customers.",
      }),
    }],
  }),
});

function Web3DPage() {
  return <ServicePageLayout serviceKey="web_3d" />;
}
