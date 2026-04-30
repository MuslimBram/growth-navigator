// Shared types for the AI Business Analysis feature.

export type ServiceKey =
  | "seo"
  | "web_3d"
  | "photo_video_360"
  | "social_media"
  | "google_maps"
  | "combined_package";

export interface DetectedMetrics {
  views?: string;
  followers?: string;
  engagement?: string;
  link_clicks?: string;
  website_visits?: string;
  top_sources?: string[];
  top_locations?: string[];
  audience_notes?: string;
}

export interface BusinessAnalysisResult {
  detected_metrics: DetectedMetrics;
  main_bottleneck: string;
  secondary_bottlenecks: string[];
  risk_level: "low" | "medium" | "high";
  diagnosis: string;
  recommended_primary_service: ServiceKey;
  recommended_secondary_services: ServiceKey[];
  emotional_message: string;
  cta_summary: string;
  unreadable?: boolean; // true when AI couldn't read screenshots clearly
}

export const SERVICE_LABEL: Record<ServiceKey, string> = {
  seo: "SEO — Optimizim Google",
  web_3d: "Faqe Interneti 3D / Premium",
  photo_video_360: "Foto & Video 360°",
  social_media: "Menaxhim Rrjetesh Sociale",
  google_maps: "Optimizim Google Maps",
  combined_package: "Paketë e Kombinuar Premium",
};

export const SERVICE_DESCRIPTION: Record<ServiceKey, string> = {
  seo: "Të shfaqesh kur klientët kërkojnë në Google.",
  web_3d: "Faqe që krijon besim dhe konverton vizitorin në klient.",
  photo_video_360: "Përmbajtje vizuale që ndalon scroll-in.",
  social_media: "Strategji që e kthen ndjekësin në klient.",
  google_maps: "Të dukshmëria lokale e biznesit tënd në hartë.",
  combined_package: "Strategji 360° kur problemi është në disa drejtime.",
};
