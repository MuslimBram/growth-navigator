import { createFileRoute } from "@tanstack/react-router";
import { ServicePageLayout } from "@/components/ServicePage";

export const Route = createFileRoute("/services/google-maps")({
  component: GoogleMapsPage,
  head: () => ({
    meta: [
      { title: "Google Maps për Biznes — Muslimi Digital" },
      { name: "description", content: "Optimizo profilin Google Maps dhe u bëhu i dukshëm kur klientët kërkojnë afër teje." },
      { property: "og:title", content: "Google Maps për Biznes — Muslimi Digital" },
      { property: "og:description", content: "Të gjejnë në hartë me vlerësime që tërheqin." },
    ],
  }),
});

function GoogleMapsPage() {
  return (
    <ServicePageLayout
      title="Google Maps për Biznes"
      subtitle="Të gjejnë në hartë me vlerësime që tërheqin."
      problem="Klientët kërkojnë 'afër meje' — por nuk të gjejnë"
      problemPoints={[
        "Profili Google Maps nuk ekziston ose është i paplotësuar",
        "Pa vlerësime ose me vlerësime të pakta — klientët zgjedhin konkurrentin",
        "Informacioni (orari, telefoni, adresa) nuk është i saktë",
        "Nuk del në '3-pack' e Google Maps kur dikush kërkon shërbimin tënd lokalisht",
      ]}
      solution="Profil Google Maps i optimizuar dhe i menaxhuar"
      solutionPoints={[
        "Krijim dhe verifikim i profilit Google Business",
        "Optimizim i plotë: kategori, përshkrim, foto, orare",
        "Strategji për mbledhjen e vlerësimeve pozitive",
        "Përgjigje profesionale ndaj çdo vlerësimi",
        "Postime javore në Google Business Profile",
        "Raport mujor me metrika (shikime, klikimet, thirrjet)",
      ]}
      results={[
        "Top 3 në Google Maps lokal",
        "+50 vlerësime pozitive/3 muaj",
        "3x më shumë thirrje telefonike",
        "+70% rritje e drejtimeve",
        "Besueshmëri e rritur",
        "Klientë pa reklama me pagesë",
      ]}
      serviceKey="google_maps"
    />
  );
}
