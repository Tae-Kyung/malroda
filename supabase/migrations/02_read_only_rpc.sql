-- NL2SQL 쿼리를 안전하게 실행하기 위한 읽기 전용 RPC
-- 오직 v_malroda_inventory_summary 뷰에 대한 SELECT 문만 허용합니다.

CREATE OR REPLACE FUNCTION public.execute_read_only_sql(query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- 1. 보안 검증: SELECT로 시작하고 v_malroda_inventory_summary를 포함하는지 강력히 확인
  IF TRIM(query) NOT ILIKE 'SELECT %' THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed.';
  END IF;

  IF query !~* 'v_malroda_inventory_summary' THEN
    RAISE EXCEPTION 'Queries must target the v_malroda_inventory_summary view.';
  END IF;

  IF query ~* '\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|GRANT|REVOKE|COMMIT|ROLLBACK|EXECUTE)\b' THEN
    RAISE EXCEPTION 'Dangerous SQL keywords are not allowed.';
  END IF;

  -- 2. 쿼리 실행 및 결과를 JSONB 배열로 반환
  EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || query || ') t' INTO result;

  -- 결과가 없으면 빈 배열 반환
  IF result IS NULL THEN
    result := '[]'::jsonb;
  END IF;

  RETURN result;
END;
$$;
