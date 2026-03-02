# 말로다(MALRODA) 구현 태스크 (TASK.md)

이 문서는 `PRD.md`에 기술된 제품 요구사항 및 고도화된 하이브리드 AI 엔진 아키텍처 기반의 개발 절차를 관리하기 위한 세부 태스크(체크리스트)입니다.

## 1. 프로젝트 초기 설정 및 인프라 구성
- [ ] Next.js 프로젝트 생성 및 Vercel/GitHub CI/CD 환경 구성
- [ ] Supabase 프로젝트 생성 및 Vercel 환경 변수 연동
  - 필수 환경변수: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `KAKAO_REST_API_KEY`
- [ ] 카카오 디벨로퍼스 앱 생성 및 비즈니스 카카오톡 채널 개설

## 2. 데이터베이스 모델링 및 하이브리드 보안/기능 객체 (Supabase)
- [x] 기본 데이터 테이블 생성: `malroda_profiles`, `malroda_farms`, `malroda_farm_members`, `malroda_items`, `malroda_inventory_logs` (✅ `zone` 구역 지원 업데이트 완료)
- [x] AI 컨텍스트/검증 테이블 생성: `malroda_session_contexts`, `malroda_prompt_test_cases`
- [x] 데이터 격리 정책(RLS - Row Level Security)을 모든 테이블에 엄격하게 적용 (농가별 데이터 고립)
- [x] **쓰기용 RPC (저장 프로시저) 제작**: AI의 Tool Calling 요청을 받아 트랜잭션 형태로 구역별(zone) 재고 반영/로그 삽입을 안전하게 동시 수행하는 `malroda_update_inventory()`, `malroda_upsert_inventory_by_name()` 함수 생성 및 적용 완료
- [x] **읽기용 View 설계**: NL2SQL이 복잡한 조인 없이 구역(zone) 정보를 포함해 안전하게 참조할 수 있는 AI 검색 전용 Read-Only View(`v_malroda_inventory_summary`) 생성 완료

## 3. 핵심 AI 엔진 파이프라인 설계 및 튜닝 (✅ 가장 챌린징한 과제)
- [ ] **음성 처리 (STT)**: 카카오톡 음성 파일 다운로드 및 Whisper API를 활용한 Text 변환 모듈 구성
- [x] **지능형 라우팅 (Router Prompt) 계층 구현**
  - GPT-4o-mini 등 고속/저비용 모델을 이용해 사용자 발화를 5개 카테고리(`INVENTORY_UPDATE`, `INVENTORY_QUERY`, `PROCUREMENT_INFO`, `BUYER_MATCHING`, `GENERAL_SUPPORT`)로 사전 분류. **(✅ `zone` 추출 기능 추가 완료)**
- [x] **하이브리드 처리 로직 1: 쓰기 (Write/Tool Calling)**
  - 라우터 결과가 `INVENTORY_UPDATE`일 경우, 추출된 개체(Entity) 정보(item, grade, **zone**, qty)를 가져와 Supabase RPC 함수를 호출하도록 하는 안전한 Tool Calling(Function Call) 비즈니스 로직 작성 완료
- [x] **하이브리드 처리 로직 2: 읽기 (Read/NL2SQL)**
  - 라우터 결과가 `INVENTORY_QUERY`일 경우, `v_malroda_inventory_summary` 뷰 스키마만 AI에게 노출시켜, DROP/DELETE 등 위험 쿼리 방지 및 `zone` 필터링이 가능한 SELECT 동적 쿼리만을 생성 후 데이터 조회(NL2SQL) 응답을 반환하도록 프롬프트 작성 완료
- [ ] **의도 추출(NLU) 추가 튜닝**
  - 맥락 엔진 (Context Memory): DB에서 직전 대화를 읽어 "그거" 등 대명사를 치환
  - 동의어 처리기 (Synonym Processor) 및 단위 변환기 (Unit Converter) 보완

## 4. 시나리오 대응을 위한 외부 API 및 추가 기능 구현
- [ ] 조달/입찰 목적의 라우팅 분류(`PROCUREMENT_INFO`) 시 조달청 API 호출 결과 파싱 및 반환
- [ ] 서울 가락시장 도매 시세 API 연계 (시세 질의용)
- [ ] 알림톡 스케줄러 개발: 조달 입찰 조건/재고 출고 조건 부합 시 카카오톡 비즈메시지 발송

## 5. 단계별 베타 테스트 웹 플랫폼 구축 (Web Beta Platform)
- [ ] **사용자 인증 및 권한 (Auth)**
  - Supabase Auth를 이용한 이메일/소셜 로그인 및 회원가입 페이지 (`/login`) 구현
  - 로그인/비로그인 접근 제어를 위한 Next.js Middleware 적용
- [ ] **사용자 환경 (User Dashboard)**
  - 로그인 후 농장 정보(Farm) 및 초기 설정(Zone 등)을 관리하는 페이지 구현
  - AI 봇과 대화하며 입출고를 시뮬레이션 할 수 있는 **웹 시뮬레이터** 페이지 구현 (`/dashboard/simulator`)
- [ ] **관리자 환경 (Admin Dashboard)**
  - 관리자 전용 권한 접근 제어 (`/admin`)
  - 전체 사용자 현황 리스트 및 시스템 사용 통계 표시
  - 사용자별 채팅 로그(질문 내용, AI 분석 의도, 생성된 SQL) 실시간 모니터링 페이지 구현

## 6. QA 테스트 및 정식 배포
- [ ] 프롬프트 테스트 데이터셋을 활용해 의도로 분류, 단위 변환, 단위 테스트 전수 QA(TDD 방식 도입) 
- [ ] 카카오톡 챗봇 사용자 콜백 타임아웃 방지 및 응답시간 < 3초 제약 테스트
- [ ] Vercel 프로덕션 배포 완료
