export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const payload = await req.json();

        console.log("[Kakao Webhook Received]:", JSON.stringify(payload, null, 2));

        const userMessage = payload.userRequest?.utterance || "";
        const userId = payload.userRequest?.user?.id || "unknown";

        // TODO: Send userMessage to Router Prompt (GPT) to classify intent
        // TODO: Perform Hybrid Action (Tool Calling for Update or NL2SQL for Query)

        // 임시 더미 응답 (카카오톡 챗봇 JSON 응답 포맷)
        const responseBody = {
            version: "2.0",
            template: {
                outputs: [
                    {
                        simpleText: {
                            text: `[임시 응답] 방금 "${userMessage}"라고 하셨군요! (사용자 ID: ${userId})`
                        }
                    }
                ]
            }
        };

        return new Response(JSON.stringify(responseBody), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error("[Kakao Webhook Error]:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
