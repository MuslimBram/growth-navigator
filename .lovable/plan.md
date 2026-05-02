## Qëllimi

Çdo gjë që sheh **biznesi/përdoruesi** duhet të jetë në gjuhën aktive (EN ose SQ) — jo gjysmë e përkthyer. Admin Panel **mbetet siç është** (nuk preket).

## Çfarë gjeta që ende është vetëm shqip

Verifikova me `rg` për karaktere shqipe (ë, ç) dhe fjalë kyçe në të gjitha route/komponentët user-facing. Këto faqe janë **plotësisht hardcoded në shqip**:

| Skedar | Çfarë mbetet |
|---|---|
| `src/routes/rezultati.$sessionId.tsx` | Gjithë faqja (titujt, CTA, mesazhet e gabimit, meta tags) |
| `src/routes/analizo-biznesin.tsx` | Hero, mesazhi fillestar i AI, placeholders, toast errors, ekrani i suksesit, lead form, meta tags |
| `src/routes/historiku.tsx` | "Analizë e re", "Asnjë analizë ende", "Pa emër", CTA, etj. |
| `src/routes/krahaso.tsx` | "Zgjidh 2 analiza", "Shërbimi kryesor", "Pa emër", etj. |
| `src/routes/case-studies.tsx` | Heading, empty state, CTA, meta description |
| `src/routes/auth.tsx` | Forma (Hyr/Krijo llogari, Fjalëkalimi, error messages) — **përdoruesit e vërtetë (admin) e shohin këtë**, por meqë është portë admin, do ta përkthejmë sepse switcher-i ndodhet edhe atje |
| `src/routes/index.tsx` (head meta) | title + description + og |
| `src/routes/__root.tsx` (head meta) | default title/description SEO |
| `src/components/LanguageSwitcher.tsx` | tooltip — tashmë bilingual (OK) |

**Komponentët tashmë të përkthyer korrekt** (nuk i prek): `Landing`, `LandingSections`, `LeadCapture`, `WhatsAppCTA`, `ExitIntentSurvey`, `CaseStudyPreview`, `ServicePage`, faqet `/services/*`, dhe diagnostic flow në `/diagnoze`.

## Plani i ndryshimeve

### 1. Zgjero fjalorin `src/lib/i18n.tsx`

Shto namespaces të reja për stringjet që mungojnë:

- `result.*` — për `rezultati.$sessionId.tsx` (titulli "Diagnosis is ready" / "Diagnoza është gati", lead gating copy, error states)
- `ai_chat.*` — për `analizo-biznesin.tsx` (mesazhi fillestar AI, placeholders, ekrani i suksesit, lead form, error toasts, hero "Where is your business stuck online?")
- `history.*` — për `historiku.tsx` (titulli, empty state, "No name", "New analysis")
- `compare.*` — për `krahaso.tsx` (selektimi, "Main service", labels)
- `cases.*` — për `case-studies.tsx` (heading, empty state, final CTA)
- `auth.*` — për `auth.tsx` (Sign in / Create account, Password, error messages)
- `seo.*` — për meta tags (default title, description, og:title) që përdoren në `index.tsx` dhe `__root.tsx`

Çdo çelës merr versionet **en** dhe **sq**. Për meta tags do të lexohet locale me `useI18n()` brenda komponentit (head() statike nuk mund të lexojë locale runtime — për këtë do bëhet ndryshimi më poshtë).

### 2. SEO meta tags dinamikë

`head()` në TanStack ekzekutohet në server-side (SSR) ku nuk ka akses në `localStorage`. Strategjia:

- **`__root.tsx` dhe `index.tsx`**: mbaj title/description **bilingual** në një string ("AI Business Diagnosis | Diagnoza Falas e Biznesit") — kjo është praktikë standarde për site dygjuhësh dhe siguron që Google i indekson të dyja. Alternativisht, e lëmë në EN si default sepse auto-detect i jep EN për shumicën jashtë Shqipërisë.
- **Per-route meta** (rezultati, analizo-biznesin, case-studies, etj.): i lëmë në EN si default (kjo është gjuha primare tani).

Do të zgjedh: **default EN për meta**, sepse auto-detect favorizon EN dhe është më e pastër për SEO ndërkombëtare. Nëse vizitori sq sheh meta në EN për një moment, kjo është OK (përmbajtja e faqes ndryshon menjëherë sapo ngarkohet React).

### 3. Përditëso komponentët

Për secilin nga skedarët e listuar më lart:

```tsx
import { useT } from "@/lib/i18n";

function Page() {
  const t = useT();
  // zëvendëso çdo string të dukshëm me t("namespace.key")
}
```

Shembull konkret për `historiku.tsx`:
```tsx
{t("history.empty_title")}        // "Asnjë analizë ende" / "No analyses yet"
{a.businessName || t("history.no_name")}  // "Pa emër" / "Unnamed"
{t("history.new")}                 // "Analizë e re" / "New analysis"
```

Për `analizo-biznesin.tsx` mesazhi fillestar AI bëhet funksion që merr locale-në, jo `const`:
```tsx
const initialMessage = t("ai_chat.greeting"); // multiline string nga fjalori
```

### 4. Korrigjim i vogël — bug

Në `diagnoze.tsx:74` ka `"(pa emër)"` brenda metadata analytics — kjo dërgohet në backend, jo e dukshme nga përdoruesi, por e lë në EN për konsistencë: `"(no name)"`.

## Çfarë NUK preket (sipas kërkesës sate)

- `src/routes/admin.tsx` dhe gjithë `src/components/Admin*` — mbeten në shqip
- Database content (case_studies, etj.) — admin i kontrollon manualisht
- Email/Telegram notifications te owner — mbesin në shqip (drejtuar TY, jo biznesit)

## Përfundimi

Pas këtyre ndryshimeve: kur përdoruesi zgjedh **EN** (auto ose manual), **çdo string në `/`, `/diagnoze`, `/rezultati/...`, `/analizo-biznesin`, `/historiku`, `/krahaso`, `/case-studies`, `/services/*`, `/auth`** do të jetë në anglisht. Kur zgjedh **SQ**, gjithçka bëhet shqip. Admin Panel mbetet i pandryshuar.

## Skedarët që do të ndryshohen

- `src/lib/i18n.tsx` (zgjerim fjalori — namespaces të reja)
- `src/routes/rezultati.$sessionId.tsx`
- `src/routes/analizo-biznesin.tsx`
- `src/routes/historiku.tsx`
- `src/routes/krahaso.tsx`
- `src/routes/case-studies.tsx`
- `src/routes/auth.tsx`
- `src/routes/index.tsx` (vetëm meta)
- `src/routes/__root.tsx` (vetëm meta)
- `src/routes/diagnoze.tsx` (një string analytics)
