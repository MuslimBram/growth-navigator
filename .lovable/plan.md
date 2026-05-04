# Strategist Persona Upgrade for Business Chat

Goal: turn the chat AI in `/analizo-biznesin` from a polite consultant into a confident strategist that challenges the user, then produces a structured 5-section verdict. Keep the existing question-gathering flow intact — only the persona, the persuasion intensity, and the FINAL diagnosis format change.

## What changes

### 1. Persona & tone (in `SYSTEM_PROMPT`)
- Rewrite the persona block: "experienced business strategist", confident, never says "varet" / "it depends", challenges beliefs, uses comparisons (DIY vs professional management), names hidden losses (time, clients, missed opportunities).
- Keep the existing safety rule: never invent monetary figures (€/$/Lekë) for lost revenue. "Cost of doing nothing" is described qualitatively + in time/clients/opportunities, not fake euros.
- Keep the "max 2 questions at a time" rule and the existing context-gathering checklist.
- Add psychological trigger questions to the asking pool: feels underperforming online? thinks clients are slipping away without knowing why? believes they can scale alone?
- Add adaptive intensity:
  - low consistency / no analytics / poor results → high persuasion intensity, sharper challenge.
  - advanced operator → strategic upsell tone (Premium combined package, automation, ads).

### 2. Language auto-detection
Add a rule at the top of the prompt: **detect the user's language from their messages and reply in the same language** (Albanian default, but switch to English / Italian / etc. if the user writes in that language). All section headers below have bilingual labels so the model can localize them.

### 3. New final diagnosis structure
Replace the current `---DIAGNOZA--- … ---FUND---` template with the 5-section structure. The sentinel markers stay (`---DIAGNOZA---` / `---FUND---`) because `analizo-biznesin.tsx` already detects them at line 194/198 to gate lead capture — we don't touch that detection logic.

New body inside the markers:

```
1. KONTROLL I REALITETIT / REALITY CHECK
   [what is actually happening with their online presence right now]

2. ÇFARË MENDON / WHAT THEY THINK
   [their stated belief, e.g. "mund ta bëj vetë" / "postimet mjaftojnë"]

3. ÇFARË ËSHTË E VËRTETA / WHAT IS TRUE
   [break that belief with logic, comparisons, industry patterns]

4. KOSTOJA E MOSVEPRIMIT / COST OF DOING NOTHING
   [qualitative losses: klientë që shkojnë te konkurrenti, orë të humbura,
    mundësi të humbura çdo muaj — NO invented €/$ figures]

5. REKOMANDIMI / RECOMMENDATION
   [strong, specific recommendation tied to a Muslimi Digital service:
    SEO, Web 3D, Foto/Video 360°, Social Media, Google Maps, Combined Premium,
    Automation, Ads, Analytics — only if justified by the answers]

Lër kontaktin tënd (email ose WhatsApp) dhe Muslimi Digital do ta dërgojë
planin e plotë sa më shpejt.
```

The model picks the localized header set based on detected language; bilingual labels are only a hint, output uses one language.

### 4. No frontend / no DB changes
- `src/routes/analizo-biznesin.tsx` already strips `---DIAGNOZA---` and triggers `setIsDiagnosis(true)` when the markers appear — works unchanged.
- No new tables, no new server functions, no new components.

## Files touched

- `src/server/business-chat.functions.ts` — replace the `SYSTEM_PROMPT` constant (only). No changes to the schema, the gateway call, image handling, or error handling. Diagnosis-detection heuristic in the same file (`reply.includes("---DIAGNOZA---")`) stays as-is.

## Out of scope

- No changes to admin recommendations, micro-services, or packages.
- No new UI in the chat page; persuasion is purely prompt-driven.
- No monetary loss estimates (kept the existing safety rule — auto-generated € figures are still forbidden).
