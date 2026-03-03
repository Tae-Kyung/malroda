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
        bidNtceUrl:
          "https://www.g2b.go.kr/pt/menu/selectSubFrame.do?framesrc=/pt/menu/frameTgong.do?count=1&선택박스=1&s_id=81&gonggoNo=20240212345",
      },
      {
        bidNtceNm: "농기계 임대사업소 소형 트랙터 구입",
        ntcePkindNm: "제한경쟁",
        bidNtceEndDt: "2026-03-20 18:00",
        bidNtceUrl:
          "https://www.g2b.go.kr/pt/menu/selectSubFrame.do?framesrc=/pt/menu/frameTgong.do?count=1&선택박스=1&s_id=81&gonggoNo=20240323456",
      },
      {
        bidNtceNm: "지역 화훼단지 환경개선 사업 용역",
        ntcePkindNm: "협상에의한계약",
        bidNtceEndDt: "2026-03-10 14:00",
        bidNtceUrl:
          "https://www.g2b.go.kr/pt/menu/selectSubFrame.do?framesrc=/pt/menu/frameTgong.do?count=1&선택박스=1&s_id=81&gonggoNo=20240298765",
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
      <div className="p-5 border-b border-gray-100 flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-5 h-5 text-indigo-500"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900">{t("title")}</h3>
        <span className="ml-auto text-xs text-gray-400">{t("source")}</span>
      </div>

      <div className="p-5 flex-1 p-0 overflow-y-auto max-h-64">
        {errorMsg && items.length === 0 ? (
          <div className="text-sm text-red-500 text-center py-4">
            {errorMsg}
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {items.slice(0, 4).map((item, idx) => (
              <li
                key={idx}
                className="p-4 hover:bg-indigo-50 transition-colors flex flex-col"
              >
                <a
                  href={item.bidNtceUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full"
                >
                  <h4
                    className="text-sm font-medium text-gray-900 mb-1 truncate"
                    title={item.bidNtceNm}
                  >
                    {item.bidNtceNm}
                  </h4>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {item.ntcePkindNm || t("noBidType")}
                    </span>
                    <span>
                      {t("deadline")}:{" "}
                      <span className="text-indigo-600 font-medium">
                        {item.bidNtceEndDt?.slice(0, 16) || t("tbd")}
                      </span>
                    </span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
