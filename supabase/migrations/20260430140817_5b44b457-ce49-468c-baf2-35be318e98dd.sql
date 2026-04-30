-- Table for AI business report analyses
CREATE TABLE public.business_report_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT,
  session_id UUID REFERENCES public.diagnostic_sessions(id) ON DELETE SET NULL,
  uploaded_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  user_text TEXT,
  extracted_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  ai_analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
  main_bottleneck TEXT,
  recommended_service TEXT,
  ai_source TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.business_report_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create analyses"
ON public.business_report_analyses
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view all analyses"
ON public.business_report_analyses
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_bra_created_at ON public.business_report_analyses(created_at DESC);
CREATE INDEX idx_bra_visitor_id ON public.business_report_analyses(visitor_id);

-- Private storage bucket for uploaded screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-reports', 'business-reports', false)
ON CONFLICT (id) DO NOTHING;

-- Anyone can upload (we namespace by visitor_id in path)
CREATE POLICY "Anyone can upload business report screenshots"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'business-reports');

-- Only admins can read directly; server uses service-role for AI processing
CREATE POLICY "Admins can read business report screenshots"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'business-reports'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);