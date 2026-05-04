import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle, MapPin, Globe, Search, Camera } from "lucide-react";

interface CityData {
  slug: string;
  name: string;
  nameLocative: string; // p.sh. "në Tiranë"
  population: string;
  intro: string;
  industries: string[];
}

const CITIES: Record<string, CityData> = {
  tirane: {
    slug: "tirane",
    name: "Tiranë",
    nameLocative: "në Tiranë",
    population: "~900,000 banorë",
    intro: "Kryeqyteti me konkurrencën më të lartë digjitale në Shqipëri. Bizneset që nuk shfaqen në Google humbasin klientë çdo ditë.",
    industries: ["Restorante & kafene", "Klinika dentare & estetike", "Studio juridike", "Agjenci pasurish të paluajtshme", "Salone bukurie"],
  },
  durres: {
    slug: "durres",
    name: "Durrës",
    nameLocative: "në Durrës",
    population: "~200,000 banorë",
    intro: "Qyteti turistik dhe portual ku sezoni veror përcakton fitimet vjetore. Hotele, plazhe dhe biznese turistike kanë nevojë për prezencë digjitale të fortë para sezonit.",
    industries: ["Hotele & rezidenca", "Restorante bregdetare", "Turizëm & ekskursione", "Transport & taxi", "Eventet"],
  },
  vlore: {
    slug: "vlore",
    name: "Vlorë",
    nameLocative: "në Vlorë",
    population: "~140,000 banorë",
    intro: "Destinacion turistik premium me Riviera Shqiptare. Klientët kërkojnë në Google, Booking dhe Instagram para se të rezervojnë.",
    industries: ["Resort & hotele luksoze", "Plazh & beach bar", "Restorante peshku", "Turizëm i organizuar", "Ndërtimi i vilave"],
  },
  shkoder: {
    slug: "shkoder",
    name: "Shkodër",
    nameLocative: "në Shkodër",
    population: "~135,000 banorë",
    intro: "Qendër kulturore dhe arsimore me potencial të madh për biznese lokale që ende s'janë digjitalizuar plotësisht.",
    industries: ["Tregtia me pakicë", "Edukim & kurse private", "Restorante tradicionale", "Liqeni & turizmi malor", "Shërbime profesionale"],
  },
  elbasan: {
    slug: "elbasan",
    name: "Elbasan",
    nameLocative: "në Elbasan",
    population: "~125,000 banorë",
    intro: "Qytet industrial dhe tregtar ku pjesa më e madhe e bizneseve s'kanë website apo Google Maps të optimizuar — mundësi e madhe për të dalë lider.",
    industries: ["Industri & prodhim", "Tregti me shumicë", "Auto-servise", "Klinika private", "Restorante familjare"],
  },
  korce: {
    slug: "korce",
    name: "Korçë",
    nameLocative: "në Korçë",
    population: "~75,000 banorë",
    intro: "Qyteti i birrës dhe kulturës, me sezon të fortë turistik dimri-pranverë. Bizneset që dalin në Google Maps marrin avantazh të madh ndaj konkurrencës lokale.",
    industries: ["Restorante & pub", "Bujtina & B&B", "Turizëm kulturor", "Artizanat", "Tregti lokale"],
  },
};

export const Route = createFileRoute("/qytete/$city")({
  loader: ({ params }) => {
    const city = CITIES[params.city.toLowerCase()];
    if (!city) throw notFound();
    return { city };
  },
  head: ({ loaderData }) => {
    const c = loaderData?.city;
    if (!c) return { meta: [{ title: "Qytet — Muslimi Digital" }] };
    const title = `Web Design, SEO & Marketing ${c.nameLocative} — Muslimi Digital`;
    const description = `Shërbime digjitale për biznese ${c.nameLocative}: faqe interneti 3D, SEO në Google, Google Maps, foto/video 360°, menaxhim social media. Konsultim falas.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
    };
  },
  component: CityPage,
  notFoundComponent: () => (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-3">Qyteti nuk u gjet</h1>
        <p className="text-muted-foreground mb-6">Shiko listën e qyteteve të mbuluara.</p>
        <Link to="/" className="text-primary hover:underline">← Kthehu te ballina</Link>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <p className="text-destructive">{error.message}</p>
    </div>
  ),
});

const SERVICES = [
  { icon: Globe, title: "Faqe interneti 3D", desc: "Website moderne që konverton vizitorët në klientë." },
  { icon: Search, title: "SEO në Google", desc: "Dil në faqen e parë kur klientët kërkojnë shërbimin tënd." },
  { icon: MapPin, title: "Google Maps", desc: "Optimizim i profilit Google Business për kërkime lokale." },
  { icon: Camera, title: "Foto & Video 360°", desc: "Tour virtual që ndalon scroll-in dhe rrit besimin." },
];

function CityPage() {
  const { city } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Ballina
          </Link>
          <Link to="/diagnoze" className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90">
            Diagnozë falas
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6">
        <section className="pt-16 pb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-surface text-sm text-muted-foreground mb-6"
          >
            <MapPin className="h-3.5 w-3.5" /> {city.name} · {city.population}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="font-display text-4xl md:text-6xl font-bold tracking-tight"
          >
            Marketing Digjital {city.nameLocative}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            {city.intro}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-8 flex items-center justify-center gap-3"
          >
            <Link to="/diagnoze" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90">
              Fillo diagnozën falas <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </section>

        <section className="py-12 border-t border-border">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-8 text-center">
            Shërbime për biznese {city.nameLocative}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {SERVICES.map((s) => (
              <div key={s.title} className="rounded-xl border border-border bg-surface p-6">
                <s.icon className="h-6 w-6 text-primary mb-3" />
                <h3 className="font-semibold mb-1.5">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-12 border-t border-border">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-6 text-center">
            Industri që mbulojmë {city.nameLocative}
          </h2>
          <div className="flex flex-wrap gap-2 justify-center max-w-3xl mx-auto">
            {city.industries.map((ind) => (
              <span key={ind} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-border bg-surface text-sm">
                <CheckCircle className="h-3.5 w-3.5 text-primary" /> {ind}
              </span>
            ))}
          </div>
        </section>

        <section className="py-16 border-t border-border text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Gati për të nisur {city.nameLocative}?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Plotëso diagnozën 6-pyetjeshe falas dhe merr një plan konkret veprimi për biznesin tënd.
          </p>
          <Link to="/diagnoze" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-lg font-semibold hover:bg-primary/90">
            Fillo tani <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>

      <footer className="border-t border-border mt-12">
        <div className="max-w-5xl mx-auto px-6 py-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Muslimi Digital · Shërbime digjitale në të gjithë Shqipërinë
        </div>
      </footer>
    </div>
  );
}
