import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

export type Locale = "en" | "sq";

const STORAGE_KEY = "md_locale";

/* -------------------------------------------------------------------------- */
/*  Detection                                                                  */
/* -------------------------------------------------------------------------- */

function detectLocale(): Locale {
  if (typeof window === "undefined") return "en";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "sq") return saved;
  } catch { /* ignore */ }

  // 1. Browser language starts with "sq"
  const langs = (navigator.languages && navigator.languages.length
    ? navigator.languages
    : [navigator.language || ""]) as string[];
  if (langs.some((l) => l.toLowerCase().startsWith("sq"))) return "sq";

  // 2. Timezone is Tirana (Albania / Kosovo / Macedonia share it via Belgrade)
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (tz === "Europe/Tirane" || tz === "Europe/Belgrade" || tz === "Europe/Skopje") {
      return "sq";
    }
  } catch { /* ignore */ }

  return "en";
}

/* -------------------------------------------------------------------------- */
/*  Context                                                                    */
/* -------------------------------------------------------------------------- */

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  // Always start with "en" for SSR consistency, hydrate to detected on mount
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const detected = detectLocale();
    setLocaleState(detected);
    if (typeof document !== "undefined") {
      document.documentElement.lang = detected;
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* ignore */ }
    if (typeof document !== "undefined") document.documentElement.lang = l;
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dict = TRANSLATIONS[locale] as Record<string, string>;
      let str = dict[key];
      if (str === undefined) {
        // Fallback to English, then to the key itself
        str = (TRANSLATIONS.en as Record<string, string>)[key] ?? key;
      }
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        }
      }
      return str;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Safe fallback so components don't crash when used outside provider
    return {
      locale: "en",
      setLocale: () => {},
      t: (k: string) => (TRANSLATIONS.en as Record<string, string>)[k] ?? k,
    };
  }
  return ctx;
}

export function useT() {
  return useI18n().t;
}

/* -------------------------------------------------------------------------- */
/*  Dictionaries                                                               */
/* -------------------------------------------------------------------------- */

