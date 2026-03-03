import { getTranslations } from "next-intl/server";

interface MarketItem {
  pumName: string;
  lvNm: string;
  avgAmt: string;
  goodName?: string;
}

interface MarketPricesProps {
  items: MarketItem[];
  date: string;
}

export default async function MarketPrices({ items, date }: MarketPricesProps) {
  const t = await getTranslations("market");

  return (
    <div className="bg-white rounded-2xl border border-gray-100 h-full max-h-[400px] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
            <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-900">{t("title")}</h3>
        </div>
        <span className="text-[11px] text-gray-400">{date}</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 pb-4 space-y-2">
          {items.slice(0, 6).map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {item.pumName}
                </p>
                <p className="text-xs text-gray-400">
                  {item.lvNm} {t("grade")}
                </p>
              </div>
              <div className="text-right ml-3">
                <p className="text-sm font-semibold text-rose-600">
                  ₩{Number(item.avgAmt?.replace(/,/g, "") || 0).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/50">
        <p className="text-[11px] text-gray-400 text-center">{t("source")}</p>
      </div>
    </div>
  );
}
