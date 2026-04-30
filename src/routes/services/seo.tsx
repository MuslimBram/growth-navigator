import { createFileRoute } from "@tanstack/react-router";
import { ServicePageLayout } from "@/components/ServicePage";

export const Route = createFileRoute("/services/seo")({
  component: SEOPage,
  head: () => ({
    meta: [
      { title: "SEO — Optimizim për Google — Muslimi Digital" },
      { name: "description", content: "Dal në faqen e parë të Google kur klientët kërkojnë shërbimin tënd. SEO lokal dhe nacional." },
      { property: "og:title", content: "SEO — Optimizim për Google — Muslimi Digital" },
      { property: "og:description", content: "Faqja jote duket në Google kur klientët kërkojnë." },
    ],
  }),
});

function SEOPage() {
  return (
    <ServicePageLayout
      title="SEO — Optimizim për Google"
      subtitle="Faqja jote duket në Google kur klientët kërkojnë shërbimin tënd."
      problem="Klientët po të kërkojnë — por po gjejnë konkurrentin"
      problemPoints={[
        "Nuk del në faqen e parë të Google kur dikush kërkon shërbimin tënd",
        "Konkurrentët po investojnë në SEO dhe po marrin klientët tuaj",
        "Pa SEO, faqja jote është sikur nuk ekziston — edhe nëse është e bukur",
        "Reklama me pagesë kushtojnë shumë dhe ndalojnë kur ndalon pagesa",
      ]}
      solution="Strategji SEO që sjell klientë çdo ditë"
      solutionPoints={[
        "Analizë e plotë e fjalëve kyçe që përdorin klientët tuaj",
        "Optimizim teknik i faqes (shpejtësi, strukturë, meta tags)",
        "Krijim i përmbajtjes që rankohet në Google",
        "Link building dhe autoritet domeni",
        "Google Business Profile optimizim",
        "Raporte mujore me rezultate konkrete",
      ]}
      results={[
        "#1 në Google lokal",
        "+25 klientë të rinj/muaj",
        "90 ditë kohë mesatare",
        "ROI 5-10x në vitin e parë",
        "Trafik organik i vazhdueshëm",
        "Pa kosto reklamash mujore",
      ]}
      serviceKey="seo"
    />
  );
}