export const TRANSLATIONS = {
  en: {
    /* Common */
    "common.brand_tag": "Free Diagnosis · 2 minutes",
    "common.admin": "Admin",
    "common.back": "Back",
    "common.home": "Home",
    "common.send_lead": "Send Lead",
    "common.sending": "Sending...",
    "common.continue": "Continue",
    "common.close": "Close",
    "common.something_wrong": "Something went wrong. Please try again.",
    "common.or": "or",
    "common.optional": "optional",
    "common.return_home": "Return home",
    "common.see_all": "See all",

    /* Landing */
    "landing.limited_slots": "Limited slots this month",
    "landing.headline_returning": "Haven't fixed this {highlight} yet?",
    "landing.headline_returning_highlight": "problem",
    "landing.headline_default": "If someone is looking for your service today… {highlight}",
    "landing.headline_default_highlight": "do they end up with you, or with your competitor?",
    "landing.subtitle_default": "Discover in 2 minutes which services your business is missing.",
    "landing.subtitle_returning": "Or do you want to explore something else? Start a new free diagnosis.",
    "landing.cta_start": "Start Free Diagnosis",
    "landing.cta_ai": "Analyze with AI",
    "landing.cta_disclaimer": "No email · no signup · 6 questions",
    "landing.cta_history": "See previous analyses →",
    "landing.stats_questions": "questions",
    "landing.stats_time": "time",
    "landing.stats_personalized": "personalized",
    "landing.cases_title": "Real results from our clients",

    /* Landing sections */
    "sections.how_title": "How it works",
    "sections.how_subtitle": "Three steps. No email up front. No games with your time.",
    "sections.how_1_title": "Answer 6 questions",
    "sections.how_1_desc": "Direct questions about the real state of your business online.",
    "sections.how_2_title": "Get your diagnosis",
    "sections.how_2_desc": "AI analyzes and pinpoints exactly where you are losing customers.",
    "sections.how_3_title": "Personalized solution",
    "sections.how_3_desc": "We recommend the service that solves the problem — no guesswork.",
    "sections.services_title": "What we offer",
    "sections.services_subtitle": "6 services that cover everything from visibility to conversion.",
    "sections.cta_title": "Your competitors are already doing this.",
    "sections.cta_desc": "Every day you delay, someone else is taking the customers that should have come to you. The diagnosis is free — the loss is not.",

    /* Diagnoze */
    "diag.head_title": "Diagnosis — Muslimi Digital",
    "diag.head_desc": "Answer the short questions and our team will get back with a personalized analysis.",
    "diag.business_q": "What is your business called?",
    "diag.business_help": "The business name helps us craft a more personalized diagnosis.",
    "diag.business_placeholder": "e.g. Caffe Milano, Studio Bella...",
    "diag.business_continue_with": "Continue with diagnosis",
    "diag.business_continue_without": "Continue without a name",
    "diag.business_skip_hint": "You can leave it blank — the diagnosis works the same.",
    "diag.question_label": "Question",
    "diag.of": "of",
    "diag.context_badge": "Optional step — the more info, the more accurate the analysis",
    "diag.context_title": "Tell us a bit more (optional)",
    "diag.context_desc": "Every detail helps our team give you a real analysis, not a generic one.",
    "diag.context_label": "What would you like to tell our team?",
    "diag.context_placeholder": "e.g. industry, city, how many years you've been operating, what you've tried so far, where you feel stuck...",
    "diag.screenshots_label": "Screenshots from Instagram, website, Google Maps (max 4)",
    "diag.screenshots_help": "AI looks at them and includes them in the analysis.",
    "diag.add_image": "Add image",
    "diag.remove_image": "Remove image",
    "diag.max_images": "Maximum 4 images.",
    "diag.upload_failed": "Image upload failed",
    "diag.lead_badge": "Final step",
    "diag.lead_title": "Where should we send you the analysis?",
    "diag.lead_desc": "Our team will send your personal analysis within 24 hours via Email or WhatsApp. Free, no spam.",
    "diag.email_placeholder": "Your email",
    "diag.whatsapp_placeholder": "WhatsApp (e.g. +355 69 ...)",
    "diag.lead_hint": "One of the two is enough. Both = a faster reply.",
    "diag.lead_submit": "Send & Wait for Analysis",
    "diag.lead_required": "Please leave email or WhatsApp to receive the analysis.",
    "diag.submitting_named": "Sending the analysis for \"{name}\"…",
    "diag.submitting": "Sending the analysis…",
    "diag.submitting_hint": "Just a few seconds.",
    "diag.done_thanks_named": "Thank you, {name}!",
    "diag.done_thanks": "Thank you!",
    "diag.done_desc_email_wa": "Your analysis is being prepared personally by our team. We'll contact you within 24 hours via Email and WhatsApp.",
    "diag.done_desc_email": "Your analysis is being prepared personally by our team. We'll contact you within 24 hours via Email.",
    "diag.done_desc_wa": "Your analysis is being prepared personally by our team. We'll contact you within 24 hours via WhatsApp.",
    "diag.done_what_now": "What's happening now:",
    "diag.done_step1": "Your answers have been recorded",
    "diag.done_step2": "AI and our team are reviewing your case",
    "diag.done_step3": "You'll receive your personal plan free of charge",
    "diag.done_wa_cta": "💬 Discuss it now on WhatsApp",
    "diag.done_back": "← Back to start",
    "diag.wa_msg_done": "Hello! I just submitted the diagnosis{forBusiness}. I'd like to discuss it as soon as possible.",
    "diag.wa_for_business": " for \"{name}\"",

    /* Lead capture */
    "lead.success_title": "Your information has been sent",
    "lead.success_desc": "Our team will contact you shortly with a personal plan.",
    "lead.title": "Get your free personal plan",
    "lead.desc": "Leave your Email or WhatsApp — we'll contact you shortly.",
    "lead.business_placeholder": "Business name (optional)",
    "lead.email_placeholder": "Your email",
    "lead.submit": "Send & Get Plan",
    "lead.invalid": "The information is invalid. Check your email or WhatsApp.",
    "lead.wa_direct": "💬 Message directly on WhatsApp",
    "lead.wa_msg_short": "Hello! I just completed the diagnosis. Recommended for me: {service}. I'd like to discuss further.",
    "lead.bottleneck": "Business diagnosis",

    /* WhatsApp CTA */
    "wa.title": "Continue on WhatsApp",
    "wa.desc": "Message us directly for a deeper analysis — the message is ready.",
    "wa.cta_open": "💬 Continue on WhatsApp",
    "wa.fallback": "Didn't open? Copy the message and send it manually on WhatsApp.",
    "wa.copied": "Copied!",
    "wa.copy": "Copy message",
    "wa.msg_hello": "Hello Muslimi Digital.",
    "wa.msg_done": "I have completed my business diagnosis.",
    "wa.msg_main_problem": "Main problem: {problem}",
    "wa.msg_recommended": "Recommended service: {service}",
    "wa.msg_business": "Business: {name}",
    "wa.msg_book": "I'd like to book a deeper analysis.",

    /* Exit intent */
    "exit.title": "Hesitating? Tell us briefly — what didn't convince you?",
    "exit.desc": "10 seconds. Nothing is being sold here.",
    "exit.reason_not_sure": "I'm not sure I need this",
    "exit.reason_no_time": "I don't have time right now",
    "exit.reason_more_info": "I want to know more before starting",
    "exit.reason_other": "Other...",
    "exit.details_placeholder": "What held you back?",
    "exit.email_placeholder": "Email (optional) — we'll get back to you",
    "exit.submit": "Send",
    "exit.thanks_title": "Thank you!",
    "exit.thanks_desc": "Your feedback helps us improve.",

    /* Service page layout */
    "service.back": "Back",
    "service.start_diag": "Start Diagnosis",
    "service.problem": "⚠️ Problem",
    "service.solution": "✅ Solution",
    "service.results": "📊 Results",
    "service.case_real": "Real case",
    "service.cta_title": "Ready to start?",
    "service.cta_desc": "Discover in 2 minutes how you can grow.",
    "service.default_cta": "Start free diagnosis",

    /* History */
    "hist.title": "Analysis History",
    "hist.new": "New analysis",
    "hist.empty_title": "No analyses yet",
    "hist.empty_desc": "Start your first diagnosis to see your history here.",
    "hist.start": "Start Diagnosis",
    "hist.compare": "Compare 2 analyses",
    "hist.no_name": "No name",
    "hist.view": "View",
    "hist.delete": "Delete",
    "hist.main_service": "Main service:",
    "hist.diagnosis": "Diagnosis:",

    /* Compare */
    "cmp.title": "Compare 2 Analyses",
    "cmp.pick_two": "Pick 2 analyses",
    "cmp.pick_one_more": "Pick 1 more analysis",
    "cmp.pick_prefix": "Choose ",
    "cmp.pick_suffix": " for comparison:",
    "cmp.choose_others": "← Pick other analyses",
    "cmp.need_two": "You need at least 2 analyses to compare.",
    "cmp.start_diag": "Start Diagnosis",
    "cmp.label_a": "Analysis A",
    "cmp.label_b": "Analysis B",

    /* Auth */
    "auth.signin_title": "Sign in to Admin",
    "auth.signup_title": "Create account",
    "auth.subtitle": "Only administrators can access this panel.",
    "auth.password_label": "Password",
    "auth.email_label": "Email",
    "auth.signin_btn": "Sign In",
    "auth.signup_btn": "Create Account",
    "auth.google_continue": "Continue with Google",
    "auth.google_failed": "Google sign-in failed",
    "auth.toggle_signup": "Create an account with email",
    "auth.toggle_signin": "Have an account? Sign in",
    "auth.twofa": "2FA active:",
    "auth.twofa_desc": "Your Google account must have 2-Step Verification.",

    /* Case studies page */
    "cases.head_title": "Case Studies — Muslimi Digital",
    "cases.title": "Real results, no promises",
    "cases.subtitle": "How we have helped businesses like yours grow within 90 days.",
    "cases.empty": "We are preparing to publish our first case studies.",
    "cases.be_first": "Be the first case",
    "cases.problem": "Problem",
    "cases.result": "Result",
    "cases.want_results": "I want results like these",

    /* AI chat */
    "ai.head_title": "Analyze Your Business | AI Performance Diagnosis — Muslimi Digital",
    "ai.tagline": "AI Strategic Consultant",
    "ai.title_part1": "Where is your business",
    "ai.title_highlight": "stuck",
    "ai.title_part2": "online?",
    "ai.subtitle": "Talk to our AI consultant. They'll understand your business and find the bottleneck.",
    "ai.initial_message": "Hello! 👋 I'm the AI consultant from Muslimi Digital.\n\nTo help you accurately, I need to understand your business. Tell me:\n\n1. What kind of business do you run?\n2. In which city or region do you operate?",
    "ai.thinking": "Thinking…",
    "ai.error_generic": "Something went wrong. Please try again.",
    "ai.write_or_upload": "Write something or upload a screenshot.",
    "ai.placeholder": "Reply or write your question…",
    "ai.upload_help": "You can upload screenshots (PNG/JPG/WEBP · max {max} · 10MB)",
    "ai.diagnosis_ready_short": "Your analysis is ready! 🎯\n\nLeave your contact below and Muslimi Digital will send the full diagnosis as soon as possible.",
    "ai.lead_title": "Your diagnosis is ready! 🎯",
    "ai.lead_desc": "Leave your contact and Muslimi Digital will send the full plan as soon as possible.",
    "ai.lead_business": "Business name",
    "ai.lead_email": "Email *",
    "ai.lead_whatsapp": "WhatsApp (optional)",
    "ai.lead_submit": "Send me the diagnosis",
    "ai.lead_email_or_wa": "Enter email or WhatsApp number.",
    "ai.thanks_title": "Thank you! 🎯",
    "ai.thanks_desc": "Muslimi Digital will send the full diagnosis as soon as possible to the contact you provided.",
    "ai.start_new": "Start a new analysis",
    "ai.bottleneck": "Business diagnosis",
    "ai.recommended_label": "In-depth strategic analysis",
    "ai.upload_failed": "Upload failed: {name}",
    "ai.format_unsupported": "{name}: unsupported format",
    "ai.too_big": "{name}: too large (max 10MB)",
    "ai.max_files": "Maximum {max} photos",

    /* Result page */
    "result.head_title": "Your Diagnosis — Muslimi Digital",
    "result.head_desc": "Your personal business diagnosis.",
    "result.badge_unlocked": "Personal diagnosis",
    "result.badge_ready": "Your diagnosis is ready",
    "result.title_unlocked_named": "Here's what's happening with \"{name}\"",
    "result.title_unlocked": "Here's what's happening with your business",
    "result.title_locked": "Your diagnosis is ready 🔒",
    "result.intro_part1": "Based on your answers, we have identified",
    "result.intro_emphasis": "the main service",
    "result.intro_part2": "you are missing and a concrete analysis of the opportunities you are losing. Leave your contact below and get the full report + personal plan — free of charge.",
    "result.solution_title": "Main solution for you",
    "result.locked_cta": "Leave your contact so we can send\nthe result and the solution!",
    "result.unlocked_badge": "Unlocked",
    "result.plus_complement": "Plus these complement it:",
    "result.case_similar": "Similar real case",
    "result.analyze_other": "Analyze another business",
    "result.restart": "Restart diagnosis",
    "result.history": "History",
    "result.compare": "Compare results",
    "result.back_home": "← Back to start",
    "result.fallback_diagnosis": "Missing online presence",
    "result.error_title": "Something went wrong",
    "result.error_default": "We couldn't load the result.",
    "result.try_again": "Try Again",
    "result.notfound_title": "Session not found",
    "result.notfound_desc": "It may have expired or the link is incorrect.",
    "result.start_new": "Start a new diagnosis",

    /* Auth — extras */
    "auth.head_title": "Sign in — Muslimi Digital",
    "auth.email_placeholder": "you@business.com",
    "auth.back_aria": "Go back",
    "auth.home_aria": "Home",

    /* AI chat — extras */
    "ai.back_aria": "Go back",
    "ai.home_aria": "Home",

    /* Compare — extras */
    "cmp.unnamed": "No name",
    "cmp.main_service_label": "Main service:",
    "cmp.diagnosis_label": "Diagnosis:",

    /* Home/SEO defaults */
    "home.head_title": "Muslimi Digital — Free Business Diagnosis",
    "home.head_desc": "Discover in 2 minutes which digital services your business is missing. A personalized diagnosis from Muslimi Digital.",
    "home.og_title": "Muslimi Digital — Free Diagnosis",
    "home.og_desc": "If someone is searching for your service today, do they end up with you, or with your competitor?",

    /* 404 */
    "nf.title": "Page not found",
    "nf.desc": "The page you're looking for doesn't exist or has been moved.",
    "nf.go_home": "Go home",

    /* Language switcher */
    "lang.switch": "Language",
    "lang.en": "English",
    "lang.sq": "Shqip",
  },

  sq: {
    /* Common */
    "common.brand_tag": "Diagnozë Falas · 2 minuta",
    "common.admin": "Admin",
    "common.back": "Mbrapa",
    "common.home": "Faqja kryesore",
    "common.send": "Dërgo",
    "common.sending": "Duke dërguar...",
    "common.continue": "Vazhdo",
    "common.close": "Mbylle",
    "common.something_wrong": "Diçka shkoi keq. Provo përsëri.",
    "common.or": "ose",
    "common.optional": "opsionale",
    "common.return_home": "Kthehu në fillim",
    "common.see_all": "Shiko të gjitha",

    /* Landing */
    "landing.limited_slots": "Vende të limituara këtë muaj",
    "landing.headline_returning": "Ende nuk e ke {highlight} këtë problem?",
    "landing.headline_returning_highlight": "rregulluar",
    "landing.headline_default": "Nëse dikush kërkon shërbimin tënd sot… {highlight}",
    "landing.headline_default_highlight": "a përfundon tek ti apo tek konkurrenti?",
    "landing.subtitle_default": "Zbulo brenda 2 minutash cilat shërbime i mungojnë biznesit tënd.",
    "landing.subtitle_returning": "Apo do që të zbulosh ndonjë gjë tjetër? Nis një diagnozë të re falas.",
    "landing.cta_start": "Nis Diagnozën Falas",
    "landing.cta_ai": "Analizo me AI",
    "landing.cta_disclaimer": "Pa email · pa regjistrim · 6 pyetje",
    "landing.cta_history": "Shiko analizat e mëparshme →",
    "landing.stats_questions": "pyetje",
    "landing.stats_time": "kohë",
    "landing.stats_personalized": "personalizuar",
    "landing.cases_title": "Rezultate reale nga klientët tanë",

    /* Landing sections */
    "sections.how_title": "Si funksionon",
    "sections.how_subtitle": "Tre hapa. Pa email në fillim. Pa lojë me kohën tënde.",
    "sections.how_1_title": "Përgjigju 6 pyetjeve",
    "sections.how_1_desc": "Pyetje të drejtpërdrejta për gjendjen reale të biznesit tënd online.",
    "sections.how_2_title": "Merr diagnozën tënde",
    "sections.how_2_desc": "AI analizon dhe identifikon saktësisht ku po humbet klientë.",
    "sections.how_3_title": "Zgjidhja e personalizuar",
    "sections.how_3_desc": "Të rekomandojmë shërbimin që zgjidh problemin — pa supozime.",
    "sections.services_title": "Çfarë ofrojmë",
    "sections.services_subtitle": "6 shërbime që mbulojnë gjithçka prej shfaqjes deri te konvertimi.",
    "sections.cta_title": "Konkurrentët e tu po e bëjnë tashmë.",
    "sections.cta_desc": "Çdo ditë që vonon, dikush tjetër po merr klientët që do të kishin ardhur tek ti. Diagnoza është falas — humbja jo.",

    /* Diagnoze */
    "diag.head_title": "Diagnoza — Muslimi Digital",
    "diag.head_desc": "Përgjigju pyetjeve të shkurtra dhe ekipi ynë do të kthehet me një analizë të personalizuar.",
    "diag.business_q": "Si quhet biznesi yt?",
    "diag.business_help": "Emri i biznesit ndihmon për një diagnozë më të personalizuar.",
    "diag.business_placeholder": "P.sh. Caffe Milano, Studio Bella...",
    "diag.business_continue_with": "Vazhdo me diagnozën",
    "diag.business_continue_without": "Vazhdo pa emër",
    "diag.business_skip_hint": "Mund ta lësh bosh — diagnoza funksionon njëlloj.",
    "diag.question_label": "Pyetja",
    "diag.of": "nga",
    "diag.context_badge": "Hap opsional — sa më shumë informacion, aq më precize analiza",
    "diag.context_title": "Tregona pak më shumë (opsionale)",
    "diag.context_desc": "Çdo detaj ndihmon ekipin tonë të të japë një analizë reale, jo gjenerike.",
    "diag.context_label": "Çfarë do të donit t'i thoshe ekipit tonë?",
    "diag.context_placeholder": "P.sh. sektori, qyteti, sa vjet ke që punon, çfarë ke provuar deri tani, ku ndihesh i bllokuar...",
    "diag.screenshots_label": "Screenshot nga Instagram, website, Google Maps (max 4)",
    "diag.screenshots_help": "AI i shikon dhe i përfshin në analizë.",
    "diag.add_image": "Shto imazh",
    "diag.remove_image": "Hiq imazhin",
    "diag.max_images": "Maksimumi 4 imazhe.",
    "diag.upload_failed": "Ngarkimi i imazhit dështoi",
    "diag.lead_badge": "Hapi i fundit",
    "diag.lead_title": "Ku të të kontaktojmë me analizën?",
    "diag.lead_desc": "Ekipi ynë do të të dërgojë analizën personale përmes Email ose WhatsApp. Pa pagesë, pa spam.",
    "diag.email_placeholder": "Email yt",
    "diag.whatsapp_placeholder": "WhatsApp (p.sh. +355 69 ...)",
    "diag.lead_hint": "Mjafton një nga të dyja. Të dyja = përgjigje më e shpejtë.",
    "diag.lead_submit": "Dërgo & Prit Analizën",
    "diag.lead_required": "Lër email ose WhatsApp për të marrë analizën.",
    "diag.submitting_named": "Po dërgojmë analizën për \"{name}\"…",
    "diag.submitting": "Po dërgojmë analizën…",
    "diag.submitting_hint": "Disa sekonda.",
    "diag.done_thanks_named": "Faleminderit, {name}!",
    "diag.done_thanks": "Faleminderit!",
    "diag.done_desc_email_wa": "Analiza jote po përgatitet personalisht nga ekipi ynë. Do të të kontaktojmë brenda 24 orëve në Email dhe WhatsApp.",
    "diag.done_desc_email": "Analiza jote po përgatitet personalisht nga ekipi ynë. Do të të kontaktojmë brenda 24 orëve në Email.",
    "diag.done_desc_wa": "Analiza jote po përgatitet personalisht nga ekipi ynë. Do të të kontaktojmë brenda 24 orëve në WhatsApp.",
    "diag.done_what_now": "Çfarë po ndodh tani:",
    "diag.done_step1": "Përgjigjet e tua janë regjistruar",
    "diag.done_step2": "AI dhe ekipi po analizojnë rastin tënd",
    "diag.done_step3": "Do të marrësh planin personal pa pagesë",
    "diag.done_wa_cta": "💬 Dua ta diskutoj tani në WhatsApp",
    "diag.done_back": "← Kthehu në fillim",
    "diag.wa_msg_done": "Përshëndetje! Sapo dërgova diagnozën{forBusiness}. Dua ta diskutoj sa më shpejt.",
    "diag.wa_for_business": " për \"{name}\"",

    /* Lead capture */
    "lead.success_title": "Të dhënat u dërguan",
    "lead.success_desc": "Ekipi ynë do të kontaktojë sa më shpejtë me një plan personal.",
    "lead.title": "Merr planin tënd personal falas",
    "lead.desc": "Lëre Email-in ose WhatsApp — do të kontaktojmë sa më shpejtë.",
    "lead.business_placeholder": "Emri i biznesit (opsionale)",
    "lead.email_placeholder": "Email yt",
    "lead.submit": "Dërgo & Merr Planin",
    "lead.invalid": "Të dhënat nuk janë të vlefshme. Kontrollo email ose WhatsApp.",
    "lead.wa_direct": "💬 Shkruaj direkt në WhatsApp",
    "lead.wa_msg_short": "Përshëndetje! Sapo plotësova diagnozën. Më rekomandohet: {service}. Dua të diskutoj më shumë.",
    "lead.bottleneck": "Diagnoza e biznesit",

    /* WhatsApp CTA */
    "wa.title": "Vazhdo në WhatsApp",
    "wa.desc": "Na shkruaj direkt për një analizë më të thellë — mesazhi është gati.",
    "wa.cta_open": "💬 Vazhdo në WhatsApp",
    "wa.fallback": "Nuk u hap? Kopjo mesazhin dhe dërgoje manualisht në WhatsApp.",
    "wa.copied": "U kopjua!",
    "wa.copy": "Kopjo mesazhin",
    "wa.msg_hello": "Përshëndetje Muslimi Digital.",
    "wa.msg_done": "Kam bërë diagnozën e biznesit tim.",
    "wa.msg_main_problem": "Problemi kryesor: {problem}",
    "wa.msg_recommended": "Shërbimi i rekomanduar: {service}",
    "wa.msg_business": "Biznesi: {name}",
    "wa.msg_book": "Dua të rezervoj një analizë më të thellë.",

    /* Exit intent */
    "exit.title": "Po heziton? Na thuaj shkurt — çfarë nuk të bindi?",
    "exit.desc": "10 sekonda. Asgjë nuk shitet këtu.",
    "exit.reason_not_sure": "Nuk jam i sigurt që kam nevojë",
    "exit.reason_no_time": "Nuk kam kohë tani",
    "exit.reason_more_info": "Dua të di më shumë para se të filloj",
    "exit.reason_other": "Tjetër...",
    "exit.details_placeholder": "Çfarë të mbajti pas?",
    "exit.email_placeholder": "Email (opsionale) — të kontaktojmë me përgjigje",
    "exit.submit": "Dërgo",
    "exit.thanks_title": "Faleminderit!",
    "exit.thanks_desc": "Reagimi yt na ndihmon të përmirësohemi.",

    /* Service page layout */
    "service.back": "Kthehu",
    "service.start_diag": "Nis Diagnozën",
    "service.problem": "⚠️ Problemi",
    "service.solution": "✅ Zgjidhja",
    "service.results": "📊 Rezultatet",
    "service.case_real": "Rast real",
    "service.cta_title": "Gati për të filluar?",
    "service.cta_desc": "Zbulo brenda 2 minutash se si mund të rritesh.",
    "service.default_cta": "Nis diagnozën falas",

    /* History */
    "hist.title": "Historiku i Analizave",
    "hist.new": "Analizë e re",
    "hist.empty_title": "Asnjë analizë ende",
    "hist.empty_desc": "Nis diagnozën e parë për të parë historikun këtu.",
    "hist.start": "Nis Diagnozën",
    "hist.compare": "Krahaso 2 analiza",
    "hist.no_name": "Pa emër",
    "hist.view": "Shiko",
    "hist.delete": "Fshi",
    "hist.main_service": "Shërbimi kryesor:",
    "hist.diagnosis": "Diagnoza:",

    /* Compare */
    "cmp.title": "Krahaso 2 Analiza",
    "cmp.pick_two": "2 analiza",
    "cmp.pick_one_more": "1 analizë tjetër",
    "cmp.pick_prefix": "Zgjidh ",
    "cmp.pick_suffix": " për krahasim:",
    "cmp.choose_others": "← Zgjidh analiza të tjera",
    "cmp.need_two": "Duhen të paktën 2 analiza për krahasim.",
    "cmp.start_diag": "Nis Diagnozën",
    "cmp.label_a": "Analiza A",
    "cmp.label_b": "Analiza B",

    /* Auth */
    "auth.signin_title": "Hyr në Admin",
    "auth.signup_title": "Krijo llogari",
    "auth.subtitle": "Vetëm administratorët kanë qasje në panelin.",
    "auth.password_label": "Fjalëkalimi",
    "auth.email_label": "Email",
    "auth.signin_btn": "Hyr",
    "auth.signup_btn": "Krijo Llogari",
    "auth.google_continue": "Vazhdo me Google",
    "auth.google_failed": "Google sign-in dështoi",
    "auth.toggle_signup": "Krijo një llogari me email",
    "auth.toggle_signin": "Ke llogari? Hyr",
    "auth.twofa": "2FA aktive:",
    "auth.twofa_desc": "Llogaria jote Google duhet të ketë 2-Step Verification.",

    /* Case studies */
    "cases.head_title": "Raste Studimi — Muslimi Digital",
    "cases.title": "Rezultate reale, jo premtime",
    "cases.subtitle": "Si kemi ndihmuar biznese si i yti të rriten brenda 90 ditësh.",
    "cases.empty": "Po përgatitemi të publikojmë rastet e para të studimit.",
    "cases.be_first": "Bëhu rasti i parë",
    "cases.problem": "Problemi",
    "cases.result": "Rezultati",
    "cases.want_results": "Dua rezultate si këto",

    /* AI chat */
    "ai.head_title": "Analizo Biznesin Tënd | AI Diagnozë e Performancës — Muslimi Digital",
    "ai.tagline": "AI Konsulent Strategjik",
    "ai.title_part1": "Ku po",
    "ai.title_highlight": "ngec",
    "ai.title_part2": "biznesi yt online?",
    "ai.subtitle": "Fol me konsulentin AI. Ai do kuptojë biznesin tënd dhe do gjejë ngërçin.",
    "ai.initial_message": "Përshëndetje! 👋 Unë jam konsulenti AI i Muslimi Digital.\n\nPër të të ndihmuar saktë, më duhet të kuptoj biznesin tënd. Më thuaj:\n\n1. Çfarë biznesi ke?\n2. Në cilin qytet ose zonë shërben?",
    "ai.thinking": "Duke menduar…",
    "ai.error_generic": "Diçka shkoi keq. Provo përsëri.",
    "ai.write_or_upload": "Shkruaj diçka ose ngarko një screenshot.",
    "ai.placeholder": "Përgjigju ose shkruaj pyetjen tënde…",
    "ai.upload_help": "Mund të ngarkosh screenshot-e (PNG/JPG/WEBP · max {max} · 10MB)",
    "ai.diagnosis_ready_short": "Analiza jote është gati! 🎯\n\nLër kontaktin tënd më poshtë dhe Muslimi Digital do ta dërgojë diagnozën e plotë sa më shpejtë.",
    "ai.lead_title": "Diagnoza jote është gati! 🎯",
    "ai.lead_desc": "Lër kontaktin tënd dhe Muslimi Digital do ta dërgojë planin e plotë sa më shpejtë.",
    "ai.lead_business": "Emri i biznesit",
    "ai.lead_email": "Email *",
    "ai.lead_whatsapp": "WhatsApp (opsionale)",
    "ai.lead_submit": "Dërgoma diagnozën",
    "ai.lead_email_or_wa": "Shkruaj email ose numrin e WhatsApp.",
    "ai.thanks_title": "Faleminderit! 🎯",
    "ai.thanks_desc": "Muslimi Digital do ta dërgojë diagnozën e plotë sa më shpejtë në kontaktin që ke lënë.",
    "ai.start_new": "Nis analizë të re",
    "ai.bottleneck": "Diagnoza e biznesit",
    "ai.recommended_label": "Analizë e thellë strategjike",
    "ai.upload_failed": "Nuk u ngarkua: {name}",
    "ai.format_unsupported": "{name}: format jo i mbështetur",
    "ai.too_big": "{name}: tepër e madhe (max 10MB)",
    "ai.max_files": "Maksimumi {max} foto",

    /* Result page */
    "result.head_title": "Rezultati i Diagnozës — Muslimi Digital",
    "result.head_desc": "Diagnoza personale e biznesit tënd.",
    "result.badge_unlocked": "Diagnoza personale",
    "result.badge_ready": "Diagnoza është gati",
    "result.title_unlocked_named": "Ja çfarë po ndodh me \"{name}\"",
    "result.title_unlocked": "Ja çfarë po ndodh me biznesin tënd",
    "result.title_locked": "Diagnoza jote është gati 🔒",
    "result.intro_part1": "Bazuar në përgjigjet e tua, kemi identifikuar",
    "result.intro_emphasis": "shërbimin kryesor",
    "result.intro_part2": "që të mungon dhe një analizë konkrete të mundësive që po humbet. Lër kontaktin më poshtë dhe merr raportin e plotë + planin personal — pa pagesë.",
    "result.solution_title": "Zgjidhja kryesore për ty",
    "result.locked_cta": "Lër kontaktin për t'ju dërguar\nrrezultatin dhe zgjidhjen!",
    "result.unlocked_badge": "Zhbllokuar",
    "result.plus_complement": "Plus këto e plotësojnë:",
    "result.case_similar": "Rast real i ngjashëm",
    "result.analyze_other": "Analizo një biznes tjetër",
    "result.restart": "Rifillo diagnozën",
    "result.history": "Historiku",
    "result.compare": "Krahaso rezultate",
    "result.back_home": "← Kthehu në fillim",
    "result.fallback_diagnosis": "Mungon prania online",
    "result.error_title": "Diçka shkoi keq",
    "result.error_default": "Nuk arritëm të ngarkojmë rezultatin.",
    "result.try_again": "Provo Përsëri",
    "result.notfound_title": "Sesioni nuk u gjet",
    "result.notfound_desc": "Mund të ketë skaduar ose linku është i pasaktë.",
    "result.start_new": "Nis një diagnozë të re",

    /* Auth — extras */
    "auth.head_title": "Hyr — Muslimi Digital",
    "auth.email_placeholder": "ti@biznesi.com",
    "auth.back_aria": "Kthehu mbrapa",
    "auth.home_aria": "Faqja kryesore",

    /* AI chat — extras */
    "ai.back_aria": "Kthehu mbrapa",
    "ai.home_aria": "Faqja kryesore",

    /* Compare — extras */
    "cmp.unnamed": "Pa emër",
    "cmp.main_service_label": "Shërbimi kryesor:",
    "cmp.diagnosis_label": "Diagnoza:",

    /* Home/SEO defaults */
    "home.head_title": "Muslimi Digital — Diagnoza Falas e Biznesit Tënd",
    "home.head_desc": "Zbulo brenda 2 minutash cilat shërbime dixhitale i mungojnë biznesit tënd. Diagnozë e personalizuar nga Muslimi Digital.",
    "home.og_title": "Muslimi Digital — Diagnoza Falas",
    "home.og_desc": "Nëse dikush kërkon shërbimin tënd sot, a përfundon tek ti apo tek konkurrenti?",

    /* 404 */
    "nf.title": "Faqja nuk u gjet",
    "nf.desc": "Faqja që po kërkon nuk ekziston ose është zhvendosur.",
    "nf.go_home": "Kthehu në fillim",

    /* Language switcher */
    "lang.switch": "Gjuha",
    "lang.en": "English",
    "lang.sq": "Shqip",
  },
} as const;

