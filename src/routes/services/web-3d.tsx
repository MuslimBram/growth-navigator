import { createFileRoute } from "@tanstack/react-router";
import { ServicePageLayout } from "@/components/ServicePage";

export const Route = createFileRoute("/services/web-3d")({
  component: Web3DPage,
  head: () => ({
    meta: [
      { title: "Web 3D Profesional — Muslimi Digital" },
      { name: "description", content: "Faqe interneti profesionale 3D që konvertojnë vizitorë në klientë. Dizajn modern, i shpejtë, i optimizuar." },
      { property: "og:title", content: "Web 3D Profesional — Muslimi Digital" },
      { property: "og:description", content: "Faqja që i bën klientët të thonë: Po, ky është profesionisti që kërkoj." },
    ],
  }),
});

function Web3DPage() {
  return (
    <ServicePageLayout
      title="Web 3D Profesional"
      subtitle="Faqja që i bën klientët të thonë: 'Po, ky është profesionisti që kërkoj'."
      problem="Biznesi yt nuk ka faqe, ose ka një faqe që duket si kartëvizitë e vjetër"
      problemPoints={[
        "Klientët e rinj kontrollojnë faqen para se të blejnë — nëse nuk ke, humbet besimin",
        "Faqja e vjetër ose e ngadaltë i bën klientët të mendojnë se biznesi nuk është profesional",
        "Konkurrentët me faqe moderne po marrin klientët që duhej të ishin tuajat",
        "Pa faqe, nuk ke ku ti drejtosh reklamat ose postimet në rrjete sociale",
      ]}
      solution="Faqe moderne 3D e dizajnuar për konvertim"
      solutionPoints={[
        "Dizajn modern me animacione 3D që lë përshtypje profesionale",
        "Optimizuar për shpejtësi — ngarkohet brenda 2 sekondash",
        "Mobile-first: 70% e vizitorëve vijnë nga telefoni",
        "Call-to-action të qarta që çojnë në kontakt ose blerje",
        "SEO bazë i integruar që Google ta gjejë",
      ]}
      results={[
        "+40% rritje e rezervimeve online",
        "3x më shumë kontakte nga faqja",
        "Dizajn që dallon nga konkurrentët",
        "Ngarkesë <2 sekonda",
        "Integrim me WhatsApp & Maps",
        "Konvertim mesatar 5-8%",
      ]}
      serviceKey="web_3d"
    />
  );
}
