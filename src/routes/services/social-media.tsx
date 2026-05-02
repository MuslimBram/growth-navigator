import { createFileRoute } from "@tanstack/react-router";
import { ServicePageLayout } from "@/components/ServicePage";

export const Route = createFileRoute("/services/social-media")({
  component: SocialMediaPage,
  head: () => ({
    meta: [
      { title: "Social Media Management — Muslimi Digital" },
      { name: "description", content: "Posts that bring in customers, not just likes. Social media strategy for businesses." },
      { property: "og:title", content: "Social Media Management — Muslimi Digital" },
      { property: "og:description", content: "Posts that bring in customers, not just likes." },
    ],
  }),
});

function SocialMediaPage() {
  return <ServicePageLayout serviceKey="social_media" />;
}
