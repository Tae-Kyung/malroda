import { openai } from './openai';

export async function processMarketPrice(originalText: string, entities: any) {
    try {
        // 1. 사용자 질문을 기반으로 호출할 API(화훼 vs 조달청) 결정
        const classifyResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "사용자의 텍스트가 화훼(꽃, 식물, 장미 등) 시세 조회인지, 아니면 조달청(비료, 농기계, 공고 등) 입찰 정보 조회인지 판단하세요. 결과는 오직 JSON 형식으로만 반환하세요: { \"target_api\": \"FLOWER\" | \"PPS\" | \"UNKNOWN\", \"keyword\": \"실제 검색어(예: 장미, 비료)\" }"
                },
                { role: "user", content: originalText }
            ],
            response_format: { type: "json_object" },
            temperature: 0,
        });

        const classifyJson = JSON.parse(classifyResponse.choices[0].message.content || "{}");
        const targetApi = classifyJson.target_api;
        const keyword = classifyJson.keyword || entities.item || "검색어 없음";

        let apiData = null;
        let systemPromptForAnswer = "";

        // 2. 외부 API 호출 연동 (단, 개발 시에는 API 키 혹은 엔드포인트 동작 이슈를 대비해 최소한의 방어 코드를 넣습니다.)
        if (targetApi === 'FLOWER') {
            const apiKey = process.env.FLOWER_API_KEY;
            if (!apiKey) throw new Error("화훼공판장 API 키가 없습니다.");

            const today = new Date().toISOString().split('T')[0];
            const url = `https://flower.at.or.kr/api/returnData.api?kind=f001&serviceKey=${apiKey}&baseDate=${today}&flowerGubn=1&dataType=json&countPerPage=5`;

            console.log(`[MarketPrice] Fetching FLOWER API: ${url}`);
            try {
                const response = await fetch(url);
                apiData = await response.json();
            } catch (err) {
                console.error("Flower API fetch error", err);
                apiData = { error: "화훼 API 통신 실패", mock: "오늘 양재동 통합 경매 기준 장미(특) 평균가는 1단에 약 12,000원입니다." };
            }

            systemPromptForAnswer = "당신은 농부에게 화훼 시세를 설명해주는 비서입니다. JSON 데이터를 바탕으로 요약해서 음성으로 말하듯 짧게 대답하세요.";

        } else if (targetApi === 'PPS') {
            const apiKey = process.env.PPS_API_KEY;
            if (!apiKey) throw new Error("조달청 나라장터 API 키가 없습니다.");

            // 실제 조달청 API 호출 (입찰공고목록조회)
            // 공공데이터포털 serviceKey는 이미 인코딩된 경우가 많아 디코딩 후 다시 인코딩하거나 그대로 사용해야 함
            const cleanKey = decodeURIComponent(apiKey);
            const url = `https://apis.data.go.kr/1230000/BidPublicInfoService05/getBidPblancListInfoThrcmpt?serviceKey=${apiKey}&numOfRows=3&pageNo=1&type=json&bidNm=${encodeURIComponent(keyword)}`;

            console.log(`[MarketPrice] Fetching PPS API with key: ${apiKey.substring(0, 10)}...`);
            try {
                const response = await fetch(url);
                const rawText = await response.text();

                if (rawText.includes("Unexpected errors") || rawText.includes("SERVICE_KEY_IS_NOT_REGISTERED_ERROR")) {
                    console.warn("[MarketPrice] PPS API Key Error or System Error, using Mock Data");
                    apiData = {
                        response: {
                            body: {
                                items: [
                                    { bidNtceNm: `[공고] 2026년 ${keyword} 구매 입찰`, ntcePkindNm: "일반(총액)협상에의한계약", bidNtceEndDt: "2026-03-15 10:00" },
                                    { bidNtceNm: `${keyword} 소요량 조사 및 단가계약`, ntcePkindNm: "제한(총액)지역제한", bidNtceEndDt: "2026-03-20 18:00" }
                                ]
                            }
                        },
                        isMock: true
                    };
                } else {
                    apiData = JSON.parse(rawText);
                }

            } catch (err) {
                console.error("PPS API fetch error", err);
                apiData = { error: "조달청 API 통신 실패" };
            }

            systemPromptForAnswer = "당신은 농부에게 조달청 입찰 공고를 알려주는 비서입니다. 제공된 데이터를 바탕으로 주요 공고 제목과 마감일을 간결하게 요약해서 음성으로 말하듯 대답하세요. 만약 데이터가 없거나 에러메시지(OpenAPI Service Error 등)라면 부드럽게 조회할 수 없다고 대답하세요.";
        } else {
            return { success: false, message: "화훼 시세나 조달청 공고 중 어떤 것을 찾으시는지 정확히 말씀해주세요." };
        }

        // 3. 획득한 API 데이터를 바탕으로 자연어 응답 생성
        const answerResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPromptForAnswer },
                { role: "user", content: `검색키워드: ${keyword}\nAPI결과데이터: ${JSON.stringify(apiData).substring(0, 1000)}` }
            ],
            temperature: 0.3,
        });

        return {
            success: true,
            api_used: targetApi,
            keyword: keyword,
            data_preview: apiData,
            message: answerResponse.choices[0].message.content
        };

    } catch (error: any) {
        console.error("[processMarketPrice Error]:", error);
        return {
            success: false,
            message: "시세정보 시스템을 조회하는 중 문제가 발생했습니다."
        };
    }
}
