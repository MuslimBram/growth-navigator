
-- Enum for addon categories
CREATE TYPE public.addon_category AS ENUM (
  'optimization',
  'strategy',
  'analytics',
  'planning',
  'ads_management'
);

-- Addon services catalog
CREATE TABLE public.addon_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category public.addon_category NOT NULL,
  description TEXT,
  included_features JSONB NOT NULL DEFAULT '[]'::jsonb,
  supported_platforms JSONB NOT NULL DEFAULT '[]'::jsonb,
  price_1_month NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_3_months NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_6_months NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_1_year NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.addon_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage addons" ON public.addon_services
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_addon_services_updated_at
  BEFORE UPDATE ON public.addon_services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_addons_category_active ON public.addon_services(category, active);

-- Extend admin_recommendations
ALTER TABLE public.admin_recommendations
  ADD COLUMN recommended_addons JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN addons_total NUMERIC(10,2) NOT NULL DEFAULT 0;

-- Seed 5 add-on services
INSERT INTO public.addon_services
  (name, category, description, included_features, supported_platforms,
   price_1_month, price_3_months, price_6_months, price_1_year, display_order)
VALUES
  (
    'Optimizim për Biznesin',
    'optimization',
    'Optimizim i plotë i pranisë online: fjalë kyçe, hashtag-e, targetim audience dhe SEO social.',
    '["Fjalë kyçe", "Hashtag-e", "Targetim audience", "SEO social për çdo platformë"]'::jsonb,
    '["Facebook", "Instagram", "Twitter/X", "TikTok", "LinkedIn", "YouTube", "Website"]'::jsonb,
    30, 80, 150, 280, 1
  ),
  (
    'Strategji Suksesi për Biznesin',
    'strategy',
    'Strategji rritjeje me objektiva të matshme, përmbajtje sipas platformës, rritje ndjekësish, angazhimi dhe shitjesh.',
    '["Strategji rritjeje", "Objektiva të matshme", "Përmbajtje sipas platformës", "Rritje ndjekësish", "Rritje angazhimi", "Rritje shitjesh"]'::jsonb,
    '["Facebook", "Instagram", "TikTok", "LinkedIn", "YouTube"]'::jsonb,
    40, 110, 210, 410, 2
  ),
  (
    'Analizë për Biznesin',
    'analytics',
    'Analizë e thellë e performancës, postimeve, audiencës dhe reklamave me raportim transparent.',
    '["Analizë performance", "Analizë postimesh", "Analizë audience", "Analizë reklamash", "Identifikim tregjesh të reja", "Raportim periodik"]'::jsonb,
    '["Facebook", "Instagram", "TikTok", "LinkedIn", "YouTube", "Website"]'::jsonb,
    70, 180, 330, 600, 3
  ),
  (
    'Planifikim Suksesi për Biznesin',
    'planning',
    'Kalendar postimesh, organizim përmbajtjeje dhe planifikim fushatash mujore.',
    '["Kalendar postimesh", "Organizim përmbajtjeje", "Objektiva mujore", "Planifikim fushatash", "Analizë periodike"]'::jsonb,
    '["Facebook", "Instagram", "TikTok", "LinkedIn", "YouTube"]'::jsonb,
    20, 55, 100, 190, 4
  ),
  (
    'Menaxhim i Reklamave dhe Buxhetit',
    'ads_management',
    'Menaxhim i plotë i reklamave me pagesë: planifikim buxheti, optimizim ROI dhe raportim.',
    '["Menaxhim reklamash", "Planifikim buxheti", "Optimizim ROI", "Analizë fushatash", "Monitorim performance", "Raportim transparent"]'::jsonb,
    '["Facebook", "Instagram", "TikTok", "LinkedIn", "YouTube", "Google Ads"]'::jsonb,
    70, 200, 380, 700, 5
  );
