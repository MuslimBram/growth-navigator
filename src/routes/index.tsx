import { createFileRoute } from "@tanstack/react-router";
import { Landing } from "@/components/Landing";
import { LandingSections } from "@/components/LandingSections";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Muslimi Digital — AI Business Diagnosis" },
      {
        name: "description",
        content:
          "Discover in 2 minutes which digital services your business is missing. A personalized diagnosis from Muslimi Digital.",
      },
      { property: "og:title", content: "Muslimi Digital — Free Diagnosis" },
      {
        property: "og:description",
        content: "If someone is searching for your service today, do they end up with you, or with your competitor?",
      },
      { property: "og:type", content: "website" },
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

