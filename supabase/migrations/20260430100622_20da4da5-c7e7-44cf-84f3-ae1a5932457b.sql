-- Diagnostic sessions table
CREATE TABLE public.diagnostic_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  ai_diagnosis TEXT,
  primary_service TEXT,
  secondary_services JSONB DEFAULT '[]'::jsonb,
  estimated_lost_clients INTEGER,
  estimated_lost_eur INTEGER,
  ai_source TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_diagnostic_sessions_visitor ON public.diagnostic_sessions(visitor_id);
CREATE INDEX idx_diagnostic_sessions_created ON public.diagnostic_sessions(created_at DESC);

ALTER TABLE public.diagnostic_sessions ENABLE ROW LEVEL SECURITY;

-- Anon can INSERT a new session (anyone can start a diagnosis)
CREATE POLICY "Anyone can create a diagnostic session"
ON public.diagnostic_sessions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- No public SELECT/UPDATE/DELETE — reads happen only through server functions using service role
-- (Result page fetches via server function that knows the session id)

-- Diagnostic leads table
CREATE TABLE public.diagnostic_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.diagnostic_sessions(id) ON DELETE CASCADE,
  email TEXT,
  whatsapp TEXT,
  business_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT lead_has_contact CHECK (email IS NOT NULL OR whatsapp IS NOT NULL)
);

CREATE INDEX idx_diagnostic_leads_session ON public.diagnostic_leads(session_id);
CREATE INDEX idx_diagnostic_leads_created ON public.diagnostic_leads(created_at DESC);

ALTER TABLE public.diagnostic_leads ENABLE ROW LEVEL SECURITY;

-- Anon can INSERT a lead
CREATE POLICY "Anyone can submit a lead"
ON public.diagnostic_leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- updated_at trigger (reuses the standard helper pattern)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_diagnostic_sessions_updated_at
BEFORE UPDATE ON public.diagnostic_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();