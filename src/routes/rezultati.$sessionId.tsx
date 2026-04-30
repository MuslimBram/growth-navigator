import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SERVICE_LABELS, SERVICE_TAGLINES } from "@/lib/diagnostic-types";
import type { ServiceKey } from "@/lib/diagnostic-types";
import { getResult } from "@/server/diagnostic.functions";

export const Route = createFileRoute("/rezultati/$sessionId")({
  head: () => ({
    meta: [
      { title: "Rezultati i Diagnozës — Muslimi Digital" },
      { name: "description", content: "Diagnoza personale e biznesit tënd." },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: async ({ params }) => {
    const result = await getResult({ data: { sessionId: params.sessionId } });
    if (!result) throw notFound();
    return result;
  },
  errorComponent: ResultError,
  notFoundComponent: ResultNotFound,
  component: ResultPage,
});

function ResultPage() {
  const data = Route.useLoaderData();
  const primary = data.primary_service as ServiceKey;
  const secondaries = data.secondary_services as ServiceKey[];

  // The full polished UI (counters animation, contact capture, final CTA)
  // lands in Phase 5–7. This intermediate version proves the data flow works.
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-radial-glow opacity-50" />
      <main className="relative z-10 mx-auto max-w-2xl px-6 py-16">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-warning/30 bg-warning/5 px-4 py-1.5 text-xs text-warning">
          <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
          Rezultati yt
        </div>
        <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Diagnoza është gati
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          {data.diagnosis}
        </p>

        <div className="mt-10 grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Klientë të humbur / muaj
            </div>
            <div className="mt-2 font-display text-3xl font-bold text-warning">
              ~{data.estimated_lost_clients}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Të ardhura të humbura
            </div>
            <div className="mt-2 font-display text-3xl font-bold text-warning">
              ~€{data.estimated_lost_eur}
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-primary/40 bg-primary/5 p-6 shadow-glow">
          <div className="text-xs uppercase tracking-wider text-primary">
            Zgjidhja kryesore
          </div>
          <h2 className="mt-2 font-display text-2xl font-bold">
            {SERVICE_LABELS[primary]}
          </h2>
          <p className="mt-2 text-muted-foreground">{SERVICE_TAGLINES[primary]}</p>
        </div>

        {secondaries.length > 0 && (
          <div className="mt-4 space-y-3">
            {secondaries.map((s) => (
              <div
                key={s}
                className="rounded-xl border border-border bg-surface p-4"
              >
                <div className="font-semibold">{SERVICE_LABELS[s]}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {SERVICE_TAGLINES[s]}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full border border-border bg-surface px-6 py-3 text-sm font-medium hover:border-primary/40"
          >
            ← Kthehu
          </Link>
          <span className="text-xs text-muted-foreground sm:self-center">
            Faza tjetër: counters të animuar, kapja e kontaktit, CTA përfundimtare.
          </span>
        </div>
      </main>
    </div>
  );
}

function ResultError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl font-bold">Diçka shkoi keq</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error.message || "Nuk arritëm të ngarkojmë rezultatin."}
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-full bg-gradient-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
        >
          Provo Përsëri
        </button>
      </div>
    </div>
  );
}

function ResultNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl font-bold">
          Sesioni nuk u gjet
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Mund të ketë skaduar ose linku është i pasaktë.
        </p>
        <Link
          to="/diagnoze"
          className="mt-6 inline-flex rounded-full bg-gradient-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
        >
          Nis një diagnozë të re
        </Link>
      </div>
    </div>
  );
}
