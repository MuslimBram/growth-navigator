## Problemi

Kartat e "Real results from our clients" mbeten në shqip edhe kur faqja është në anglisht. Shkaku: server function `translateCaseStudies` po i bën thirrje URL-së së gabuar të AI Gateway:

- **Tani (gabim)**: `https://api.lovable.ai/v1/chat/completions` → s'ekziston, kthen error rrjeti.
- **Rregullimi**: `https://ai.gateway.lovable.dev/v1/chat/completions` (URL-ja e saktë e Lovable AI Gateway).

Komponenti `CaseStudyPreview` thirr funksionin, dështon në heshtje (catch block), dhe bie back te të dhënat origjinale shqip — prandaj ti vazhdon të shohësh shqipen.

## Plani

### 1. Rregullo `src/server/translate-content.functions.ts`

- Ndrysho URL-në e AI Gateway-it në `https://ai.gateway.lovable.dev/v1/chat/completions`.
- Shto kontroll për `LOVABLE_API_KEY` para thirrjes.
- Përdor format më të qartë për prompt-in: kërko `{"items":[...]}` për të shmangur ambiguitetin e JSON.
- Shto logging më të mirë (`console.error` me status code dhe tekstin e gabimit) që ta kapim problemin nëse përsëritet.
- Trajto rastin kur `response.ok === false` (status jo-200) duke u kthyer te items origjinale me log.

### 2. Asnjë ndryshim tjetër

- `CaseStudyPreview.tsx` dhe `case-studies.tsx` janë në rregull — logjika e cache + fallback funksionon, thjesht thirrja po dështon.
- Cache-ja invalidohet automatikisht me `updated_at`, kështu që nuk duhet pastrim manual.

## Rezultati

Pas rregullimit, kur vizitori e ka faqen në anglisht:
1. Komponenti merr case studies nga DB.
2. Thirr `translateCaseStudies` → AI Gateway përkthen në ~1-2s.
3. Përkthimi ruhet në `localStorage` (cache për vizitat e ardhshme).
4. Karta shfaqen plotësisht në anglisht: titulli, sektori, rezultati, metrikat, testimoniali.

Kur është në shqip → asnjë ndryshim, shfaq direkt nga DB pa kosto.

## Skedarët që ndryshohen

- `src/server/translate-content.functions.ts` (vetëm një skedar — riformulim i plotë me URL-në e saktë dhe error handling më të mirë).
