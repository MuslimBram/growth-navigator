
-- ENUMS
CREATE TYPE micro_platform AS ENUM ('facebook','instagram','tiktok','youtube','twitter','linkedin');
CREATE TYPE micro_category AS ENUM ('growth','engagement','engagement_high','visibility_boost','advanced');
CREATE TYPE micro_variant AS ENUM ('S','M','L','XL','none');
CREATE TYPE micro_risk_level AS ENUM ('low','medium','high');
CREATE TYPE micro_usage_status AS ENUM ('pending','approved','rejected','delivered');

-- micro_services catalog
CREATE TABLE public.micro_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_name TEXT NOT NULL DEFAULT 'Shërbime Individuale',
  platform micro_platform NOT NULL,
  category micro_category NOT NULL DEFAULT 'engagement',
  service_name TEXT NOT NULL,
  variant micro_variant NOT NULL DEFAULT 'none',
  unit TEXT NOT NULL DEFAULT 'per 1K',
  standard_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  offer_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  difference NUMERIC(10,2) GENERATED ALWAYS AS (standard_price - offer_price) STORED,
  discount_percentage NUMERIC(5,1) GENERATED ALWAYS AS (
    CASE WHEN standard_price > 0
      THEN ROUND(((standard_price - offer_price) / standard_price) * 100, 1)
      ELSE 0 END
  ) STORED,
  delivery_time TEXT,
  description TEXT,
  risk_level micro_risk_level NOT NULL DEFAULT 'low',
  recommended_use_case TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.micro_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage micro_services" ON public.micro_services
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_micro_services_updated
  BEFORE UPDATE ON public.micro_services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-categorize trigger
CREATE OR REPLACE FUNCTION public.micro_services_auto_category()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE n TEXT;
BEGIN
  n := lower(coalesce(NEW.service_name, ''));
  IF n LIKE '%comment%' AND n LIKE '%view%' THEN
    NEW.category := 'engagement_high';
  ELSIF n LIKE '%monetiz%' THEN
    NEW.category := 'advanced';
  ELSIF n LIKE '%livestream%' OR n LIKE '%live%' OR n LIKE '%stream%' THEN
    NEW.category := 'visibility_boost';
  ELSIF n LIKE '%komente%' OR n LIKE '%comment%' OR n LIKE '%replies%' OR n LIKE '%votes%' THEN
    NEW.category := 'engagement_high';
  ELSIF n LIKE '%follower%' OR n LIKE '%subscriber%' OR n LIKE '%group member%' OR n LIKE '%page like%' THEN
    NEW.category := 'growth';
  ELSIF n LIKE '%like%' OR n LIKE '%view%' OR n LIKE '%share%' OR n LIKE '%retweet%' OR n LIKE '%click%' OR n LIKE '%save%' THEN
    NEW.category := 'engagement';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_micro_services_categorize
  BEFORE INSERT OR UPDATE OF service_name ON public.micro_services
  FOR EACH ROW EXECUTE FUNCTION public.micro_services_auto_category();

