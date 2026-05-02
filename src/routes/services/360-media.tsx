import { createFileRoute } from "@tanstack/react-router";
import { ServicePageLayout } from "@/components/ServicePage";

export const Route = createFileRoute("/services/360-media")({
  component: Media360Page,
  head: () => ({
    meta: [
      { title: "360° Photo & Video — Muslimi Digital" },
      { name: "description", content: "Customers feel like they've stepped inside your business with 360° photos and videos." },
      { property: "og:title", content: "360° Photo & Video — Muslimi Digital" },
      { property: "og:description", content: "Visual experiences that sell before you say a word." },
    ],
  }),
});

function Media360Page() {
  return <ServicePageLayout serviceKey="photo_video_360" />;
}
