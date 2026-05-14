import { createFileRoute } from "@tanstack/react-router";
import { ServicePageLayout } from "@/components/ServicePage";

const URL = "https://muslimi.lovable.app/services/360-media";

export const Route = createFileRoute("/services/360-media")({
  component: Media360Page,
  head: () => ({
    meta: [
      { title: "360° Photo & Video — Muslimi Digital" },
      { name: "description", content: "Customers feel like they've stepped inside your business with 360° photos and videos." },
      { property: "og:title", content: "360° Photo & Video — Muslimi Digital" },
      { property: "og:description", content: "Visual experiences that sell before you say a word." },
      { property: "og:url", content: URL },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Service",
        name: "360° Photo & Video",
        provider: { "@type": "Organization", name: "Muslimi Digital", url: "https://muslimi.lovable.app" },
        url: URL,
        description: "Immersive 360° photos and videos for businesses.",
      }),
    }],
  }),
});

function Media360Page() {
  return <ServicePageLayout serviceKey="photo_video_360" />;
}
