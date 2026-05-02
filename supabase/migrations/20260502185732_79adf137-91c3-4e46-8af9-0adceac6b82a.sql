
-- Enums
CREATE TYPE public.package_category AS ENUM ('instagram', 'website');
CREATE TYPE public.package_level AS ENUM ('basic', 'advanced', 'premium', 'full_basic', 'full_advanced', 'full_premium');
CREATE TYPE public.package_duration AS ENUM ('1_month', '3_months', '6_months', '1_year', '2_years', '5_years', 'custom');
CREATE TYPE public.package_status AS ENUM ('active', 'inactive');
CREATE TYPE public.recommendation_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.recommendation_status AS ENUM ('new', 'reviewed', 'contacted', 'converted', 'rejected');

-- Service packages catalog
CREATE TABLE public.service_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category public.package_category NOT NULL,
  level public.package_level NOT NULL,
  duration public.package_duration NOT NULL,
  normal_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  offer_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  description TEXT,
  includes JSONB NOT NULL DEFAULT '[]'::jsonb,
  status public.package_status NOT NULL DEFAULT 'active',
  admin_notes TEXT,
  is_quote_only BOOLEAN NOT NULL DEFAULT false,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage packages" ON public.service_packages
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_service_packages_updated_at
  BEFORE UPDATE ON public.service_packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_packages_category_level ON public.service_packages(category, level, status);

-- Admin recommendations
CREATE TABLE public.admin_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.diagnostic_sessions(id) ON DELETE SET NULL,
  analysis_id UUID REFERENCES public.business_report_analyses(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.diagnostic_leads(id) ON DELETE SET NULL,
  business_name TEXT,
  business_type TEXT,
  city TEXT,
  digital_score INT,
  key_problems JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommended_package_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  reasoning TEXT,
  client_proposal_text TEXT,
  normal_price_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  offer_price_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  savings_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  priority public.recommendation_priority NOT NULL DEFAULT 'medium',
  status public.recommendation_status NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  ai_source TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage recommendations" ON public.admin_recommendations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_admin_recommendations_updated_at
  BEFORE UPDATE ON public.admin_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_reco_status_created ON public.admin_recommendations(status, created_at DESC);
CREATE INDEX idx_reco_priority ON public.admin_recommendations(priority, created_at DESC);
