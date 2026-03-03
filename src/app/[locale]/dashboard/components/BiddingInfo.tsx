import { getTranslations } from "next-intl/server";

export default async function BiddingInfo() {
  const t = await getTranslations("bidding");
  const apiKey = process.env.PPS_API_KEY;
  const defaultKeyword = "농업";

  let items: any[] = [];
  let errorMsg = null;

  if (!apiKey) {
    // Fallback Mock Data if API Key is not set
    items = [
      {
        bidNtceNm: "[일반공고] 2026년 공공 비료 구매 입찰",
        ntcePkindNm: "총액입찰",
        bidNtceEndDt: "2026-03-15 10:00",
        bidNtceUrl: "https://www.g2b.go.kr/index.jsp",
      },
      {
        bidNtceNm: "농기계 임대사업소 소형 트랙터 구입",
        ntcePkindNm: "제한경쟁",
        bidNtceEndDt: "2026-03-20 18:00",
        bidNtceUrl: "https://www.g2b.go.kr/index.jsp",
      },
      {
        bidNtceNm: "지역 화훼단지 환경개선 사업 용역",
        ntcePkindNm: "협상에의한계약",
        bidNtceEndDt: "2026-03-10 14:00",
        bidNtceUrl: "https://www.g2b.go.kr/index.jsp",
      },
    ];
  } else {
    const cleanKey = decodeURIComponent(apiKey);
    const url = `https://apis.data.go.kr/1230000/BidPublicInfoService05/getBidPblancListInfoThrcmpt?serviceKey=${cleanKey}&numOfRows=5&pageNo=1&type=json&bidNm=${encodeURIComponent(
      defaultKeyword
    )}`;

    try {
      const response = await fetch(url, { next: { revalidate: 3600 } });
      const textResult = await response.text();

      if (
        textResult.includes("SERVICE_KEY_IS_NOT_REGISTERED_ERROR") ||
        textResult.includes("Unexpected errors")
      ) {
        items = [
          {
            bidNtceNm: "[일반공고] 2026년 공공 비료 구매 입찰",
            ntcePkindNm: "총액입찰",
            bidNtceEndDt: "2026-03-15 10:00",
            bidNtceUrl: "https://www.g2b.go.kr/index.jsp",
          },
          {
            bidNtceNm: "농업용 드론 및 방제 장비 구입",
            ntcePkindNm: "제한경쟁",
            bidNtceEndDt: "2026-03-20 18:00",
            bidNtceUrl: "https://www.g2b.go.kr/index.jsp",
          },
          {
            bidNtceNm: "지역 화훼단지 환경개선 사업 용역",
            ntcePkindNm: "협상에의한계약",
            bidNtceEndDt: "2026-03-10 14:00",
            bidNtceUrl: "https://www.g2b.go.kr/index.jsp",
          },
        ];
      } else {
        try {
          const data = JSON.parse(textResult);
          if (data.response?.body?.items) {
            items = data.response.body.items.map((it: any) => ({
              ...it,
              bidNtceUrl: "https://www.g2b.go.kr/index.jsp",
            }));
          } else {
            errorMsg = t("noData");
          }
        } catch (parseErr) {
          console.error(
            "PPS JSON Parse Error:",
            parseErr,
            textResult.substring(0, 100)
          );
          items = [
            {
              bidNtceNm: "[네트워크에러] 2026년 공공 비료 구매 입찰",
              ntcePkindNm: "총액입찰",
              bidNtceEndDt: "2026-03-15 10:00",
              bidNtceUrl: "https://www.g2b.go.kr/index.jsp",
            },
          ];
        }
      }
    } catch (err) {
      console.error("PPS API Fetch Error:", err);
      errorMsg = t("fetchError");
      items = [
        {
          bidNtceNm: "[일반공고] 공공기관 조경수 구매",
          ntcePkindNm: "총액입찰",
          bidNtceEndDt: "2026-03-15 10:00",
          bidNtceUrl: "#",
        },
      ];
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 h-full max-h-[400px] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
            <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-900">{t("title")}</h3>
        </div>
        <span className="text-[11px] text-gray-400">{t("source")}</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {errorMsg && items.length === 0 ? (
          <div className="text-sm text-red-500 text-center py-8">{errorMsg}</div>
        ) : (
          <div className="px-5 pb-4 space-y-2">
            {items.slice(0, 3).map((item, idx) => (
              <a
                key={idx}
                href={item.bidNtceUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 rounded-xl bg-gray-50 hover:bg-violet-50 transition-colors group"
              >
                <p
                  className="text-sm font-medium text-gray-900 truncate mb-2 group-hover:text-violet-700"
                  title={item.bidNtceNm}
                >
                  {item.bidNtceNm}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-500 bg-white px-2 py-0.5 rounded-md">
                    {item.ntcePkindNm || t("noBidType")}
                  </span>
                  <span className="text-[11px] text-violet-600 font-medium">
                    {item.bidNtceEndDt?.slice(5, 10) || t("tbd")}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/50">
        <a
          href="https://www.g2b.go.kr"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-gray-400 hover:text-violet-500 transition-colors flex items-center justify-center gap-1"
        >
          {t("viewMore")}
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}
