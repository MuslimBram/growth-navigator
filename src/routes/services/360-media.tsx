import { createFileRoute } from "@tanstack/react-router";
import { ServicePageLayout } from "@/components/ServicePage";

export const Route = createFileRoute("/services/360-media")({
  component: Media360Page,
  head: () => ({
    meta: [
      { title: "Foto & Video 360° — Muslimi Digital" },
      { name: "description", content: "Klientët ndihen sikur kanë hyrë brenda biznesit tënd me foto dhe video 360°." },
      { property: "og:title", content: "Foto & Video 360° — Muslimi Digital" },
      { property: "og:description", content: "Përvoja vizuale që shet para se të flasësh." },
    ],
  }),
});

function Media360Page() {
  return (
    <ServicePageLayout
      title="Foto & Video 360°"
      subtitle="Klientët ndihen sikur kanë hyrë brenda biznesit tënd."
      problem="Fotot e zakonshme nuk bindin — klientët duan ta 'shohin' biznesin para se të vijnë"
      problemPoints={[
        "Fotot statike nuk tregojnë mjedisin e plotë të biznesit",
        "Klientët nuk e dinë si duket brenda — kjo krijon pasiguri",
        "Konkurrentët me turne virtuale po tërheqin më shumë vizitorë",
        "Google favorizon bizneset me foto 360° në Maps dhe Search",
      ]}
      solution="Turne virtuale 360° që konverton vizitorë online në klientë fizikë"
      solutionPoints={[
        "Xhirime profesionale 360° me kamera të specializuara",
        "Turne virtuale interaktive e integrueshme në faqen tënde",
        "Integrim direkt në Google Maps dhe Google Street View",
        "Video 360° për rrjete sociale që rrisin engagement-in",
        "Foto HDR profesionale për faqe dhe materiale marketingu",
        "Editim dhe post-procesim i nivelit premium",
      ]}
      results={[
        "+35% rritje e vizitave fizike",
        "2x kohë e kaluar në faqe",
        "Google Maps featured me 360°",
        "Besueshmëri e rritur drastikisht",
        "Dallim i qartë nga konkurrentët",
        "ROI mbrenda 30 ditësh",
      ]}
      serviceKey="photo_video_360"
    />
  );
}
