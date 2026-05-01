
-- 1. Add new context fields to diagnostic_sessions
ALTER TABLE public.diagnostic_sessions
  ADD COLUMN IF NOT EXISTS extra_context text,
  ADD COLUMN IF NOT EXISTS screenshots jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS deep_analysis jsonb;

-- 2. Admin invites table — owner can pre-authorize admin emails
CREATE TABLE IF NOT EXISTS public.admin_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  used boolean NOT NULL DEFAULT false,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage invites"
  ON public.admin_invites
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Update auto_assign_admin trigger to also honor admin_invites
CREATE OR REPLACE FUNCTION public.auto_assign_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'info@mso.re' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSIF EXISTS (SELECT 1 FROM public.admin_invites WHERE lower(email) = lower(NEW.email) AND used = false) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    UPDATE public.admin_invites
      SET used = true, used_at = now()
      WHERE lower(email) = lower(NEW.email);
  END IF;
  RETURN NEW;
END;
$$;

-- Make sure the trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_assign_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_assign_admin();

-- 4. Public storage bucket for diagnostic screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('diagnostic-screenshots', 'diagnostic-screenshots', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read diagnostic screenshots"
  ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'diagnostic-screenshots');

CREATE POLICY "Anyone can upload diagnostic screenshots"
  ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'diagnostic-screenshots');