/* -------------------------------------------------------------------------- */
/*  Service & question translations                                            */
/* -------------------------------------------------------------------------- */

import type { ServiceKey, AnswerKey, AnswerValue } from "./diagnostic-types";

export const SERVICE_LABELS_I18N: Record<Locale, Record<ServiceKey, string>> = {
  en: {
    seo: "SEO — Google Optimization",
    web_3d: "Professional 3D Website",
    photo_video_360: "360° Photo & Video",
    social_media: "Social Media Management",
    google_maps: "Google Maps for Business",
    combined_package: "Premium Combined Package",
    automation: "Automation & AI",
    ads: "Digital Ads (Facebook/Google)",
    analytics_measurement: "Measurement & Analytics",
  },
  sq: {
    seo: "SEO — Optimizim për Google",
    web_3d: "Web 3D Profesional",
    photo_video_360: "Foto & Video 360°",
    social_media: "Menaxhim i Rrjeteve Sociale",
    google_maps: "Google Maps për Biznes",
    combined_package: "Paketë e Kombinuar Premium",
    automation: "Automatizim & AI",
    ads: "Reklama Dixhitale (Facebook/Google Ads)",
    analytics_measurement: "Matje & Analitikë",
  },
};

export const SERVICE_TAGLINES_I18N: Record<Locale, Record<ServiceKey, string>> = {
  en: {
    seo: "Your site shows up on Google when customers search.",
    web_3d: "The website that makes customers say: 'Yes, this is the professional I was looking for.'",
    photo_video_360: "Customers feel like they've stepped inside your business.",
    social_media: "Posts that bring in customers, not just likes.",
    google_maps: "Found on the map with reviews that pull people in.",
    combined_package: "A complete strategy that sets you apart from competitors.",
    automation: "Systems that work for you 24/7, even while you sleep.",
    ads: "Ads that bring customers with measurable ROI.",
    analytics_measurement: "Data-driven decisions, not guesswork.",
  },
  sq: {
    seo: "Faqja jote duket në Google kur klientët kërkojnë.",
    web_3d: "Faqja që i bën klientët të thonë 'Po, ky është profesionisti që kërkoj'.",
    photo_video_360: "Klientët ndihen sikur kanë hyrë brenda biznesit tënd.",
    social_media: "Postime që sjellin klientë, jo vetëm pëlqime.",
    google_maps: "Të gjejnë në hartë me vlerësime që tërheqin.",
    combined_package: "Strategji e plotë që të dallon nga konkurrentët.",
    automation: "Sisteme që punojnë për ty 24/7, edhe kur fle.",
    ads: "Reklama që sjellin klientë me ROI të matshëm.",
    analytics_measurement: "Vendime të bazuara në të dhëna, jo supozime.",
  },
};

