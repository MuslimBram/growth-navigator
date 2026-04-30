// Shared types for the diagnostic engine — usable on both client and server.

export type ServiceKey =
  | "seo"
  | "web_3d"
  | "photo_video_360"
  | "social_media"
  | "google_maps"
  | "combined_package"
  | "automation"
  | "ads"
  | "analytics_measurement";

export const SERVICE_LABELS: Record<ServiceKey, string> = {
  seo: "SEO — Optimizim për Google",
  web_3d: "Web 3D Profesional",
  photo_video_360: "Foto & Video 360°",
  social_media: "Menaxhim i Rrjeteve Sociale",
  google_maps: "Google Maps për Biznes",
  combined_package: "Paketë e Kombinuar Premium",
  automation: "Automatizim & AI",
  ads: "Reklama Dixhitale (Facebook/Google Ads)",
  analytics_measurement: "Matje & Analitikë",
};

export const SERVICE_TAGLINES: Record<ServiceKey, string> = {
  seo: "Faqja jote duket në Google kur klientët kërkojnë.",
  web_3d: "Faqja që i bën klientët të thonë 'Po, ky është profesionisti që kërkoj'.",
  photo_video_360: "Klientët ndihen sikur kanë hyrë brenda biznesit tënd.",
  social_media: "Postime që sjellin klientë, jo vetëm pëlqime.",
  google_maps: "Të gjejnë në hartë me vlerësime që tërheqin.",
  combined_package: "Strategji e plotë që të dallon nga konkurrentët.",
  automation: "Sisteme që punojnë për ty 24/7, edhe kur fle.",
  ads: "Reklama që sjellin klientë me ROI të matshëm.",
  analytics_measurement: "Vendime të bazuara në të dhëna, jo supozime.",
};

export type AnswerKey =
  | "online_leads"
  | "contact_method"
  | "automation"
  | "measurement"
  | "ads"
  | "brand_positioning"
  | "working_hours"
  | "growth_match"
  | "virtual_experience"
  | "funnel"
  | "ai_usage";

export type AnswerValue =
  | "yes"
  | "partial"
  | "no"
  | "0"
  | "1_5"
  | "5_20"
  | "dont_know"
  | "whatsapp"
  | "phone"
  | "dm"
  | "website_form"
  | "not_often"
  | "works_well"
  | "not_much"
  | "cheap_price"
  | "quality"
  | "no_answer"
  | "2_4h"
  | "5_8h"
  | "8_plus"
  | "something"
  | "writes_sometimes"
  | "clear_path";

export interface QuestionConfig {
  key: AnswerKey;
  question: string;
  subtitle?: string;
  service: ServiceKey;
  options: Array<{
    value: AnswerValue;
    label: string;
    weak: boolean;
  }>;
  weakFeedback: string;
  /** If defined, question only shows when this returns true */
  showIf?: (answers: AnswersMap) => boolean;
}

