-- [NEW] 품목명과 등급을 기반으로 하는 재고 업서트(Upsert) RPC
-- 아이템 ID를 모르는 상태에서도 (품목명, 등급) 조합으로 재고를 추가할 수 있게 합니다.
-- 만약 해당 조합이 없으면 새로 생성합니다.

CREATE OR REPLACE FUNCTION public.malroda_upsert_inventory_by_name(
  p_farm_id UUID,
  p_item_name VARCHAR,
  p_grade VARCHAR,
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
  status VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item_id UUID;
  v_current_stock INTEGER;
BEGIN
  -- 1. (품목명, 등급)으로 기존 아이템 찾기 (FOR UPDATE로 락)
  SELECT id, current_stock INTO v_item_id, v_current_stock
  FROM public.malroda_items
  WHERE farm_id = p_farm_id 
    AND item_name = p_item_name 
    AND grade = p_grade
  FOR UPDATE;

  -- 2. 없으면 신규 생성
  IF NOT FOUND THEN
    INSERT INTO public.malroda_items (farm_id, item_name, grade, unit, current_stock)
    VALUES (p_farm_id, p_item_name, p_grade, p_unit, 0)
    RETURNING id, current_stock INTO v_item_id, v_current_stock;
    
    RAISE NOTICE 'New item created: % (%)', p_item_name, p_grade;
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

  RETURN QUERY SELECT v_current_stock, p_item_name, p_grade, 'SUCCESS'::VARCHAR;
END;
$$;