/** Translated questions, subtitles, options, and weak feedback */
type QuestionTr = {
  question: string;
  subtitle?: string;
  weakFeedback: string;
  options: Partial<Record<AnswerValue, string>>;
};

export const QUESTION_TR: Record<Locale, Partial<Record<AnswerKey, QuestionTr>>> = {
  en: {
    online_leads: {
      question: "How many customers come to you online each month?",
      subtitle: "Think about customers who find you through the internet.",
      weakFeedback: "Your problem isn't a lack of customers… it's the lack of a system to capture them.",
      options: {
        "0": "0 — none",
        "1_5": "1–5 customers",
        "5_20": "5–20 customers",
        dont_know: "I don't know",
      },
    },
    contact_method: {
      question: "How do customers usually contact you?",
      subtitle: "The main channel customers use to reach you.",
      weakFeedback: "You're losing customers because there's no clear path to a sale.",
      options: {
        website_form: "Website form",
        whatsapp: "WhatsApp",
        phone: "Phone",
        dm: "DMs on social media",
        not_often: "They don't contact me often",
      },
    },
    automation: {
      question: "Do you have any system that replies to customers automatically?",
      subtitle: "e.g. chatbot, auto-reply, email sequence.",
      weakFeedback: "You're losing time and customers every day without realizing it.",
      options: { yes: "Yes", no: "No" },
    },
    measurement: {
      question: "Do you know exactly how many people visit and how many buy?",
      subtitle: "Tracking traffic, conversions, ROI.",
      weakFeedback: "Without measurement, you're making decisions blind.",
      options: { yes: "Yes, I track the numbers", partial: "Partially", no: "No" },
    },
    ads: {
      question: "Do you run ads (Facebook / Google Ads)?",
      subtitle: "Paid ads to reach new customers.",
      weakFeedback: "You're leaving the market to those who pay for attention.",
      options: {
        works_well: "Yes, they work well",
        not_much: "Yes, but they don't work well",
        no: "No",
      },
    },
    brand_positioning: {
      question: "When someone hears about your business, what do they immediately think?",
      subtitle: "Your brand identity in the customer's mind.",
      weakFeedback: "Without an identity, you're replaceable.",
      options: {
        quality: "Quality",
        cheap_price: "Cheap price",
        dont_know: "I don't know",
        no_answer: "I have no answer",
      },
    },
    working_hours: {
      question: "How many hours a day do you work on your business?",
      subtitle: "And is it growing the way it should for that time?",
      weakFeedback: "The problem isn't how much you work… it's how you work.",
      options: { "2_4h": "2–4 hours", "5_8h": "5–8 hours", "8_plus": "8+ hours" },
    },
    virtual_experience: {
      question: "Can a customer 'enter' your business virtually before visiting?",
      subtitle: "Virtual tour, 360° photos, online experience.",
      weakFeedback: "Competitors who provide an experience win faster.",
      options: { yes: "Yes", no: "No" },
    },
    funnel: {
      question: "What happens after someone discovers you for the first time?",
      subtitle: "The path from attention to purchase.",
      weakFeedback: "You have attention… but no system to turn it into customers.",
      options: {
        something: "Nothing",
        writes_sometimes: "They message me sometimes",
        clear_path: "There's a clear path (website, CTA, etc.)",
      },
    },
    ai_usage: {
      question: "Do you use any AI for your business?",
      subtitle: "ChatGPT, automation, advanced digital tools.",
      weakFeedback: "Businesses using AI are moving faster than you.",
      options: { yes: "Yes", no: "No", dont_know: "I don't know how" },
    },
  },
  sq: {
    online_leads: {
      question: "Sa klientë të vijnë çdo muaj nga online?",
      subtitle: "Mendo për klientë që të gjejnë përmes internetit.",
      weakFeedback: "Problemi yt nuk është mungesa e klientëve… është mungesa e sistemit për t'i kapur.",
      options: {
        "0": "0 — asnjë",
        "1_5": "1–5 klientë",
        "5_20": "5–20 klientë",
        dont_know: "Nuk e di",
      },
    },
    contact_method: {
      question: "Si të kontaktojnë zakonisht klientët?",
      subtitle: "Rruga kryesore që klientët përdorin për të arritur tek ti.",
      weakFeedback: "Po humbet klientë sepse nuk ke një rrugë të qartë për shitje.",
      options: {
        website_form: "Formë në website",
        whatsapp: "WhatsApp",
        phone: "Telefon",
        dm: "DM në rrjete sociale",
        not_often: "Nuk më kontaktojnë shpesh",
      },
    },
    automation: {
      question: "A ke ndonjë sistem që u përgjigjet klientëve automatikisht?",
      subtitle: "P.sh. chatbot, auto-reply, email sekuencë.",
      weakFeedback: "Po humbet kohë dhe klientë çdo ditë pa e kuptuar.",
      options: { yes: "Po", no: "Jo" },
    },
    measurement: {
      question: "A e di saktë sa njerëz hyjnë dhe sa blejnë?",
      subtitle: "Matja e trafikut, konvertimeve, ROI-t.",
      weakFeedback: "Pa matje, po merr vendime me mend.",
      options: { yes: "Po, i ndjek numrat", partial: "Pjesërisht", no: "Jo" },
    },
    ads: {
      question: "A përdor reklama (Facebook / Google Ads)?",
      subtitle: "Reklama të paguara për të arritur klientë të rinj.",
      weakFeedback: "Po lë tregun në dorë të atyre që paguajnë për vëmendje.",
      options: {
        works_well: "Po, funksionojnë mirë",
        not_much: "Po, por nuk funksionojnë shumë",
        no: "Jo",
      },
    },
    brand_positioning: {
      question: "Kur dikush dëgjon për biznesin tënd, çfarë mendon menjëherë?",
      subtitle: "Identiteti i brendit tënd në mendjen e klientëve.",
      weakFeedback: "Pa identitet, je i zëvendësueshëm.",
      options: {
        quality: "Cilësi",
        cheap_price: "Çmim i lirë",
        dont_know: "Nuk e di",
        no_answer: "Nuk kam përgjigje",
      },
    },
    working_hours: {
      question: "Sa orë në ditë punon për biznesin?",
      subtitle: "Dhe a po rritet siç duhet për këtë kohë?",
      weakFeedback: "Problemi nuk është sa punon… por si punon.",
      options: { "2_4h": "2–4 orë", "5_8h": "5–8 orë", "8_plus": "8+ orë" },
    },
    virtual_experience: {
      question: "A mundet klienti të 'hyjë' virtualisht në biznesin tënd para se të vijë?",
      subtitle: "Tur virtual, foto 360°, eksperiencë online.",
      weakFeedback: "Konkurrentët që japin eksperiencë fitojnë më shpejt.",
      options: { yes: "Po", no: "Jo" },
    },
    funnel: {
      question: "Çfarë ndodh pasi dikush të sheh për herë të parë?",
      subtitle: "Rruga nga vëmendja tek blerja.",
      weakFeedback: "Ti ke vëmendje… por nuk ke sistem për ta kthyer në klient.",
      options: {
        something: "Asgjë",
        writes_sometimes: "Më shkruan ndonjëherë",
        clear_path: "Ka një rrugë të qartë (website, CTA, etj.)",
      },
    },
    ai_usage: {
      question: "A përdor ndonjë AI për biznesin tënd?",
      subtitle: "ChatGPT, automatizim, mjete dixhitale të avancuara.",
      weakFeedback: "Bizneset që përdorin AI po lëvizin më shpejt se ti.",
      options: { yes: "Po", no: "Jo", dont_know: "Nuk e di si" },
    },
  },
};

