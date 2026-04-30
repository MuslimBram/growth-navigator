// Rule-based fallback engine for dynamic question system.

import type { ServiceKey } from "./diagnostic-types";
import type { AnswersInput } from "./diagnostic-schemas";

interface ScoredService {
  service: ServiceKey;
  score: number;
}

export function scoreServices(answers: AnswersInput): ScoredService[] {
  const scores: ScoredService[] = [];
  const a = answers as Record<string, string>;

  // Online leads
  if (a.online_leads === "0") scores.push({ service: "combined_package", score: 5 });
  else if (a.online_leads === "1_5") scores.push({ service: "combined_package", score: 4 });
  else if (a.online_leads === "dont_know") scores.push({ service: "analytics_measurement", score: 4 });

  // Contact method
  if (a.contact_method === "not_often") scores.push({ service: "web_3d", score: 5 });
  else if (a.contact_method === "dm" || a.contact_method === "whatsapp")
    scores.push({ service: "web_3d", score: 4 });

  // Automation
  if (a.automation === "no") scores.push({ service: "automation", score: 5 });

  // Measurement
  if (a.measurement === "no") scores.push({ service: "analytics_measurement", score: 5 });
  else if (a.measurement === "partial") scores.push({ service: "analytics_measurement", score: 3 });

  // Ads
  if (a.ads === "no") scores.push({ service: "ads", score: 4 });
  else if (a.ads === "not_much") scores.push({ service: "ads", score: 3 });

  // Brand positioning
  if (a.brand_positioning === "no_answer" || a.brand_positioning === "dont_know")
    scores.push({ service: "combined_package", score: 4 });
  else if (a.brand_positioning === "cheap_price")
    scores.push({ service: "combined_package", score: 3 });

  // Working hours (overworked = needs automation)
  if (a.working_hours === "8_plus") scores.push({ service: "automation", score: 3 });

  // Virtual experience / 360
  if (a.virtual_experience === "no") scores.push({ service: "photo_video_360", score: 4 });

  // Funnel
  if (a.funnel === "something") scores.push({ service: "combined_package", score: 5 });
  else if (a.funnel === "writes_sometimes") scores.push({ service: "web_3d", score: 3 });

  // AI usage
  if (a.ai_usage === "no" || a.ai_usage === "dont_know")
    scores.push({ service: "automation", score: 3 });

  // Merge duplicates by summing scores
  const merged = new Map<ServiceKey, number>();
  for (const s of scores) {
    merged.set(s.service, (merged.get(s.service) || 0) + s.score);
  }

  return Array.from(merged.entries())
    .map(([service, score]) => ({ service, score }))
    .sort((a, b) => b.score - a.score);
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
  web_3d: "Faqja jote nuk po e mbyll shitjen. Klientët vijnë, shohin, dhe largohen sepse perceptimi i parë nuk i bind.",
  photo_video_360: "Klientët nuk po e shohin biznesin tënd nga brenda — dhe pa këtë eksperiencë, nuk ndihen të sigurt të vijnë.",
  social_media: "Po investon kohë në postime që sjellin pëlqime, jo klientë. Strategjia e konvertimit mungon.",
  google_maps: "Në kërkimet lokale nuk të gjejnë. Çdo klient që kërkon në hartë po përfundon te dikush tjetër.",
  combined_package: "Nuk ke sistem dixhital të plotë. Vëmendja vjen, por nuk kthehet në klient sepse mungon rruga e qartë.",
  automation: "Po humbet kohë dhe klientë çdo ditë. Pa automatizim, je ti vetë kundër orës — dhe ora fiton gjithmonë.",
  ads: "Tregu po shkon tek ata që paguajnë për vëmendje. Pa reklama, je i padukshëm në konkurrencë.",
  analytics_measurement: "Po merr vendime pa të dhëna. Kjo do thotë: po luan me fat, jo me strategji.",
};

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
      diagnosis: "Biznesi yt qëndron mirë në bazë. Por gjithmonë ka hapësirë për t'u dalluar më shumë nga konkurrentët.",
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
