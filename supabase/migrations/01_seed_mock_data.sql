-- 1. 테스트용 프로필 생성 (auth.users 연동 문제 해결)
-- Supabase의 auth.users 테이블에 먼저 임의의 유저를 생성한 후,
-- 해당 UUID를 사용하여 public.malroda_profiles 에 삽입합니다.

DO $$ 
DECLARE
  v_user_id UUID := gen_random_uuid();
  v_farm_id UUID := gen_random_uuid();
  v_email VARCHAR := 'test_farmer_' || substr(md5(random()::text), 1, 6) || '@malroda.test';
BEGIN

  -- 1) auth.users 테이블에 가짜 유저 생성 (Supabase 시스템 테이블)
  -- 비밀번호나 복잡한 인증 절차 없이 껍데기만 만듭니다.
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', v_email, crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"김농부"}', now(), now(), '', '', '', ''
  );

  -- 2) 사용자 프로필 삽입 (위에서 만든 v_user_id 사용)
  INSERT INTO public.malroda_profiles (id, kakao_id, full_name, phone_number)
  VALUES (v_user_id, 'test_kakao_' || substr(md5(random()::text), 1, 6), '김농부', '010-' || floor(random()*9000+1000)::text || '-' || floor(random()*9000+1000)::text);

  -- 3) 농장 정보 삽입
  INSERT INTO public.malroda_farms (id, owner_id, farm_name, region_code, main_items)
  VALUES (v_farm_id, v_user_id, '말로다 테스트 농장', 'KR-41', '["사과", "장미", "토마토"]'::jsonb);

  -- 4) 농장 멤버 연결
  INSERT INTO public.malroda_farm_members (farm_id, user_id, role)
  VALUES (v_farm_id, v_user_id, 'owner');

  -- 5) 기초 품목 데이터 삽입 (Item)
  INSERT INTO public.malroda_items (farm_id, item_name, grade, unit, current_stock)
  VALUES 
    (v_farm_id, '사과', '특품', '박스', 100),
    (v_farm_id, '사과', '일반', '박스', 50),
    (v_farm_id, '장미', 'A급', '단', 200),
    (v_farm_id, '로즈마리', '일반', 'kg', 10),
    (v_farm_id, '토마토', '일반', '박스', 30);

  RAISE NOTICE 'Mock Data Inserted! User ID: %, Farm ID: %', v_user_id, v_farm_id;
END $$;