-- micro_service_usage
CREATE TABLE public.micro_service_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID NOT NULL REFERENCES public.admin_recommendations(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.micro_services(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  status micro_usage_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_msu_rec ON public.micro_service_usage(recommendation_id);
CREATE INDEX idx_msu_service ON public.micro_service_usage(service_id);
CREATE INDEX idx_msu_created ON public.micro_service_usage(created_at);

ALTER TABLE public.micro_service_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage micro_service_usage" ON public.micro_service_usage
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Extend admin_recommendations
ALTER TABLE public.admin_recommendations
  ADD COLUMN IF NOT EXISTS recommended_micro_services JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS micro_services_total NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS boost_eligible BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS boost_eligibility_reason TEXT;

-- ============================================================
-- SEED DATA
-- ============================================================
-- Helper: insert micro services
INSERT INTO public.micro_services (platform, service_name, variant, standard_price, offer_price, risk_level, recommended_use_case, display_order) VALUES
-- FACEBOOK
('facebook','Monetizim','S',80.00,60.00,'high','Për faqe që kanë përmbajtje të rregullt dhe duan të aktivizojnë monetizimin',10),
('facebook','Saves','S',0.30,0.10,'low','Për postime që duan më shumë ruajtje',11),
('facebook','Saves','M',0.70,0.40,'low','Për postime që duan më shumë ruajtje',12),
('facebook','Followers','S',6.00,4.00,'high','Për faqe të reja me përmbajtje aktive',13),
('facebook','Group Members','S',4.50,3.00,'medium','Për grupe që duan të rriten',14),
('facebook','Group Members','M',5.00,4.00,'medium','Për grupe që duan të rriten',15),
('facebook','Page Likes/Members','S',7.00,5.00,'medium','Për faqe që duan më shumë ndjekës',16),
('facebook','Shares','S',2.00,1.00,'low','Për postime që duan shpërndarje',17),
('facebook','Shares','M',5.50,4.50,'low','Për postime që duan shpërndarje',18),
('facebook','Komente','S',27.00,20.00,'high','Për postime që duan angazhim të lartë',19),
('facebook','Komente','M',47.00,35.00,'high','Për postime që duan angazhim të lartë',20),
('facebook','Komente','L',60.00,40.00,'high','Për postime që duan angazhim të lartë',21),
('facebook','Likes','S',3.00,2.00,'medium','Për postime që duan engagement fillestar',22),
('facebook','Likes','M',5.00,3.00,'medium','Për postime që duan engagement fillestar',23),
('facebook','Likes','L',7.00,4.00,'medium','Për postime që duan engagement fillestar',24),
('facebook','Views','S',9.00,5.00,'low','Për postime me reach të ulët',25),
('facebook','Views','M',14.00,10.00,'low','Për postime me reach të ulët',26),
('facebook','Livestream','S',3.00,2.00,'low','Për evente live që duan shikueshmëri',27),
('facebook','Livestream','M',4.00,3.00,'low','Për evente live që duan shikueshmëri',28),
('facebook','Livestream','L',6.00,4.00,'low','Për evente live që duan shikueshmëri',29),

-- INSTAGRAM (çmime të ngjashme me Facebook)
('instagram','Monetizim','S',80.00,60.00,'high','Për profile që plotësojnë kushtet për monetizim',40),
('instagram','Saves','S',0.30,0.10,'low','Për postime që duan më shumë ruajtje',41),
('instagram','Saves','M',0.70,0.40,'low','Për postime që duan më shumë ruajtje',42),
('instagram','Followers','S',6.00,4.00,'high','Për profile të reja me përmbajtje aktive',43),
('instagram','Followers','M',10.00,7.00,'high','Për profile me përmbajtje aktive',44),
('instagram','Followers','L',18.00,12.00,'high','Për profile që duan rritje më të madhe',45),
('instagram','Story Views','S',2.00,1.00,'low','Për stories që duan më shumë shikime',46),
('instagram','Story Views','M',5.00,3.00,'low','Për stories që duan më shumë shikime',47),
('instagram','Reel Views','S',5.00,3.00,'low','Për reels me reach të ulët',48),
('instagram','Reel Views','M',10.00,6.00,'low','Për reels me reach të ulët',49),
('instagram','Likes','S',3.00,2.00,'medium','Për postime që duan engagement fillestar',50),
('instagram','Likes','M',5.00,3.00,'medium','Për postime që duan engagement fillestar',51),
('instagram','Likes','L',7.00,4.00,'medium','Për postime që duan engagement fillestar',52),
('instagram','Komente','S',27.00,20.00,'high','Për postime që duan angazhim të lartë',53),
('instagram','Komente','M',47.00,35.00,'high','Për postime që duan angazhim të lartë',54),

-- TIKTOK
('tiktok','Followers','S',10.00,5.00,'high','Për profile me përmbajtje virale potenciale',60),
('tiktok','Followers','M',18.00,10.00,'high','Për profile me përmbajtje virale potenciale',61),
('tiktok','Views','S',0.25,0.08,'low','Për video që kanë nevojë për shpërndarje fillestare',62),
('tiktok','Views','M',0.35,0.15,'low','Për video që kanë nevojë për shpërndarje fillestare',63),
('tiktok','Views','L',0.50,0.25,'low','Për video që kanë nevojë për shpërndarje fillestare',64),
('tiktok','Komente','S',1.50,0.80,'high','Për video që duan angazhim',65),
('tiktok','Shares','S',0.90,0.50,'low','Për video që duan shpërndarje',66),

-- YOUTUBE
('youtube','Monetize (10-15 ditë)','none',120.00,90.00,'high','Për kanale që plotësojnë kushtet',80),
('youtube','Monetize (7 ditë)','none',150.00,120.00,'high','Për kanale që plotësojnë kushtet',81),
('youtube','1K Subscribers','M',20.00,12.00,'high','Për kanale me përmbajtje aktive',82),
('youtube','1K Subscribers','L',30.00,20.00,'high','Për kanale me përmbajtje aktive',83),
('youtube','1K Likes','S',2.00,1.00,'medium','Për video që duan engagement',84),
('youtube','1K Likes','M',3.50,2.00,'medium','Për video që duan engagement',85),
('youtube','1K Likes','L',5.00,3.00,'medium','Për video që duan engagement',86),
('youtube','1K Komente','none',20.00,15.00,'high','Për video që duan angazhim',87),
('youtube','1K Komente Pack 1','none',27.00,20.00,'high','Paketë komentesh',88),
('youtube','1K Komente Pack 2','none',75.00,60.00,'high','Paketë komentesh',89),
('youtube','1K emoji Komente 1','none',5.00,3.00,'medium','Angazhim i lehtë',90),
('youtube','1K emoji Komente 2','none',8.00,6.00,'medium','Angazhim i lehtë',91),
('youtube','1K emoji Komente 3','none',13.00,10.00,'medium','Angazhim i lehtë',92),
('youtube','1K Views','S',2.00,1.00,'low','Për video me reach të ulët',93),
('youtube','1K Views','M',5.00,2.00,'low','Për video me reach të ulët',94),
('youtube','1K Views','L',7.00,4.00,'low','Për video me reach të ulët',95),
('youtube','1K Views','XL',12.00,8.00,'low','Për video me reach të ulët',96),
('youtube','Like, Sub & Comment Pack','none',3.50,2.00,'high','Paketë e plotë engagement-i',97),
('youtube','Like, View, Sub & Comment Pack','none',4.00,3.00,'high','Paketë e plotë engagement-i',98),
('youtube','Like, View, Sub & Comment Back','none',25.00,20.00,'high','Paketë e plotë me kthim',99),
('youtube','Like, View, Sub & Comment Pack Premium','none',40.00,35.00,'high','Paketë premium engagement-i',100),

-- TWITTER
('twitter','Followers','S',15.00,10.00,'high','Për llogari me përmbajtje aktive',120),
('twitter','Followers','M',22.00,15.00,'high','Për llogari me përmbajtje aktive',121),
('twitter','Followers','L',28.00,20.00,'high','Për llogari me përmbajtje aktive',122),
('twitter','Followers','XL',35.00,30.00,'high','Për llogari me përmbajtje aktive',123),
('twitter','Views','S',0.10,0.05,'low','Për postime me pak shikime',124),
('twitter','Views','M',0.20,0.10,'low','Për postime me pak shikime',125),
('twitter','Likes','S',0.50,0.30,'medium','Për postime që duan engagement',126),
('twitter','Likes','M',5.00,3.00,'medium','Për postime që duan engagement',127),
('twitter','Likes','L',45.00,30.00,'medium','Për postime që duan engagement',128),
('twitter','Pull Votes','none',2.00,1.50,'medium','Për sondazhe',129),
('twitter','Other Clicks','none',1.00,0.50,'low','Për klikime',130),
('twitter','Comments','S',45.00,30.00,'high','Për postime që duan angazhim',131),
('twitter','Comments','M',90.00,75.00,'high','Për postime që duan angazhim',132),

-- LINKEDIN
('linkedin','1K Followers','none',35.00,30.00,'high','Për faqe biznesi me përmbajtje',140),
('linkedin','1K Likes','none',19.00,15.00,'medium','Për postime që duan engagement',141),
('linkedin','1K Komente','none',27.00,22.00,'high','Për postime që duan angazhim profesional',142);
