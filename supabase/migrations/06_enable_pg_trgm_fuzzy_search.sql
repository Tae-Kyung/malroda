-- 1. pg_trgm 확장 활성화 (존재하지 않으면 활성화)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. NL2SQL 모델이 자유롭게 호출할 수 있는 함수 생성 혹은 뷰 유지
-- v_malroda_inventory_summary 뷰에서 similarity() 함수를 자유롭게 활용할 수 있도록 함
-- 추가 인덱싱(옵션)으로 속도 향상
CREATE INDEX IF NOT EXISTS trgm_idx_malroda_item_name ON public.malroda_items USING gin (item_name gin_trgm_ops);
