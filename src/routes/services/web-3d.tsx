import { createFileRoute } from "@tanstack/react-router";
import { ServicePageLayout } from "@/components/ServicePage";

export const Route = createFileRoute("/services/web-3d")({
  component: Web3DPage,
  head: () => ({
    meta: [
      { title: "Professional 3D Website — Muslimi Digital" },
      { name: "description", content: "Modern 3D websites that convert visitors into customers. Fast, optimized, mobile-first." },
      { property: "og:title", content: "Professional 3D Website — Muslimi Digital" },
      { property: "og:description", content: "The website that makes customers say: 'Yes, this is the professional I was looking for.'" },
    ],
  }),
});

function Web3DPage() {
  return <ServicePageLayout serviceKey="web_3d" />;
}
