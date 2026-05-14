import { createFileRoute } from "@tanstack/react-router";
import { Landing } from "@/components/Landing";
import { LandingSections } from "@/components/LandingSections";

const SITE_URL = "https://muslimi.lovable.app";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Muslimi Digital — AI Business Diagnosis" },
      {
        name: "description",
        content:
          "Discover in 2 minutes which digital services your business is missing. A personalized diagnosis from Muslimi Digital.",
      },
      { property: "og:title", content: "Muslimi Digital — Free AI Business Diagnosis" },
      {
        property: "og:description",
        content:
          "If someone is searching for your service today, do they end up with you, or with your competitor? Get a free AI diagnosis.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL },
    ],
    links: [{ rel: "canonical", href: SITE_URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: "Muslimi Digital",
              url: SITE_URL,
              logo: `${SITE_URL}/favicon.ico`,
              sameAs: [],
            },
            {
              "@type": "WebSite",
              name: "Muslimi Digital",
              url: SITE_URL,
            },
          ],
        }),
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <>
      <Landing />
      <LandingSections />
    </>
  );
}
