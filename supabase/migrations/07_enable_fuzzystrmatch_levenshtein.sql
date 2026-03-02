-- 1. fuzzystrmatch 확장 활성화 (레벤슈타인 거리 계산용)
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

-- 2. 이전 pg_trgm 설정에서 필요하다면 추가 작업
-- (이미 활성화된 pg_trgm은 그대로 두어도 무방합니다)
