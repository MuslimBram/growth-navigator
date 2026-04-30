-- Add contacted flag to diagnostic_leads
ALTER TABLE public.diagnostic_leads
ADD COLUMN contacted boolean NOT NULL DEFAULT false;

-- Allow admins to update leads (for marking as contacted)
CREATE POLICY "Admins can update leads"
ON public.diagnostic_leads
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update sessions
CREATE POLICY "Admins can update sessions"
ON public.diagnostic_sessions
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));