# AI Chatbot — Goal Discovery + Multi-Service Upsell + Admin Brief

## Çfarë do ndryshojë

AI tani do të:
1. **Mësojë qëllimet e biznesit** (jo vetëm gjendjen aktuale) — pyet për qëllime 6–12 muaj, klientë ideal, konkurrentë.
2. **Ngacmojë dhe i mbushë mendjen** të marrë **disa shërbime së bashku** (stack 2–4), jo vetëm një.
3. **Dërgojë admini-t një BRIEF të strukturuar** me: çfarë i duhet biznesit, oferta e përshtatshme, prioriteti i kontaktit, toni i sugjeruar.

## Ndryshimi i vetëm në kod

**File:** `src/server/business-chat.functions.ts` — vetëm `SYSTEM_PROMPT` rishkruhet (rreshtat 21–111). Asgjë tjetër nuk preket.

### Bllokjet e reja brenda promptit

**Discovery — Goal-First** (max 2 pyetje për mesazh):
- Pyetje faktike (biznesi, qyteti, prezenca aktuale)
- **Pyetje qëllimi (kritike, të paktën 2 para diagnozës):**
  - Cili është qëllimi real në 6–12 muaj?
  - Sa klientë të rinj në muaj do të ndryshonin biznesin?
  - Kush është klienti ideal dhe sa sjell mesatarisht?
  - A po përpiqesh të kalosh një konkurrent specifik?
  - Si do dukej biznesi nëse online funksiononte përsosmërisht?
- Triggers psikologjikë (po humb klientë te konkurrentët? mendon se mund ta shkallëzosh vetëm?)

**Upsell Strategy — Multi-Service:**
- Default-i NUK është një shërbim i vetëm — gjithmonë stack 2–4.
- Combined Premium kur ka 3+ boshllëqe.
- Çiftëzime: Web 3D + SEO, Social + Ads, Maps + SEO, Automation + Analytics.
- Çdo shërbim paraqitet si pjesë e një sistemi.

**Diagnoza e re (6 seksione në vend të 5):**
1. Reality Check
2. **Business Goal** (i ri — ripërsërit qëllimin)
3. What They Think
4. What Is True
5. Cost of Doing Nothing
6. **Recommended STACK** (2–4 shërbime, jo një)

**ADMIN BRIEF (i ri) — pas `---FUND---`:**

```text
---ADMIN BRIEF---
Biznesi: [emri + niche]
Qyteti: [qyteti]
Qëllimi: [një rresht]
Pengesa kryesore: [#1]
Çfarë i duhet:
- need 1
- need 2
- need 3
Shërbimet e rekomanduara:
- shërbim 1 — pse
- shërbim 2 — pse
- shërbim 3 — pse
Oferta që përshtatet: [Combined Premium / Single / Custom]
Prioriteti: [I LARTË / MESATAR / I ULËT]
Toni i kontaktit: [një rresht]
---END---
```

## Si shkon te admini

`LeadCapture.tsx` tashmë e dërgon të gjithë tekstin e diagnozës te `notifyNewLead` → Telegram + ntfy. Bllok-u `ADMIN BRIEF` shfaqet automatikisht në notifikim sepse është pjesë e të njëjtit reply. **Pa ndryshime në notifikim.**

## Jashtë qëllimit (nuk preket)

- Pa pagesa (sipas memories).
- Pa ndryshime DB / UI / lead capture.
- Pa shtim modeli AI — mbetet `google/gemini-2.5-flash`.
- Logjika ekzistuese e detektimit `---DIAGNOZA---` mbetet (vetëm përmbajtja brenda ndryshon).

## Pas aprovimit

Bëj line-replace në `src/server/business-chat.functions.ts` rreshtat 21–111 me promptin e ri.