export const QUESTIONS: QuestionConfig[] = [
  // 1. LEADS & KONVERTIM — always shown
  {
    key: "online_leads",
    question: "Sa klientë të vijnë çdo muaj nga online?",
    subtitle: "Mendo për klientë që të gjejnë përmes internetit.",
    service: "combined_package",
    options: [
      { value: "0", label: "0 — asnjë", weak: true },
      { value: "1_5", label: "1–5 klientë", weak: true },
      { value: "5_20", label: "5–20 klientë", weak: false },
      { value: "dont_know", label: "Nuk e di", weak: true },
    ],
    weakFeedback: "Problemi yt nuk është mungesa e klientëve… është mungesa e sistemit për t'i kapur.",
  },
  // 2. SHITJA — always shown
  {
    key: "contact_method",
    question: "Si të kontaktojnë zakonisht klientët?",
    subtitle: "Rruga kryesore që klientët përdorin për të arritur tek ti.",
    service: "web_3d",
    options: [
      { value: "website_form", label: "Formë në website", weak: false },
      { value: "whatsapp", label: "WhatsApp", weak: true },
      { value: "phone", label: "Telefon", weak: true },
      { value: "dm", label: "DM në rrjete sociale", weak: true },
      { value: "not_often", label: "Nuk më kontaktojnë shpesh", weak: true },
    ],
    weakFeedback: "Po humbet klientë sepse nuk ke një rrugë të qartë për shitje.",
  },
  // 3. AUTOMATION — shown if contact method is weak
  {
    key: "automation",
    question: "A ke ndonjë sistem që u përgjigjet klientëve automatikisht?",
    subtitle: "P.sh. chatbot, auto-reply, email sekuencë.",
    service: "automation",
    options: [
      { value: "yes", label: "Po", weak: false },
      { value: "no", label: "Jo", weak: true },
    ],
    weakFeedback: "Po humbet kohë dhe klientë çdo ditë pa e kuptuar.",
    showIf: (a) => {
      const v = a.contact_method;
      return v === "whatsapp" || v === "phone" || v === "dm" || v === "not_often";
    },
  },
  // 4. MATJA — always shown
  {
    key: "measurement",
    question: "A e di saktë sa njerëz hyjnë dhe sa blejnë?",
    subtitle: "Matja e trafikut, konvertimeve, ROI-t.",
    service: "analytics_measurement",
    options: [
      { value: "yes", label: "Po, i ndjek numrat", weak: false },
      { value: "partial", label: "Pjesërisht", weak: true },
      { value: "no", label: "Jo", weak: true },
    ],
    weakFeedback: "Pa matje, po merr vendime me mend.",
  },
  // 5. REKLAMAT — always shown
  {
    key: "ads",
    question: "A përdor reklama (Facebook / Google Ads)?",
    subtitle: "Reklama të paguara për të arritur klientë të rinj.",
    service: "ads",
    options: [
      { value: "works_well", label: "Po, funksionojnë mirë", weak: false },
      { value: "not_much", label: "Po, por nuk funksionojnë shumë", weak: true },
      { value: "no", label: "Jo", weak: true },
    ],
    weakFeedback: "Po lë tregun në dorë të atyre që paguajnë për vëmendje.",
  },
  // 6. POZICIONIMI (BRAND) — always shown
  {
    key: "brand_positioning",
    question: "Kur dikush dëgjon për biznesin tënd, çfarë mendon menjëherë?",
    subtitle: "Identiteti i brendit tënd në mendjen e klientëve.",
    service: "combined_package",
    options: [
      { value: "quality", label: "Cilësi", weak: false },
      { value: "cheap_price", label: "Çmim i lirë", weak: true },
      { value: "dont_know", label: "Nuk e di", weak: true },
      { value: "no_answer", label: "Nuk kam përgjigje", weak: true },
    ],
    weakFeedback: "Pa identitet, je i zëvendësueshëm.",
  },
  // 7. KOHË VS RRITJE — always shown
  {
    key: "working_hours",
    question: "Sa orë në ditë punon për biznesin?",
    subtitle: "Dhe a po rritet siç duhet për këtë kohë?",
    service: "automation",
    options: [
      { value: "2_4h", label: "2–4 orë", weak: false },
      { value: "5_8h", label: "5–8 orë", weak: true },
      { value: "8_plus", label: "8+ orë", weak: true },
    ],
    weakFeedback: "Problemi nuk është sa punon… por si punon.",
  },
  // 8. EKSPERIENCA VR/360 — always shown
  {
    key: "virtual_experience",
    question: "A mundet klienti të 'hyjë' virtualisht në biznesin tënd para se të vijë?",
    subtitle: "Tur virtual, foto 360°, eksperiencë online.",
    service: "photo_video_360",
    options: [
      { value: "yes", label: "Po", weak: false },
      { value: "no", label: "Jo", weak: true },
    ],
    weakFeedback: "Konkurrentët që japin eksperiencë fitojnë më shpejt.",
  },
  // 9. FUNNEL — always shown
  {
    key: "funnel",
    question: "Çfarë ndodh pasi dikush të sheh për herë të parë?",
    subtitle: "Rruga nga vëmendja tek blerja.",
    service: "combined_package",
    options: [
      { value: "something", label: "Asgjë", weak: true },
      { value: "writes_sometimes", label: "Më shkruan ndonjëherë", weak: true },
      { value: "clear_path", label: "Ka një rrugë të qartë (website, CTA, etj.)", weak: false },
    ],
    weakFeedback: "Ti ke vëmendje… por nuk ke sistem për ta kthyer në klient.",
  },
  // 10. AI & TEKNOLOGJIA — shown if funnel or automation is weak
  {
    key: "ai_usage",
    question: "A përdor ndonjë AI për biznesin tënd?",
    subtitle: "ChatGPT, automatizim, mjete dixhitale të avancuara.",
    service: "automation",
    options: [
      { value: "yes", label: "Po", weak: false },
      { value: "no", label: "Jo", weak: true },
      { value: "dont_know", label: "Nuk e di si", weak: true },
    ],
    weakFeedback: "Bizneset që përdorin AI po lëvizin më shpejt se ti.",
    showIf: (a) => {
      return a.funnel === "something" || a.funnel === "writes_sometimes" ||
             a.automation === "no" || a.working_hours === "8_plus";
    },
  },
];

export type AnswersMap = Partial<Record<AnswerKey, AnswerValue>>;

/**
 * Compute the list of visible questions given current answers.
 * Always returns max 8 questions.
 */
export function getVisibleQuestions(answers: AnswersMap): QuestionConfig[] {
  const visible: QuestionConfig[] = [];
  for (const q of QUESTIONS) {
    if (visible.length >= 8) break;
    if (!q.showIf || q.showIf(answers)) {
      visible.push(q);
    }
  }
  return visible;
}
