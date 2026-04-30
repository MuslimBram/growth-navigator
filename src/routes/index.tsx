import { createFileRoute } from "@tanstack/react-router";
import { Landing } from "@/components/Landing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Muslimi Digital — Diagnoza Falas e Biznesit Tënd" },
      {
        name: "description",
        content:
          "Zbulo brenda 2 minutash cilat shërbime dixhitale i mungojnë biznesit tënd. Diagnozë e personalizuar nga Muslimi Digital.",
      },
      { property: "og:title", content: "Muslimi Digital — Diagnoza Falas" },
      {
        property: "og:description",
        content: "Nëse dikush kërkon shërbimin tënd sot, a përfundon tek ti apo tek konkurrenti?",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Landing,
});
