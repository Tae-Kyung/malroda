-- 08_create_auth_trigger.sql
-- Creates an trigger to automatically create a profile and a default farm when a user signs up.

-- 1. Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_farm_id UUID;
BEGIN
  -- 1) Create Profile
  INSERT INTO public.malroda_profiles (id, full_name)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );

  -- 2) Create Default Farm
  new_farm_id := gen_random_uuid();
  INSERT INTO public.malroda_farms (id, owner_id, farm_name)
  VALUES (new_farm_id, new.id, '내 농장 (' || split_part(new.email, '@', 1) || ')');

  -- 3) Add user to farm members
  INSERT INTO public.malroda_farm_members (farm_id, user_id, role)
  VALUES (new_farm_id, new.id, 'owner');

  RETURN new;
END;
$$;

-- 2. Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
