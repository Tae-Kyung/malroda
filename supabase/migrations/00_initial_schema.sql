-- 1. 핵심 테이블 생성 (Prefix: malroda_)
CREATE TABLE public.malroda_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  kakao_id VARCHAR UNIQUE,
  full_name VARCHAR NOT NULL,
  phone_number VARCHAR UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.malroda_farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.malroda_profiles(id) ON DELETE CASCADE,
  farm_name VARCHAR NOT NULL,
  region_code VARCHAR,
  main_items JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.malroda_farm_members (
  farm_id UUID REFERENCES public.malroda_farms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.malroda_profiles(id) ON DELETE CASCADE,
  role VARCHAR DEFAULT 'staff',
  PRIMARY KEY (farm_id, user_id)
);

CREATE TABLE public.malroda_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES public.malroda_farms(id) ON DELETE CASCADE,
  item_name VARCHAR NOT NULL,
  grade VARCHAR DEFAULT '일반',
  unit VARCHAR DEFAULT '박스',
  current_stock INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.malroda_inventory_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.malroda_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.malroda_profiles(id) ON DELETE SET NULL,
  action_type VARCHAR NOT NULL, -- 'IN', 'OUT', 'ADJUST', 'DISCARD'
  quantity_change INTEGER NOT NULL,
  original_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.malroda_session_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.malroda_profiles(id) ON DELETE CASCADE,
  session_id VARCHAR NOT NULL UNIQUE,
  last_context JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.malroda_prompt_test_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_name VARCHAR NOT NULL,
  user_input TEXT NOT NULL,
  expected_output JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 하이브리드 보호 조치: 읽기 전용 뷰 (Read-Only View)
-- NL2SQL 엔진은 접근 권한을 제한받아 아래 뷰만 SELECT할 수 있습니다.
CREATE OR REPLACE VIEW public.v_malroda_inventory_summary AS
SELECT 
  f.id AS farm_id,
  f.farm_name,
  i.id AS item_id,
  i.item_name,
  i.grade,
  i.current_stock,
  i.unit,
  i.updated_at AS last_updated
FROM public.malroda_farms f
JOIN public.malroda_items i ON f.id = i.farm_id;

-- 3. 하이브리드 보호 조치: 안전한 재고 업데이트 RPC
-- AI Tool Calling이 호출하게 될 트랜잭션 함수
CREATE OR REPLACE FUNCTION public.malroda_update_inventory(
  p_item_id UUID,
  p_user_id UUID,
  p_action_type VARCHAR,
  p_qty_change INTEGER,
  p_original_text TEXT
)
RETURNS TABLE (
  new_stock INTEGER,
  item_name VARCHAR,
  status VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_stock INTEGER;
  v_item_name VARCHAR;
BEGIN
  -- 1. 재고 아이템 락 및 현재 정보 가져오기
  SELECT malroda_items.current_stock, malroda_items.item_name INTO v_current_stock, v_item_name
  FROM public.malroda_items
  WHERE malroda_items.id = p_item_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 0, ''::VARCHAR, 'ERROR_ITEM_NOT_FOUND'::VARCHAR;
    RETURN;
  END IF;

  -- 2. 새 재고 계산
  v_current_stock := v_current_stock + p_qty_change;
  
  -- (옵션) 마이너스 재고 방지 로직 필요 시 주석 해제
  -- IF v_current_stock < 0 THEN
  --   v_current_stock := 0;
  -- END IF;

  -- 3. 재고 업데이트
  UPDATE public.malroda_items
  SET current_stock = v_current_stock, updated_at = NOW()
  WHERE id = p_item_id;

  -- 4. 이력 남기기
  INSERT INTO public.malroda_inventory_logs 
    (item_id, user_id, action_type, quantity_change, original_text)
  VALUES 
    (p_item_id, p_user_id, p_action_type, p_qty_change, p_original_text);

  RETURN QUERY SELECT v_current_stock, v_item_name, 'SUCCESS'::VARCHAR;
END;
$$;
