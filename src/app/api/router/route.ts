import { NextResponse } from 'next/server';
import { openai, ROUTER_SYSTEM_PROMPT } from '@/lib/services/openai';
import { processInventoryUpdate } from '@/lib/services/inventoryUpdate';
import { processInventoryQuery } from '@/lib/services/inventoryQuery';
import { processMarketPrice } from '@/lib/services/marketPrice';
import { supabase } from '@/lib/supabase/client';

export const dynamic = "force-dynamic";

// Detect visualization type based on data
function detectVisualizationType(data: any[] | null): "bar" | "pie" | "table" | "none" {
    if (!data || data.length === 0) return "none";
    return "table";  // Always use table format
}

export async function POST(req: Request) {
    try {
        const { text, sessionId, userId } = await req.json();

        if (!text) {
            return NextResponse.json({ error: "Text is required" }, { status: 400 });
        }

        let currentUserId = userId || "anonymous-user"; // 실제 구현 시 인증 세션이나 카카오톡 ID에서 추출

        // 유효한 UUID인지 검증 (카카오톡 연동 전 임시 검증)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(currentUserId) || currentUserId === '00000000-0000-0000-0000-000000000000') {
            return NextResponse.json({ error: "Invalid User ID. Please log in again." }, { status: 401 });
        }

        console.log(`[Router Request]: Processing text: "${text}" for user: ${currentUserId}`);

        // 0. 히스토리(Context) 로드
        let contextMessage = "";
        let currentSessionId = sessionId || "default-session";
        let sessionData: any = null;

        if (currentUserId !== 'anonymous-user') {
            const { data } = await supabase
                .from('malroda_session_contexts')
                .select('last_context')
                .eq('session_id', currentSessionId)
                .maybeSingle();
            sessionData = data;

            if (sessionData && sessionData.last_context) {
                contextMessage = `\n\n[이전 대화 맥락]\n사용자의 바로 이전 의도는 '${sessionData.last_context.intent}' 였으며, 다뤘던 핵심 주제(entity)는 ${JSON.stringify(sessionData.last_context.entities)} 였습니다. 이번 질문이 짧거나 생략된 경우(예: '사과는?'), 이전 대화 맥락을 반드시 참고하여 의도(intent)를 추론하세요.`;
            }
        }

        let currentFarmId: string | null = null;
        if (currentUserId !== 'anonymous-user') {
            const { data: member, error: memberError } = await supabase
                .from('malroda_farm_members')
                .select('farm_id')
                .eq('user_id', currentUserId)
                .single();

            console.log(`[Debug] User ID: ${currentUserId}`);
            console.log(`[Debug] Farm Member Query Result:`, member);
            console.log(`[Debug] Farm Member Query Error:`, memberError);

            if (member?.farm_id) currentFarmId = member.farm_id;
        }

        console.log(`[Debug] Final Farm ID: ${currentFarmId}`);

        // 1. 분류 (Intent & Entity Extraction)
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: ROUTER_SYSTEM_PROMPT + contextMessage },
                { role: "user", content: text }
            ],
            response_format: { type: "json_object" },
            temperature: 0.1,
        });

        const resultText = response.choices[0].message.content;
        const resultJson = JSON.parse(resultText || "{}");
        resultJson.original_text = text;

        // 2. 하이브리드 비즈니스 로직 연계
        let actionResult = null;

        if (resultJson.intent === 'INVENTORY_UPDATE') {
            console.log("[Trigger Hybrid Action]: Write Preview (Tool Calling via RPC)");
            // 1) 프리뷰 모드로 먼저 호출
            actionResult = await processInventoryUpdate(currentUserId, resultJson.entities, text, true);
            resultJson.reply = actionResult.message;

            // 2) 작업 대기 상태(pending)로 세션에 저장
            if (actionResult.success && actionResult.isPreview) {
                resultJson.is_pending = true;
            }
        }
        else if (resultJson.intent === 'CONFIRMATION') {
            // 직전 컨텍스트 확인
            let sessionData = null;
            if (currentUserId !== 'anonymous-user') {
                const { data } = await supabase
                    .from('malroda_session_contexts')
                    .select('last_context')
                    .eq('session_id', currentSessionId)
                    .maybeSingle();
                sessionData = data;
            }

            if (sessionData && sessionData.last_context && sessionData.last_context.is_pending) {
                console.log("[Trigger Hybrid Action]: Execute Pending Write");
                const pendingEntities = sessionData.last_context.entities;
                actionResult = await processInventoryUpdate(currentUserId, pendingEntities, text, false);
                resultJson.reply = actionResult.message;
                resultJson.is_pending = false; // 작업 완료됨
            } else {
                resultJson.reply = "현재 진행 중인 작업이 없습니다.";
            }
        }
        else if (resultJson.intent === 'CANCELLATION') {
            console.log("[Trigger Hybrid Action]: Cancel Pending Write");
            resultJson.reply = "네, 알겠습니다. 작업을 취소했습니다.";
            resultJson.is_pending = false;
        }
        else if (resultJson.intent === 'INVENTORY_QUERY') {
            console.log("[Trigger Hybrid Action]: Read (NL2SQL Querying)");
            actionResult = await processInventoryQuery(text, currentFarmId);
            resultJson.reply = actionResult.message;
        }
        else if (resultJson.intent === 'MARKET_PRICE') {
            console.log("[Trigger Hybrid Action]: Market Price (Public API Integration)");
            actionResult = await processMarketPrice(text, resultJson.entities);
            resultJson.reply = actionResult.message;
        }
        else if (resultJson.intent === 'GENERAL_SUPPORT' || resultJson.intent === 'BUYER_MATCHING') {
            // General conversation handler
            console.log(`[General Support]: ${resultJson.intent}`);
            const generalResponse = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "당신은 '말로다(MALRODA)' 시스템의 친절한 AI 비서입니다. 농부님의 질문에 친절하고 간결하게 답변하세요. 재고 관리, 입출고, 시세 조회 등의 기능을 안내해 줄 수 있습니다. 한국어로 대답하세요."
                    },
                    { role: "user", content: text }
                ],
                temperature: 0.7,
            });
            resultJson.reply = generalResponse.choices[0].message.content || "안녕하세요! 무엇을 도와드릴까요?";
        }
        else {
            console.log(`[Unhandled Intent]: ${resultJson.intent}`);
            resultJson.reply = "죄송합니다, 해당 기능은 아직 준비 중입니다. 재고 조회, 입출고, 시세 조회 기능을 이용해 보세요.";
        }

        resultJson.action_result = actionResult;

        // Add visualization hint for frontend
        resultJson.visualization_hint = detectVisualizationType(actionResult?.data || null);

        // 3. 현재 컨텍스트 저장 (다음 대화를 위해)
        if (currentUserId !== 'anonymous-user') {
            // CONFIRMATION 등 엔티티가 없는 경우 이전 맥락 유지
            let entitiesToSave = resultJson.entities;
            if (resultJson.intent === 'CONFIRMATION' || resultJson.intent === 'CANCELLATION') {
                if (sessionData && sessionData.last_context && sessionData.last_context.entities) {
                    entitiesToSave = sessionData.last_context.entities;
                }
            }

            // 의도가 업데이트/확인/취소가 아닌 아예 다른 주제라면 pending 상태를 초기화
            let isPendingToSave = resultJson.is_pending || false;
            const relevantIntents = ['INVENTORY_UPDATE', 'CONFIRMATION', 'CANCELLATION'];
            if (!relevantIntents.includes(resultJson.intent)) {
                isPendingToSave = false;
            }

            await supabase
                .from('malroda_session_contexts')
                .upsert({
                    user_id: currentUserId,
                    session_id: currentSessionId,
                    last_context: {
                        intent: resultJson.intent,
                        entities: entitiesToSave,
                        is_pending: isPendingToSave
                    },
                    updated_at: new Date().toISOString()
                }, { onConflict: 'session_id' });
        }

        return NextResponse.json(resultJson, { status: 200 });
    } catch (error) {
        console.error("[Router Error]:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
