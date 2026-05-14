import { createFileRoute } from "@tanstack/react-router";
import { ServicePageLayout } from "@/components/ServicePage";

const URL = "https://muslimi.lovable.app/services/social-media";

export const Route = createFileRoute("/services/social-media")({
  component: SocialMediaPage,
  head: () => ({
    meta: [
      { title: "Social Media Management — Muslimi Digital" },
      { name: "description", content: "Posts that bring in customers, not just likes. Social media strategy for businesses." },
      { property: "og:title", content: "Social Media Management — Muslimi Digital" },
      { property: "og:description", content: "Posts that bring in customers, not just likes." },
      { property: "og:url", content: URL },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Service",
        name: "Social Media Management",
        provider: { "@type": "Organization", name: "Muslimi Digital", url: "https://muslimi.lovable.app" },
        url: URL,
        description: "Strategy and content that turns followers into customers.",
      }),
    }],
  }),
});

function SocialMediaPage() {
  return <ServicePageLayout serviceKey="social_media" />;
}
