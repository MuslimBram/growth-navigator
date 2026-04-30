-- =========================================
-- 1) ROLES (admin auth)
-- =========================================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- 2) ANALYTICS EVENTS (funnel tracking)
-- =========================================
CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id text,
  session_id uuid REFERENCES public.diagnostic_sessions(id) ON DELETE SET NULL,
  event text NOT NULL,
  -- 'landing_view', 'diagnosis_start', 'question_answered',
  -- 'diagnosis_complete', 'lead_captured', 'exit_diagnosis',
  -- 'exit_survey_shown', 'exit_survey_answered', 'resume_prompt_shown'
  step integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytics_events_event ON public.analytics_events(event);
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_visitor ON public.analytics_events(visitor_id);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert analytics events"
ON public.analytics_events FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view analytics"
ON public.analytics_events FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- 3) EXIT SURVEYS
-- =========================================
CREATE TABLE public.exit_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id text,
  reason text NOT NULL,
  -- 'not_sure_need', 'no_time', 'want_more_info', 'other'
  details text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_exit_surveys_created_at ON public.exit_surveys(created_at DESC);

ALTER TABLE public.exit_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit exit survey"
ON public.exit_surveys FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view exit surveys"
ON public.exit_surveys FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- 4) CASE STUDIES
-- =========================================
CREATE TABLE public.case_studies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  client_name text,
  industry text,
  problem text NOT NULL,
  services jsonb NOT NULL DEFAULT '[]'::jsonb,
  result_summary text NOT NULL,
  metrics jsonb DEFAULT '[]'::jsonb,
  -- e.g. [{"label":"Rritje klientesh","value":"+40%"}, ...]
  testimonial text,
  testimonial_author text,
  image_url text,
  published boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_case_studies_published ON public.case_studies(published, display_order);

ALTER TABLE public.case_studies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published case studies"
ON public.case_studies FOR SELECT
TO anon, authenticated
USING (published = true);

CREATE POLICY "Admins can view all case studies"
ON public.case_studies FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage case studies"
ON public.case_studies FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_case_studies_updated_at
BEFORE UPDATE ON public.case_studies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- 5) Open SELECT on diagnostic_sessions/leads for admins (funnel join)
-- =========================================
CREATE POLICY "Admins can view all sessions"
ON public.diagnostic_sessions FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all leads"
ON public.diagnostic_leads FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- 6) Funnel summary RPC (admin-only via RLS check)
-- =========================================
CREATE OR REPLACE FUNCTION public.get_funnel_summary(_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _since timestamptz := now() - (_days || ' days')::interval;
  _result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  WITH ev AS (
    SELECT event, visitor_id FROM public.analytics_events
    WHERE created_at >= _since
  )
  SELECT jsonb_build_object(
    'unique_visitors', (SELECT COUNT(DISTINCT visitor_id) FROM ev WHERE event = 'landing_view'),
    'started', (SELECT COUNT(DISTINCT visitor_id) FROM ev WHERE event = 'diagnosis_start'),
    'completed', (SELECT COUNT(DISTINCT visitor_id) FROM ev WHERE event = 'diagnosis_complete'),
    'leads', (SELECT COUNT(DISTINCT visitor_id) FROM ev WHERE event = 'lead_captured'),
    'abandoned', (SELECT COUNT(DISTINCT visitor_id) FROM ev WHERE event = 'exit_diagnosis'),
    'exit_surveys', (SELECT COUNT(*) FROM public.exit_surveys WHERE created_at >= _since),
    'sessions_total', (SELECT COUNT(*) FROM public.diagnostic_sessions WHERE created_at >= _since),
    'leads_total', (SELECT COUNT(*) FROM public.diagnostic_leads WHERE created_at >= _since),
    'period_days', _days
  ) INTO _result;

  RETURN _result;
END;
$$;