/* -------------------------------------------------------------------------- */
/*  Service page content                                                       */
/* -------------------------------------------------------------------------- */

export interface ServicePageContent {
  title: string;
  subtitle: string;
  problem: string;
  problemPoints: string[];
  solution: string;
  solutionPoints: string[];
  results: string[];
  ctaText?: string;
}

export const SERVICE_PAGE_CONTENT: Record<string, Record<Locale, ServicePageContent>> = {
  seo: {
    en: {
      title: "SEO — Google Optimization",
      subtitle: "Your site shows up on Google when customers search for your service.",
      problem: "Customers are searching for you — but they're finding the competitor",
      problemPoints: [
        "You don't appear on the first page of Google when someone searches for your service",
        "Competitors are investing in SEO and taking your customers",
        "Without SEO, your site is as good as invisible — even if it looks great",
        "Paid ads cost a lot and stop the moment you stop paying",
      ],
      solution: "An SEO strategy that brings customers every day",
      solutionPoints: [
        "Full keyword analysis of what your customers actually search for",
        "Technical site optimization (speed, structure, meta tags)",
        "Content creation that ranks on Google",
        "Link building and domain authority",
        "Google Business Profile optimization",
        "Monthly reports with concrete results",
      ],
      results: [
        "#1 in local Google",
        "+25 new customers/month",
        "90 days average time",
        "5-10x ROI in year one",
        "Continuous organic traffic",
        "No monthly ad spend",
      ],
    },
    sq: {
      title: "SEO — Optimizim për Google",
      subtitle: "Faqja jote duket në Google kur klientët kërkojnë shërbimin tënd.",
      problem: "Klientët po të kërkojnë — por po gjejnë konkurrentin",
      problemPoints: [
        "Nuk del në faqen e parë të Google kur dikush kërkon shërbimin tënd",
        "Konkurrentët po investojnë në SEO dhe po marrin klientët tuaj",
        "Pa SEO, faqja jote është sikur nuk ekziston — edhe nëse është e bukur",
        "Reklama me pagesë kushtojnë shumë dhe ndalojnë kur ndalon pagesa",
      ],
      solution: "Strategji SEO që sjell klientë çdo ditë",
      solutionPoints: [
        "Analizë e plotë e fjalëve kyçe që përdorin klientët tuaj",
        "Optimizim teknik i faqes (shpejtësi, strukturë, meta tags)",
        "Krijim i përmbajtjes që rankohet në Google",
        "Link building dhe autoritet domeni",
        "Google Business Profile optimizim",
        "Raporte mujore me rezultate konkrete",
      ],
      results: [
        "#1 në Google lokal",
        "+25 klientë të rinj/muaj",
        "90 ditë kohë mesatare",
        "ROI 5-10x në vitin e parë",
        "Trafik organik i vazhdueshëm",
        "Pa kosto reklamash mujore",
      ],
    },
  },
  web_3d: {
    en: {
      title: "Professional 3D Website",
      subtitle: "The website that makes customers say: 'Yes, this is the professional I was looking for.'",
      problem: "Your business has no website, or has one that looks like an old business card",
      problemPoints: [
        "New customers check your site before buying — without one, you lose trust",
        "An old or slow site makes customers think the business isn't professional",
        "Competitors with modern sites are taking the customers that should have been yours",
        "Without a site, you have nowhere to send your ads or social posts",
      ],
      solution: "A modern 3D site designed for conversion",
      solutionPoints: [
        "Modern design with 3D animations that leave a professional impression",
        "Optimized for speed — loads in under 2 seconds",
        "Mobile-first: 70% of visitors come from phones",
        "Clear calls-to-action that drive contact or purchase",
        "Built-in basic SEO so Google finds you",
      ],
      results: [
        "+40% increase in online bookings",
        "3x more contacts from the site",
        "Design that stands out from competitors",
        "Load <2 seconds",
        "WhatsApp & Maps integration",
        "5-8% average conversion",
      ],
    },
    sq: {
      title: "Web 3D Profesional",
      subtitle: "Faqja që i bën klientët të thonë: 'Po, ky është profesionisti që kërkoj'.",
      problem: "Biznesi yt nuk ka faqe, ose ka një faqe që duket si kartëvizitë e vjetër",
      problemPoints: [
        "Klientët e rinj kontrollojnë faqen para se të blejnë — nëse nuk ke, humbet besimin",
        "Faqja e vjetër ose e ngadaltë i bën klientët të mendojnë se biznesi nuk është profesional",
        "Konkurrentët me faqe moderne po marrin klientët që duhej të ishin tuajat",
        "Pa faqe, nuk ke ku ti drejtosh reklamat ose postimet në rrjete sociale",
      ],
      solution: "Faqe moderne 3D e dizajnuar për konvertim",
      solutionPoints: [
        "Dizajn modern me animacione 3D që lë përshtypje profesionale",
        "Optimizuar për shpejtësi — ngarkohet brenda 2 sekondash",
        "Mobile-first: 70% e vizitorëve vijnë nga telefoni",
        "Call-to-action të qarta që çojnë në kontakt ose blerje",
        "SEO bazë i integruar që Google ta gjejë",
      ],
      results: [
        "+40% rritje e rezervimeve online",
        "3x më shumë kontakte nga faqja",
        "Dizajn që dallon nga konkurrentët",
        "Ngarkesë <2 sekonda",
        "Integrim me WhatsApp & Maps",
        "Konvertim mesatar 5-8%",
      ],
    },
  },
  google_maps: {
    en: {
      title: "Google Maps for Business",
      subtitle: "Found on the map with reviews that pull people in.",
      problem: "Customers search for 'near me' — but they don't find you",
      problemPoints: [
        "Your Google Maps profile doesn't exist or is incomplete",
        "No reviews or few reviews — customers pick the competitor",
        "Information (hours, phone, address) is inaccurate",
        "You don't appear in the Google Maps '3-pack' when someone searches locally",
      ],
      solution: "An optimized and managed Google Maps profile",
      solutionPoints: [
        "Creation and verification of the Google Business profile",
        "Full optimization: category, description, photos, hours",
        "Strategy for collecting positive reviews",
        "Professional responses to every review",
        "Weekly posts on Google Business Profile",
        "Monthly metrics report (views, clicks, calls)",
      ],
      results: [
        "Top 3 in local Google Maps",
        "+50 positive reviews/3 months",
        "3x more phone calls",
        "+70% increase in directions",
        "Increased trust",
        "Customers without paid ads",
      ],
    },
    sq: {
      title: "Google Maps për Biznes",
      subtitle: "Të gjejnë në hartë me vlerësime që tërheqin.",
      problem: "Klientët kërkojnë 'afër meje' — por nuk të gjejnë",
      problemPoints: [
        "Profili Google Maps nuk ekziston ose është i paplotësuar",
        "Pa vlerësime ose me vlerësime të pakta — klientët zgjedhin konkurrentin",
        "Informacioni (orari, telefoni, adresa) nuk është i saktë",
        "Nuk del në '3-pack' e Google Maps kur dikush kërkon shërbimin tënd lokalisht",
      ],
      solution: "Profil Google Maps i optimizuar dhe i menaxhuar",
      solutionPoints: [
        "Krijim dhe verifikim i profilit Google Business",
        "Optimizim i plotë: kategori, përshkrim, foto, orare",
        "Strategji për mbledhjen e vlerësimeve pozitive",
        "Përgjigje profesionale ndaj çdo vlerësimi",
        "Postime javore në Google Business Profile",
        "Raport mujor me metrika (shikime, klikimet, thirrjet)",
      ],
      results: [
        "Top 3 në Google Maps lokal",
        "+50 vlerësime pozitive/3 muaj",
        "3x më shumë thirrje telefonike",
        "+70% rritje e drejtimeve",
        "Besueshmëri e rritur",
        "Klientë pa reklama me pagesë",
      ],
    },
  },
  photo_video_360: {
    en: {
      title: "360° Photo & Video",
      subtitle: "Customers feel like they've stepped inside your business.",
      problem: "Regular photos don't convince — customers want to 'see' your business before they come",
      problemPoints: [
        "Static photos don't show the full environment of the business",
        "Customers don't know what it looks like inside — this creates uncertainty",
        "Competitors with virtual tours are pulling in more visitors",
        "Google favors businesses with 360° photos in Maps and Search",
      ],
      solution: "360° virtual tours that turn online visitors into in-person customers",
      solutionPoints: [
        "Professional 360° captures with specialized cameras",
        "Interactive virtual tours embeddable on your site",
        "Direct integration with Google Maps and Google Street View",
        "360° videos for social media that boost engagement",
        "Professional HDR photos for site and marketing materials",
        "Premium-level editing and post-processing",
      ],
      results: [
        "+35% increase in foot traffic",
        "2x time spent on site",
        "Featured on Google Maps with 360°",
        "Drastically increased trust",
        "Clear differentiation from competitors",
        "ROI within 30 days",
      ],
    },
    sq: {
      title: "Foto & Video 360°",
      subtitle: "Klientët ndihen sikur kanë hyrë brenda biznesit tënd.",
      problem: "Fotot e zakonshme nuk bindin — klientët duan ta 'shohin' biznesin para se të vijnë",
      problemPoints: [
        "Fotot statike nuk tregojnë mjedisin e plotë të biznesit",
        "Klientët nuk e dinë si duket brenda — kjo krijon pasiguri",
        "Konkurrentët me turne virtuale po tërheqin më shumë vizitorë",
        "Google favorizon bizneset me foto 360° në Maps dhe Search",
      ],
      solution: "Turne virtuale 360° që konverton vizitorë online në klientë fizikë",
      solutionPoints: [
        "Xhirime profesionale 360° me kamera të specializuara",
        "Turne virtuale interaktive e integrueshme në faqen tënde",
        "Integrim direkt në Google Maps dhe Google Street View",
        "Video 360° për rrjete sociale që rrisin engagement-in",
        "Foto HDR profesionale për faqe dhe materiale marketingu",
        "Editim dhe post-procesim i nivelit premium",
      ],
      results: [
        "+35% rritje e vizitave fizike",
        "2x kohë e kaluar në faqe",
        "Google Maps featured me 360°",
        "Besueshmëri e rritur drastikisht",
        "Dallim i qartë nga konkurrentët",
        "ROI mbrenda 30 ditësh",
      ],
    },
  },
  social_media: {
    en: {
      title: "Social Media Management",
      subtitle: "Posts that bring in customers, not just likes.",
      problem: "You're spending hours on Instagram with no financial return",
      problemPoints: [
        "You post every day but no new customers arrive from posts",
        "You get likes and comments, but zero 'I want to buy' messages",
        "You spend 2-3 hours a day creating content with no strategy",
        "You don't know what's working and what isn't",
      ],
      solution: "A social strategy that converts followers into customers",
      solutionPoints: [
        "Content calendar planned 30 days in advance",
        "Every post has a clear CTA — you don't post just for 'likes'",
        "Reels & Stories strategy that increases reach",
        "Targeted ads for your local audience",
        "Weekly reports: how many customers each post brought in",
        "A/B testing of content for optimization",
      ],
      results: [
        "+15 new customers/week",
        "200% increase in bookings",
        "3x social media ROI",
        "50% less time spent",
        "Organic follower growth",
        "Direct conversion",
      ],
    },
    sq: {
      title: "Menaxhim i Rrjeteve Sociale",
      subtitle: "Postime që sjellin klientë, jo vetëm pëlqime.",
      problem: "Po harxhon orë në Instagram pa kthim financiar",
      problemPoints: [
        "Poston çdo ditë por asnjë klient i ri nuk vjen nga postimet",
        "Ke like dhe komente, por zero mesazhe 'dua ta blej'",
        "Harxhon 2-3 orë në ditë duke krijuar content pa strategji",
        "Nuk e di çfarë po funksionon dhe çfarë jo",
      ],
      solution: "Strategji sociale që konverton ndjekës në klientë",
      solutionPoints: [
        "Kalendar i përmbajtjes i planifikuar për 30 ditë",
        "Çdo postim ka CTA të qartë — nuk poston thjesht për 'likes'",
        "Strategji Reels & Stories që rrisin shikueshmërinë",
        "Ads targetuara për audiencën tënde lokale",
        "Raporte javore: sa klientë solli çdo postim",
        "A/B testing i përmbajtjes për optimizim",
      ],
      results: [
        "+15 klientë të rinj/javë",
        "200% rritje e rezervimeve",
        "3x ROI social media",
        "50% më pak kohë e harxhuar",
        "Rritje organike e ndjekësve",
        "Konvertim i drejtpërdrejtë",
      ],
    },
  },
};
