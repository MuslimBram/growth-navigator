// Rule-based fallback engine. Used when AI is unavailable.
// Pure function — no I/O. Importable on both client and server.

import type { ServiceKey } from "./diagnostic-types";
import type { AnswersInput } from "./diagnostic-schemas";

interface ScoredService {
  service: ServiceKey;
  score: number;
}

/**
 * Returns a list of weak services sorted by priority (highest first).
 * The first item is the primary recommendation.
 */
export function scoreServices(answers: AnswersInput): ScoredService[] {
  const scores: ScoredService[] = [];

  // SEO
  if (answers.seo === "no") scores.push({ service: "seo", score: 5 });
  else if (answers.seo === "partial") scores.push({ service: "seo", score: 3 });

  // Website / Web 3D
  if (answers.website === "no") scores.push({ service: "web_3d", score: 5 });
  else if (answers.website === "basic") scores.push({ service: "web_3d", score: 4 });

  // 360 Visual
  if (answers.visual360 === "no") scores.push({ service: "photo_video_360", score: 4 });
  else if (answers.visual360 === "partial")
    scores.push({ service: "photo_video_360", score: 2 });

  // Social Media
  if (answers.social_conversion === "likes_only")
    scores.push({ service: "social_media", score: 4 });
  else if (answers.social_conversion === "no")
    scores.push({ service: "social_media", score: 4 });

  // Google Maps
  if (answers.google_maps === "no")
    scores.push({ service: "google_maps", score: 4 });
  else if (answers.google_maps === "not_optimized")
    scores.push({ service: "google_maps", score: 3 });

  // Differentiation
  if (answers.differentiation === "nothing")
    scores.push({ service: "combined_package", score: 3 });
  else if (answers.differentiation === "partial")
    scores.push({ service: "combined_package", score: 2 });

  // Sort by score desc, stable order respects insertion = our priority list
  return scores.sort((a, b) => b.score - a.score);
}

export interface DiagnosisResult {
  diagnosis: string;
  primary_service: ServiceKey;
  secondary_services: ServiceKey[];
  estimated_lost_clients: number;
  estimated_lost_eur: number;
}

const FALLBACK_DIAGNOSES: Record<ServiceKey, string> = {
  seo: "Biznesi yt po humbet klientë sepse nuk po shfaqesh në Google kur ata kërkojnë. Konkurrentët po marrin këto thirrje, jo ti.",
  web_3d:
    "Faqja jote nuk po e mbyll shitjen. Klientët vijnë, shohin, dhe largohen sepse perceptimi i parë nuk i bind.",
  photo_video_360:
    "Klientët nuk po e shohin biznesin tënd nga brenda — dhe pa këtë eksperiencë, nuk ndihen të sigurt të vijnë.",
  social_media:
    "Po investon kohë në postime që sjellin pëlqime, jo klientë. Strategjia e konvertimit mungon.",
  google_maps:
    "Në kërkimet lokale nuk të gjejnë. Çdo klient që kërkon në hartë po përfundon te dikush tjetër.",
  combined_package:
    "Nuk po dallon nga konkurrentët. Pa pozicionim të qartë, çmimi mbetet i vetmi argument — dhe gjithmonë do ketë dikush më lirë.",
};

/**
 * Heuristic loss estimate — kept conservative on purpose.
 * Average client value: ~80 EUR. Each weak service costs ~3-7 clients/month.
 */
function estimateLoss(weakCount: number): { clients: number; eur: number } {
  const baseClients = Math.max(0, weakCount * 5 + Math.round(Math.random() * 4));
  const clients = Math.min(baseClients, 60);
  const eur = clients * 80;
  return { clients, eur };
}

export function fallbackDiagnose(answers: AnswersInput): DiagnosisResult {
  const ranked = scoreServices(answers);

  if (ranked.length === 0) {
    return {
      diagnosis:
        "Biznesi yt qëndron mirë në bazë. Por gjithmonë ka hapësirë për t'u dalluar më shumë nga konkurrentët.",
      primary_service: "combined_package",
      secondary_services: [],
      estimated_lost_clients: 3,
      estimated_lost_eur: 240,
    };
  }

  const primary = ranked[0].service;
  const secondary = ranked.slice(1, 3).map((s) => s.service);
  const loss = estimateLoss(ranked.length);

  return {
    diagnosis: FALLBACK_DIAGNOSES[primary],
    primary_service: primary,
    secondary_services: secondary,
    estimated_lost_clients: loss.clients,
    estimated_lost_eur: loss.eur,
  };
}
