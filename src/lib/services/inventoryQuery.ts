import { openai } from './openai';
import { supabase } from '../supabase/client';

const NL2SQL_SYSTEM_PROMPT = `당신은 '말로다(MALRODA)' 시스템의 재고 조회 전용 Query Generator(NL2SQL) 전문가입니다.
사용자의 질문을 바탕으로 오직 읽기 권한만 있는 'v_malroda_inventory_summary' 뷰를 조회하는 PostgreSQL 쿼리문을 작성하세요.
절대로 테이블을 직접 쿼리하거나, 트랜잭션/데이터변경(INSERT, UPDATE, DELETE, DROP) 쿼리를 작성해서는 안 됩니다.

## View 스키마 정의 (v_malroda_inventory_summary)
- farm_id (UUID)
- farm_name (VARCHAR)
- item_id (UUID)
- item_name (VARCHAR)
- grade (VARCHAR)
- zone (VARCHAR)
- current_stock (INTEGER)
- unit (VARCHAR)
- last_updated (TIMESTAMPTZ)

## 지시사항
0. [최우선 중요] **반드시 모든 쿼리의 WHERE 절에 \`farm_id = '{{FARM_ID}}'\` 조건을 기본으로 포함하세요!!** 다른 농장의 데이터를 조회하면 절대 안 됩니다.
1. 사용자의 질문에 답변할 수 있는 안전한 SELECT 쿼리를 작성하세요.
2. 만약 사용자가 '종류', '종류별', '어떤 종류', '어떤 등급' 등을 물어보면 반드시 SELECT 절에 \`item_name\`, \`grade\`, \`zone\`을 모두 포함하여 조회하세요.
3. [중요] 사용자가 '서울', '10동', '자스민' 등 특정 장소/구역을 언급하면 쿼리의 WHERE 조건에 \`farm_name\` 필드가 아닌 반드시 \`zone\` 필드(예: \`zone = '서울'\`)를 사용해서 필터링하세요. 단, "로즈마리외대", "핑크세이지리틀잎" 같이 식물 수형/특성을 나타내는 "외대"나 "리틀잎" 등은 구역(zone)이 '절대로' 아니며, 품목명(item_name)의 일부분입니다.
4. [중요] 품목명(item_name)에 오타가 있을 수 있습니다(예: 레몬바나나 -> 레몬버베나). 현재 DB에는 \`fuzzystrmatch\` 확장이 활성화되어 있으므로, 검색된 품목이 동명이 아닐 경우 **입력된 품목명과 가장 유사도가 높은 단일 품목(단 1개의 품목명)만을 찾아서** 해당 품목의 모든 등급/재고를 반환하세요. 이를 위해 레벤슈타인 거리 함수(\`levenshtein()\`)를 이용한 서브쿼리를 적극 활용하세요. 오타가 적을수록 거리가 짧으므로 오름차순(ASC) 정렬을 사용합니다. **[매우 중요] 서브쿼리에도 반드시 \`farm_id = '{{FARM_ID}}'\` 조건을 포함하세요!** (예: \`WHERE item_name = (SELECT item_name FROM v_malroda_inventory_summary WHERE farm_id = '{{FARM_ID}}' ORDER BY levenshtein(item_name, '로즈마리외대') ASC LIMIT 1)\` 주의: "외대"는 품목명에 포함시켜서 찾으세요!) 품목명에 괄호가 포함된 경우(예: '가물레피시스(유리호프스)')도 정확히 매칭하세요.
5. [중요] 사용자가 명시적으로 '재고 없는 것', '품절된 것'을 찾지 않는 이상, 보기 편하고 깔끔한 결과를 위해 **반드시 \`WHERE\` 조건에 \`current_stock > 0\` 조건을 추가하여 재고가 0인 품목은 결과에서 제외**시키세요.
5-1. [중요] 등급(grade) 검색 시, 대소문자와 공백에 유연하게 대응하세요. 예를 들어 '30cm', '30CM', '30 cm'는 모두 같은 등급입니다. LOWER() 함수와 TRIM()을 활용하거나, ILIKE를 사용하세요. (예: \`LOWER(TRIM(grade)) = LOWER('30cm')\` 또는 \`grade ILIKE '30cm'\`)
6. 특별한 요청이 없더라도, 농부님이 보기 편하도록 거의 모든 조회 시에 \`ORDER BY item_name ASC, zone ASC, grade ASC\` 를 포함하여 정렬된 결과를 반환하세요.
7. 결과값은 반드시 아래 JSON 형태로 출력합니다. 설명은 덧붙이지 마세요.
{
  "sql": "SELECT ... FROM v_malroda_inventory_summary ...",
  "explanation": "해당 쿼리가 의미하는 바 (간단히)"
}
`;

