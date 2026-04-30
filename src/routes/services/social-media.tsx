import { createFileRoute } from "@tanstack/react-router";
import { ServicePageLayout } from "@/components/ServicePage";

export const Route = createFileRoute("/services/social-media")({
  component: SocialMediaPage,
  head: () => ({
    meta: [
      { title: "Menaxhim i Rrjeteve Sociale — Muslimi Digital" },
      { name: "description", content: "Postime që sjellin klientë, jo vetëm pëlqime. Strategji social media për biznese shqiptare." },
      { property: "og:title", content: "Menaxhim i Rrjeteve Sociale — Muslimi Digital" },
      { property: "og:description", content: "Postime që sjellin klientë, jo vetëm pëlqime." },
    ],
  }),
});

function SocialMediaPage() {
  return (
    <ServicePageLayout
      title="Menaxhim i Rrjeteve Sociale"
      subtitle="Postime që sjellin klientë, jo vetëm pëlqime."
      problem="Po harxhon orë në Instagram pa kthim financiar"
      problemPoints={[
        "Poston çdo ditë por asnjë klient i ri nuk vjen nga postimet",
        "Ke like dhe komente, por zero mesazhe 'dua ta blej'",
        "Harxhon 2-3 orë në ditë duke krijuar content pa strategji",
        "Nuk e di çfarë po funksionon dhe çfarë jo",
      ]}
      solution="Strategji sociale që konverton ndjekës në klientë"
      solutionPoints={[
        "Kalendar i përmbajtjes i planifikuar për 30 ditë",
        "Çdo postim ka CTA të qartë — nuk poston thjesht për 'likes'",
        "Strategji Reels & Stories që rrisin shikueshmërinë",
        "Ads targetuara për audiencën tënde lokale",
        "Raporte javore: sa klientë solli çdo postim",
        "A/B testing i përmbajtjes për optimizim",
      ]}
      results={[
        "+15 klientë të rinj/javë",
        "200% rritje e rezervimeve",
        "3x ROI social media",
        "50% më pak kohë e harxhuar",
        "Rritje organike e ndjekësve",
        "Konvertim i drejtpërdrejtë",
      ]}
      serviceKey="social_media"
    />
  );
}
