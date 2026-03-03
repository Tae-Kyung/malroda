import MarketPriceChart from "./MarketPriceChart";

interface MarketItem {
  pumName: string;
  lvNm: string;
  avgAmt: string;
  goodName?: string;
}

export default async function MarketPriceChartWrapper() {
  const apiKey = process.env.FLOWER_API_KEY;
  const today = new Date().toISOString().split("T")[0];
  const url = `https://flower.at.or.kr/api/returnData.api?kind=f001&serviceKey=${apiKey}&baseDate=${today}&flowerGubn=1&dataType=json&countPerPage=10`;

  let items: MarketItem[] = [];

  if (apiKey) {
    try {
      const response = await fetch(url, { next: { revalidate: 3600 } });
      const data = await response.json();

      if (data.response && data.response.items) {
        items = data.response.items;
      } else if (data.response && data.response.item) {
        items = Array.isArray(data.response.item)
          ? data.response.item
          : [data.response.item];
      } else if (Array.isArray(data)) {
        items = data;
      }

      if (
        items.length === 0 &&
        data.response &&
        data.response.body &&
        data.response.body.items &&
        data.response.body.items.item
      ) {
        items = data.response.body.items.item;
      }
    } catch (err) {
      console.error("Flower API Fetch Error:", err);
    }
  }

  // Mock data fallback
  if (items.length === 0) {
    items = [
      { pumName: "장미 (품종 혼합)", lvNm: "특", avgAmt: "12,500" },
      { pumName: "국화 (대국)", lvNm: "상", avgAmt: "8,200" },
      { pumName: "안개꽃", lvNm: "상", avgAmt: "15,000" },
      { pumName: "튤립", lvNm: "특", avgAmt: "9,800" },
      { pumName: "백합", lvNm: "특", avgAmt: "18,500" },
      { pumName: "카네이션", lvNm: "상", avgAmt: "7,200" },
    ];
  }

  return <MarketPriceChart items={items} date={today} />;
}
