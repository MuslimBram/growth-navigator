import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/rezultati/$sessionId")({
  head: () => ({
    meta: [
      { title: "Rezultati i Diagnozës — Muslimi Digital" },
      { name: "description", content: "Diagnoza personale e biznesit tënd." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResultPage,
});

function ResultPage() {
  const { sessionId } = Route.useParams();

  // PLACEHOLDER — the full result UI (counters, AI diagnosis, service cards,
  // contact capture, final CTA) is implemented in Phase 5–7.
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-radial-glow opacity-50" />
      <main className="relative z-10 mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-1.5 text-xs text-muted-foreground">
          Sesion · <span className="font-mono">{sessionId.slice(0, 8)}</span>
        </div>
        <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Rezultati po <span className="text-gradient-primary">përgatitet</span>
        </h1>
        <p className="mt-4 max-w-md text-balance text-muted-foreground">
          Ky ekran do të mbushet plotësisht në fazat e ardhshme: motori i AI,
          simulimi i humbjeve, kartat e shërbimit dhe CTA përfundimtare.
        </p>
        <Link
          to="/"
          className="mt-10 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-6 py-3 text-sm font-medium hover:border-primary/40 hover:bg-surface-elevated"
        >
          ← Kthehu në fillim
        </Link>
      </main>
    </div>
  );
}
