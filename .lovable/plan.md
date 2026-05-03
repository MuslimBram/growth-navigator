## Micro Services Marketplace (Boost Suggestions)

Modul i ri që shton **shërbime boost on-demand** (Followers, Likes, Views, Komente, Monetizim) si **opsione shtesë** për propozimet ekzistuese. Trajtohen GJITHMONË si shtesë, kurrë si zgjidhje kryesore.

### 1. Database Schema (migration)

**Enum-e të reja:**
- `micro_platform`: facebook, instagram, tiktok, youtube, twitter, linkedin
- `micro_category`: growth, engagement, engagement_high, visibility_boost, advanced
- `micro_variant`: S, M, L, XL, none
- `risk_level`: low, medium, high
- `usage_status`: pending, approved, rejected, delivered

**Tabela `micro_services`:**
- id, group_name (default 'Shërbime Individuale'), platform, category, service_name, variant, unit
- standard_price, offer_price, currency (USD)
- difference + discount_percentage si **GENERATED columns**
- delivery_time, description, risk_level, recommended_use_case
- active, display_order, created_at, updated_at

**Tabela `micro_service_usage`:**
- id, recommendation_id (→ admin_recommendations.id), service_id (→ micro_services.id)
- quantity, total_price, status, admin_notes, created_at
- Lidhet me `admin_recommendations` (siç u vendos), jo me `businesses` që nuk ekziston

**RLS:** të dyja tabelat → `Admins manage` (përdor `has_role(auth.uid(), 'admin')`), njëlloj si `service_packages` / `addon_services`.

**Trigger auto-categorize:** funksion PL/pgSQL që vendos `category` automatikisht para INSERT/UPDATE bazuar në `service_name` (rregullat e specifikuara në brief).

**Shtesë te `admin_recommendations`:**
- `recommended_micro_services jsonb default '[]'` — array me {service_id, quantity, total_price, reason}
- `micro_services_total numeric default 0`
- `boost_eligible boolean default false` — rezultati i kontrollit "plotëson kushtet boost"

### 2. Seed data

~75 shërbime totale: Facebook (20), Instagram (15 — me çmime të ngjashme me FB sipas kërkesës), TikTok (7), YouTube (22), Twitter (13), LinkedIn (3). Të gjitha çmimet në USD me standard_price + offer_price + risk_level + recommended_use_case.

### 3. Recommendation Engine — përditësim

`src/server/recommendation-engine.server.ts`:

**Hap 1: Eligibility gate** — `checkBoostEligibility(ctx)` kthen `boost_eligible: boolean` + arsyet. Kthen `true` VETËM nëse:
- biznesi ka website (përgjigje në answers ose IG bio)
- ka përmbajtje aktive (signal nga diagnoza/answers: "poston rregullisht")
- AI rekomandon tashmë një paketë strategjike kryesore

**Hap 2: AI tool i ri** — shtoj `recommended_micro_services` te `submit_recommendation` schema, i tipit array (0–4 items) me `service_id`, `quantity`, `reason`. Përfshihet katalogu i micro_services në prompt.

**Hap 3: System prompt update** — rregulla strikte:
- "STEP 1 paketë → STEP 2 add-ons → STEP 3 micro services (vetëm nëse boost_eligible=true)"
- "MOS sugjero Followers/Likes/Views nëse mungon strategji+përmbajtje+website"
- Sugjero vetëm kur ka: reach i ulët, fushatë aktive, launch produkti, event

Nëse `boost_eligible=false`, AI thirret pa katalogun e micro services dhe array-i mbetet bosh.

### 4. Backend functions

`src/server/recommendations.functions.ts` — shto:
- `updateRecommendationMicroServices({ recommendationId, items })` — ricalcullon `micro_services_total` dhe `offer_price_total`
- `getMicroServicesCatalog()` — për UI

`src/server/micro-services.functions.ts` (e re):
- `listMicroServices()`, `createMicroService()`, `updateMicroService()`, `deleteMicroService()`, `toggleActive()`

### 5. Admin Panel UI

**Tab i ri "Boost Services"** te `src/routes/admin.tsx` → `<AdminMicroServices />`:
- CRUD i plotë i katalogut (njëlloj si `AdminAddons`)
- Filtra: platformë, kategori, risk level, active/inactive
- Tabelë me kolona: Platform badge (ngjyra specifike), Service, Variant, Çmimi ofertë, Risk badge, Discount %
- Zbritjet >30% portokalli, >50% e kuqe + bold

**Përditësim te `AdminRecommendations.tsx`:**
- Seksion i ri "🚀 Boost Suggestions" në modal-in e detajeve, **vetëm kur `boost_eligible=true`**
- Banner paralajmërimi: "⚠️ Këto janë shërbime boost dhe nuk zëvendësojnë strategjinë organike."
- Tabelë me micro services të sugjeruara nga AI: checkbox "Shto në propozim", quantity input, risk badge, arsyeja
- Buton "Shfleto katalogun" për të shtuar manualisht
- Total i ri: `Paketat + Add-ons + Micro Services = Grand Total`

Nëse `boost_eligible=false`, shfaqet vetëm një notë: *"Biznesi nuk plotëson kushtet për boost services (mungon: …)"*.

### 6. Proposal text (WhatsApp)

Te tekstuara e propozimit për klientin, micro services shfaqen në fund në një seksion të ndarë:

```
📦 Opsione Shtesë për Rritje të Përkohshme
Për të përshpejtuar rezultatet, mund të shtohen edhe:
• 5K Views Boost — $X
• 1K Followers — $Y
*Këto janë opsionale dhe nuk ndikojnë në paketën kryesore.
```

AI gjeneron këtë vetëm nëse ka micro services të zgjedhura.

### 7. Abuse protection

Funksion `checkDailyLimit(recommendationId, serviceCategory)` te server: kontrollon `micro_service_usage` për sot:
- max 10 views, 5 likes, 3 followers, 3 comments për recommendation/ditë

Thirret para se Admini të shtojë në propozim. Nëse tejkalohet → toast error.

### 8. Files

**Të reja:**
- `supabase/migrations/<timestamp>_micro_services.sql` (schema + trigger + seed)
- `src/server/micro-services.functions.ts`
- `src/components/AdminMicroServices.tsx`

**Të modifikuara:**
- `src/server/recommendation-engine.server.ts` — eligibility check + tool schema + prompt
- `src/server/recommendations.functions.ts` — updateRecommendationMicroServices, daily limit
- `src/components/AdminRecommendations.tsx` — seksioni Boost + total i ri
- `src/routes/admin.tsx` — tab i ri "Boost"

### Çfarë përjashtoj qëllimisht

- **Tabelë `businesses`** — nuk ekziston; përdor `admin_recommendations` si pikë lidhjeje (vendimi yt).
- **Faqe publike Micro Services** — sugjerimi #1 e propozonte, por bie ndesh me direktivën kryesore "rezultatet pas lead capture, asnjëherë çmimet agresive te klienti". Mbahet vetëm si modul Admin + opsion në propozim.
- **Kombinime automatike pre-defined** (pika 9) — AI tashmë i gjeneron dinamikisht bazuar në kontekst; tabelë e veçantë do ishte mbingarkesë.
