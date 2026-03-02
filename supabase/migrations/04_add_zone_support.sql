-- 1. 아이템 테이블에 zone(구역) 컬럼 추가 (존재하지 않을 경우에만)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema='public' AND table_name='malroda_items' AND column_name='zone'
    ) THEN
        ALTER TABLE public.malroda_items ADD COLUMN zone VARCHAR DEFAULT '기본';
    END IF;
END $$;

-- 2. 기존 읽기 전용 뷰 재생성 (zone 포함)
DROP VIEW IF EXISTS public.v_malroda_inventory_summary;
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

-- 3. 품목명, 등급, गु역(zone) 기반 업서트 RPC 수정
-- 파라미터에 p_zone 추가
DROP FUNCTION IF EXISTS public.malroda_upsert_inventory_by_name(UUID, VARCHAR, VARCHAR, VARCHAR, UUID, VARCHAR, INTEGER, TEXT);

CREATE OR REPLACE FUNCTION public.malroda_upsert_inventory_by_name(
  p_farm_id UUID,
  p_item_name VARCHAR,
  p_grade VARCHAR,
  p_zone VARCHAR,
  p_unit VARCHAR,
  p_user_id UUID,
  p_action_type VARCHAR,
  p_qty_change INTEGER,
  p_original_text TEXT
)
RETURNS TABLE (
  new_stock INTEGER,
  matched_item_name VARCHAR,
  matched_grade VARCHAR,
  matched_zone VARCHAR,
  status VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item_id UUID;
  v_current_stock INTEGER;
BEGIN
  -- 1. (품목명, 등급, 구역)으로 기존 아이템 찾기 (FOR UPDATE로 락)
  SELECT id, current_stock INTO v_item_id, v_current_stock
  FROM public.malroda_items
  WHERE farm_id = p_farm_id 
    AND item_name = p_item_name 
    AND grade = p_grade
    AND zone = p_zone
  FOR UPDATE;

  -- 2. 없으면 신규 생성
  IF NOT FOUND THEN
    INSERT INTO public.malroda_items (farm_id, item_name, grade, zone, unit, current_stock)
    VALUES (p_farm_id, p_item_name, p_grade, p_zone, p_unit, 0)
    RETURNING id, current_stock INTO v_item_id, v_current_stock;
    
    RAISE NOTICE 'New item created: % (%) in %', p_item_name, p_grade, p_zone;
  END IF;

  -- 3. 재고 계산 및 업데이트
  v_current_stock := v_current_stock + p_qty_change;
  
  UPDATE public.malroda_items
  SET current_stock = v_current_stock, updated_at = NOW()
  WHERE id = v_item_id;

  -- 4. 이력 남기기
  INSERT INTO public.malroda_inventory_logs 
    (item_id, user_id, action_type, quantity_change, original_text)
  VALUES 
    (v_item_id, p_user_id, p_action_type, p_qty_change, p_original_text);

  RETURN QUERY SELECT v_current_stock, p_item_name, p_grade, p_zone, 'SUCCESS'::VARCHAR;
END;
$$;
