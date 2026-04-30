// Shared types for the diagnostic engine — usable on both client and server.

export type ServiceKey =
  | "seo"
  | "web_3d"
  | "photo_video_360"
  | "social_media"
  | "google_maps"
  | "combined_package";

export const SERVICE_LABELS: Record<ServiceKey, string> = {
  seo: "SEO — Optimizim për Google",
  web_3d: "Web 3D Profesional",
  photo_video_360: "Foto & Video 360°",
  social_media: "Menaxhim i Rrjeteve Sociale",
  google_maps: "Google Maps për Biznes",
  combined_package: "Paketë e Kombinuar Premium",
};

export const SERVICE_TAGLINES: Record<ServiceKey, string> = {
  seo: "Faqja jote duket në Google kur klientët kërkojnë.",
  web_3d: "Faqja që i bën klientët të thonë 'Po, ky është profesionisti që kërkoj'.",
  photo_video_360: "Klientët ndihen sikur kanë hyrë brenda biznesit tënd.",
  social_media: "Postime që sjellin klientë, jo vetëm pëlqime.",
  google_maps: "Të gjejnë në hartë me vlerësime që tërheqin.",
  combined_package: "Strategji e plotë që të dallon nga konkurrentët.",
};

export type AnswerKey =
  | "seo"
  | "website"
  | "visual360"
  | "social_conversion"
  | "google_maps"
  | "differentiation";

export type AnswerValue =
  | "yes"           // strong / no problem
  | "partial"       // somewhat / unsure
  | "no"            // weak / missing
  | "basic"         // for website
  | "likes_only"    // for social
  | "not_optimized" // for google_maps
  | "nothing";      // for differentiation

export interface QuestionConfig {
  key: AnswerKey;
  question: string;
  subtitle?: string;
  service: ServiceKey;
  options: Array<{
    value: AnswerValue;
    label: string;
    weak: boolean; // true = reveals a gap
  }>;
  /** Short, punchy message shown after a weak answer. */
  weakFeedback: string;
}

export const QUESTIONS: QuestionConfig[] = [
  {
    key: "seo",
    question: "Kur dikush kërkon shërbimin tënd në Google, a je në faqen e parë?",
    subtitle: "Mendo për fjalët kyçe që një klient i ri do shkruante.",
    service: "seo",
    options: [
      { value: "yes", label: "Po, dal në faqen e parë", weak: false },
      { value: "partial", label: "Nganjëherë, jo gjithmonë", weak: true },
      { value: "no", label: "Jo, ose nuk e di", weak: true },
    ],
    weakFeedback: "Pa SEO, edhe faqja më e bukur është e padukshme.",
  },
  {
    key: "website",
    question:
      "A ke një faqe interneti që i bën klientët të thonë 'wow', apo thjesht një kartëvizitë online?",
    subtitle: "Faqja e parë krijon perceptimin e parë.",
    service: "web_3d",
    options: [
      { value: "yes", label: "Po, faqe profesionale moderne", weak: false },
      { value: "basic", label: "Faqe e thjeshtë / e vjetër", weak: true },
      { value: "no", label: "Nuk kam faqe", weak: true },
    ],
    weakFeedback: "Një faqe e thjeshtë nuk mjafton. Duhet të besojnë para se të blejnë.",
  },
  {
    key: "visual360",
    question:
      "A ke foto 360° ose video që e bëjnë klientin të ndihet sikur ka hyrë brenda biznesit tënd?",
    subtitle: "Përvoja vizuale shet para se të flasësh.",
    service: "photo_video_360",
    options: [
      { value: "yes", label: "Po, kam foto/video 360° profesionale", weak: false },
      { value: "partial", label: "Vetëm disa foto të zakonshme", weak: true },
      { value: "no", label: "Jo, ende jo", weak: true },
    ],
    weakFeedback: "Shitja fillon nga vëmendja. Pa 360°, po shet me foto që nuk bindin.",
  },
  {
    key: "social_conversion",
    question:
      "Postimet që bën në rrjete sociale — sjellin klientë që të kontaktojnë, apo vetëm pëlqime?",
    subtitle: "Engagement nuk është shitje.",
    service: "social_media",
    options: [
      { value: "yes", label: "Po, sjellin klientë realë", weak: false },
      { value: "likes_only", label: "Vetëm pëlqime, pa kontakte", weak: true },
      { value: "no", label: "Nuk postoj rregullisht", weak: true },
    ],
    weakFeedback: "Like-et nuk paguajnë faturat. Klientët po.",
  },
  {
    key: "google_maps",
    question: "Nëse dikush kërkon në Google Maps, a të gjen dot? Dhe a ke vlerësime aty?",
    subtitle: "Maps është vendi ku merren vendimet lokale.",
    service: "google_maps",
    options: [
      { value: "yes", label: "Po, jam në Maps me vlerësime të mira", weak: false },
      { value: "not_optimized", label: "Jam aty, por pa vlerësime / jo i optimizuar", weak: true },
      { value: "no", label: "Nuk më gjejnë në Maps", weak: true },
    ],
    weakFeedback: "Po të mos gjesh dot në hartë, je sikur nuk ekziston.",
  },
  {
    key: "differentiation",
    question: "Çfarë të dallon nga konkurrentët? Apo po shet njësoj si gjithë të tjerët?",
    subtitle: "Pa dallim, çmimi mbetet i vetmi argument.",
    service: "combined_package",
    options: [
      { value: "yes", label: "Kam një pozicionim të qartë", weak: false },
      { value: "partial", label: "Kam disa ide, por pa strategji", weak: true },
      { value: "nothing", label: "Sinqerisht, jo shumë", weak: true },
    ],
    weakFeedback: "Pa dallim, je thjesht një tjetër ofertë në det.",
  },
];

export type AnswersMap = Partial<Record<AnswerKey, AnswerValue>>;