export async function processInventoryQuery(
    originalText: string,
    farmId: string | null
) {
    try {
        if (!farmId) throw new Error("Farm ID is required for data isolation.");

        const startTime = Date.now();
        console.log("[Timing] Starting NL2SQL process...");

        const finalPrompt = NL2SQL_SYSTEM_PROMPT.replace('{{FARM_ID}}', farmId);
        // 1. 사용자 질문을 기반으로 NL2SQL 쿼리 요청 (GPT-4o-mini for faster response)
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", // 속도 향상을 위해 mini 모델 사용
            messages: [
                { role: "system", content: finalPrompt },
                { role: "user", content: originalText }
            ],
            response_format: { type: "json_object" },
            temperature: 0,
        });

        console.log(`[Timing] NL2SQL OpenAI call: ${Date.now() - startTime}ms`);

        const resultText = response.choices[0].message.content;
        const { sql, explanation } = JSON.parse(resultText || "{}");

        if (!sql || !sql.toLowerCase().startsWith('select')) {
            throw new Error("Invalid or unsafe SQL generated.");
        }

        // 추가적인 보안 로직 강화 (선택사항)
        const sqlLower = sql.toLowerCase();
        if (/\bdrop\b/.test(sqlLower) || /\bdelete\b/.test(sqlLower) || /\bupdate\b/.test(sqlLower) || /\binsert\b/.test(sqlLower) || /\balter\b/.test(sqlLower)) {
            throw new Error("Dangerous SQL injected!");
        }

        if (!sqlLower.includes(farmId.toLowerCase())) {
            throw new Error("Security Violation: Generated SQL does not filter by user's farm_id!");
        }

        // 2. 동적 쿼리 실행
        // 주의: Supabase REST API는 임의의 raw 쿼리를 직접 실행하는 엔드포인트(PostgREST)를 제공하지 않습니다.
        // 안전한 NL2SQL 구현을 위해서는 다음 2가지 중 하나가 필요합니다:
        // 옵션 A) postgres.js 나 pg 모듈을 사용하여 직접 DB에 TCP Connection을 맺고 쿼리.
        // 옵션 B) 매우 안전하게 통제된 함수, 즉 'execute_sql(query text)' 와 같은 관리자 전용 RPC를 만들어서 실행.

        // SQL 문자열 정제 (마크다운 코드블록이나 불필요한 공백/개행 제거, 세미콜론 제거)
        let cleanSql = sql.replace(/```sql/ig, '').replace(/```/g, '').trim();
        // 줄바꿈 공백 처리 및 마지막 세미콜론 제거
        cleanSql = cleanSql.replace(/\n'/g, " '").replace(/\n/g, ' ').replace(/;+\s*$/, '');

        // [MVP: 실제 Supabase DB 연결 처리]
        // 방금 만든 execute_read_only_sql RPC를 호출합니다.
        console.log(`[NL2SQL Configured] Query: ${cleanSql}`);
        console.log(`[NL2SQL Reason]: ${explanation}`);

        const dbStartTime = Date.now();
        const { data: queryResult, error: dbError } = await supabase.rpc('execute_read_only_sql', { query: cleanSql });
        console.log(`[Timing] Database RPC call: ${Date.now() - dbStartTime}ms`);

        if (dbError) {
            console.error("[RPC SQL Execution Error]:", dbError);
            throw new Error(`DB 쿼리 실행 오류: ${dbError.message} / ${dbError.details}`);
        }

        const realData = queryResult || [];
        console.log(`[Timing] Query returned ${realData.length} rows`);

        // Debug logging for empty results
        if (realData.length === 0) {
            console.log(`[Debug] No results found for query: "${originalText}"`);
            console.log(`[Debug] Generated SQL: ${cleanSql}`);
            console.log(`[Debug] Farm ID: ${farmId}`);
        }

        // 3. 쿼리 결과(Data)를 바탕으로 자연어 답변(Natural Language 응답) 생성
        let message: string;
        const answerStartTime = Date.now();

        // For large datasets (>20 items), use template response instead of GPT
        if (realData.length > 20) {
            // Group by item_name for summary
            const itemGroups = realData.reduce((acc: Record<string, number>, item: any) => {
                acc[item.item_name] = (acc[item.item_name] || 0) + item.current_stock;
                return acc;
            }, {});
            const uniqueItems = Object.keys(itemGroups).length;
            const totalStock = Object.values(itemGroups).reduce((sum: number, stock: any) => sum + stock, 0);

            message = `총 **${uniqueItems}개 품목**, **${totalStock.toLocaleString()}개** 재고가 조회되었습니다.\n\n오른쪽 시각화 패널에서 상세 내용을 확인하세요.`;
            console.log(`[Timing] Large dataset - using template response`);
        } else if (realData.length === 0) {
            message = "조회된 재고가 없습니다.";
        } else {
            // For small datasets, use GPT for natural response
            const answerResponse = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "당신은 농부에게 재고 조회 결과를 대답해주는 비서입니다. 제공된 JSON 데이터를 바탕으로 질문에 명확하게 대답하세요. 만약 데이터가 여러 개(예: 전체 재고 목록)라면, 사용자가 읽기 편하도록 반드시 마크다운(Markdown) 글머리 기호(-)와 줄바꿈을 사용하여 깔끔하게 목록 형태로 정리해서 답변하세요. 재고를 나열할 때는 구역(zone) 정보도 함께 표시하여 어디에 있는 재고인지 명확하게 알려주세요." },
                    { role: "user", content: `질문: "${originalText}"\n조회결과: ${JSON.stringify(realData)}` }
                ],
                temperature: 0.3,
            });
            message = answerResponse.choices[0].message.content || "조회가 완료되었습니다.";
        }

        console.log(`[Timing] Answer generation: ${Date.now() - answerStartTime}ms`);
        console.log(`[Timing] Total time: ${Date.now() - startTime}ms`);

        return {
            success: true,
            sql_used: sql,
            data: realData,
            message
        };

    } catch (err: any) {
        console.error("[processInventoryQuery Error Detail]:", err);
        return {
            success: false,
            message: "재고 조회 실패: " + (err.message || err.toString())
        };
    }
}
