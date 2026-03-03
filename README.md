# MalRoDa (말로다)

AI-powered farm inventory management system with voice and natural language support.

## Features

- **Voice Input**: Speech-to-text using OpenAI Whisper API
- **NL2SQL**: Natural language queries converted to SQL
- **Multi-language**: Korean and English support (i18n)
- **Real-time Market Prices**: Flower auction price integration
- **Supabase Backend**: PostgreSQL with Row Level Security

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIs..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIs..."

# OpenAI
OPENAI_API_KEY="sk-proj-..."

# Optional
FLOWER_API_KEY=
PPS_API_KEY=
```

---

## NL2SQL Architecture

The system converts natural language questions into SQL queries using OpenAI GPT.

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│  User: "로즈마리 재고 얼마야?"                                         │
└─────────────────────┬───────────────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Step 1: Intent Classification (GPT-4o-mini)                        │
│                                                                     │
│  Input: User message                                                │
│  Output: { intent: "INVENTORY_QUERY", entities: { item: "로즈마리" }}│
└─────────────────────┬───────────────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Step 2: SQL Generation (GPT-4o)                                    │
│                                                                     │
│  Prompt: "Convert this question to SQL for v_malroda_inventory..."  │
│                                                                     │
│  Output: SELECT item_name, grade, zone, current_stock               │
│          FROM v_malroda_inventory_summary                           │
│          WHERE farm_id = '...'                                      │
│          AND item_name = (SELECT item_name ...                      │
│              ORDER BY levenshtein(item_name, '로즈마리') LIMIT 1)    │
└─────────────────────┬───────────────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Step 3: Security Validation                                        │
│                                                                     │
│  ✓ Only SELECT queries allowed                                      │
│  ✓ Must query v_malroda_inventory_summary view only                 │
│  ✓ Must include farm_id filter (data isolation)                     │
│  ✗ Block INSERT/UPDATE/DELETE/DROP/ALTER                            │
└─────────────────────┬───────────────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Step 4: Execute SQL via Supabase RPC                               │
│                                                                     │
│  supabase.rpc('execute_read_only_sql', { query: sql })              │
│                                                                     │
│  Returns: [                                                         │
│    { item_name: "로즈마리", grade: "10cm", zone: "서울", stock: 50 }, │
│    { item_name: "로즈마리", grade: "18cm", zone: "곤지암", stock: 30 } │
│  ]                                                                  │
└─────────────────────┬───────────────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Step 5: Response Generation (GPT-4o-mini)                          │
│                                                                     │
│  Input: JSON data from database                                     │
│  Output: "로즈마리 재고는 다음과 같습니다:                              │
│           - 서울 10cm: 50개                                          │
│           - 곤지암 18cm: 30개"                                        │
└─────────────────────────────────────────────────────────────────────┘
```

### Summary Table

| Step | Model | Purpose |
|------|-------|---------|
| 1 | GPT-4o-mini | Classify intent (QUERY, UPDATE, etc.) |
| 2 | GPT-4o | Generate SQL from natural language |
| 3 | Code | Security validation |
| 4 | Supabase | Execute SQL query |
| 5 | GPT-4o-mini | Convert JSON to human response |

### Key Files

| File | Description |
|------|-------------|
| `src/app/api/router/route.ts` | Main API router, intent classification |
| `src/lib/services/openai.ts` | OpenAI client, router prompt |
| `src/lib/services/inventoryQuery.ts` | NL2SQL generation and execution |
| `src/lib/services/inventoryUpdate.ts` | Inventory update with fuzzy matching |
| `supabase/setup.sql` | Database schema and RPCs |

### Security Features

1. **Read-only View**: Queries only allowed on `v_malroda_inventory_summary`
2. **Farm Isolation**: All queries must include `farm_id` filter
3. **SQL Injection Prevention**: Dangerous keywords blocked
4. **RPC Validation**: Double-checked at database level

### Fuzzy Matching

Uses PostgreSQL `fuzzystrmatch` extension with Levenshtein distance for typo correction:

```sql
-- "레몬바나나" → finds "레몬버베나"
WHERE item_name = (
  SELECT item_name
  FROM v_malroda_inventory_summary
  ORDER BY levenshtein(item_name, '레몬바나나') ASC
  LIMIT 1
)
```

---

## Database Setup

Run `supabase/setup.sql` in Supabase SQL Editor to create:
- Tables (profiles, farms, items, logs)
- Views (inventory summary)
- RPCs (execute_read_only_sql, malroda_update_inventory)
- Row Level Security policies
- Auth trigger for auto-creating profiles

---

## Tech Stack

- **Frontend**: Next.js 15, React, TailwindCSS
- **Backend**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4o, GPT-4o-mini, Whisper
- **i18n**: next-intl
- **Charts**: Recharts
