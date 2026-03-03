-- ============================================
-- MALRODA DATABASE SETUP
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ============================================

-- 1. Core Tables
CREATE TABLE IF NOT EXISTS public.malroda_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR UNIQUE NOT NULL,
  full_name VARCHAR NOT NULL,
  phone_number VARCHAR UNIQUE,
  kakao_id VARCHAR UNIQUE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_malroda_profiles_email ON public.malroda_profiles(email);

CREATE TABLE IF NOT EXISTS public.malroda_farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.malroda_profiles(id) ON DELETE CASCADE,
  farm_name VARCHAR NOT NULL,
  region_code VARCHAR,
  main_items JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.malroda_farm_members (
  farm_id UUID REFERENCES public.malroda_farms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.malroda_profiles(id) ON DELETE CASCADE,
  role VARCHAR DEFAULT 'staff',
  PRIMARY KEY (farm_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.malroda_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES public.malroda_farms(id) ON DELETE CASCADE,
  item_name VARCHAR NOT NULL,
  grade VARCHAR DEFAULT 'Default',
  zone VARCHAR DEFAULT 'Default',
  unit VARCHAR DEFAULT 'pcs',
  current_stock INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.malroda_inventory_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.malroda_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.malroda_profiles(id) ON DELETE SET NULL,
  action_type VARCHAR NOT NULL,
  quantity_change INTEGER NOT NULL,
  original_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.malroda_session_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.malroda_profiles(id) ON DELETE CASCADE,
  session_id VARCHAR NOT NULL UNIQUE,
  last_context JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Read-Only View for Inventory
CREATE OR REPLACE VIEW public.v_malroda_inventory_summary AS
SELECT
  f.id AS farm_id,
  f.farm_name,
  i.id AS item_id,
  i.item_name,
  i.grade,
  i.zone,
  i.current_stock,
  i.unit,
  i.updated_at AS last_updated
FROM public.malroda_farms f
JOIN public.malroda_items i ON f.id = i.farm_id;

-- 3. Auth Trigger: Auto-create profile & farm on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_farm_id UUID;
  user_is_admin BOOLEAN;
BEGIN
  -- Check if admin email (admin@herb5.com)
  user_is_admin := (new.email = 'admin@herb5.com');

  -- Create Profile (email stored for reference, password handled by Supabase Auth)
  INSERT INTO public.malroda_profiles (id, email, full_name, is_admin)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    user_is_admin
  );

  -- Create Default Farm
  new_farm_id := gen_random_uuid();
  INSERT INTO public.malroda_farms (id, owner_id, farm_name)
  VALUES (
    new_farm_id,
    new.id,
    CASE WHEN user_is_admin THEN 'Herb5 Farm' ELSE 'My Farm (' || split_part(new.email, '@', 1) || ')' END
  );

  -- Add user to farm members
  INSERT INTO public.malroda_farm_members (farm_id, user_id, role)
  VALUES (new_farm_id, new.id, 'owner');

  RETURN new;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Row Level Security (RLS)
ALTER TABLE public.malroda_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.malroda_farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.malroda_farm_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.malroda_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.malroda_inventory_logs ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile" ON public.malroda_profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.malroda_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policies for farms
CREATE POLICY "Users can view farms they belong to" ON public.malroda_farms
  FOR SELECT USING (
    id IN (SELECT farm_id FROM public.malroda_farm_members WHERE user_id = auth.uid())
  );
CREATE POLICY "Owners can update their farms" ON public.malroda_farms
  FOR UPDATE USING (owner_id = auth.uid());

-- Policies for farm members
CREATE POLICY "Users can view their farm memberships" ON public.malroda_farm_members
  FOR SELECT USING (user_id = auth.uid());

-- Policies for items
CREATE POLICY "Users can view items in their farms" ON public.malroda_items
  FOR SELECT USING (
    farm_id IN (SELECT farm_id FROM public.malroda_farm_members WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can insert items in their farms" ON public.malroda_items
  FOR INSERT WITH CHECK (
    farm_id IN (SELECT farm_id FROM public.malroda_farm_members WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can update items in their farms" ON public.malroda_items
  FOR UPDATE USING (
    farm_id IN (SELECT farm_id FROM public.malroda_farm_members WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can delete items in their farms" ON public.malroda_items
  FOR DELETE USING (
    farm_id IN (SELECT farm_id FROM public.malroda_farm_members WHERE user_id = auth.uid())
  );

-- Policies for inventory logs
CREATE POLICY "Users can view logs in their farms" ON public.malroda_inventory_logs
  FOR SELECT USING (
    item_id IN (
      SELECT id FROM public.malroda_items WHERE farm_id IN (
        SELECT farm_id FROM public.malroda_farm_members WHERE user_id = auth.uid()
      )
    )
  );
CREATE POLICY "Users can insert logs" ON public.malroda_inventory_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Done!
SELECT 'Database setup complete!' as status;

-- ============================================
-- NEXT STEPS - SEED DATA:
-- ============================================
-- 1. First create admin user via Dashboard:
--    - Go to Authentication > Users > Add User
--    - Email: admin@herb5.com
--    - Password: admin1234!
--
-- 2. Then run the seed script:
--    Copy and paste contents of: supabase/seed_herb5.sql
--    Then execute: SELECT seed_herb5_inventory();
-- ============================================
