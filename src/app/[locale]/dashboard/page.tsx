import { createClient } from "@/utils/supabase/server";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import InventorySummary from "./components/InventorySummary";
import MarketPrices from "./components/MarketPrices";
import BiddingInfo from "./components/BiddingInfo";
import MarketPriceChart from "./components/MarketPriceChart";

interface MarketItem {
  pumName: string;
  lvNm: string;
  avgAmt: string;
  goodName?: string;
}

async function fetchMarketData(): Promise<MarketItem[]> {
  const apiKey = process.env.FLOWER_API_KEY;
  const today = new Date().toISOString().split("T")[0];
  const url = `https://flower.at.or.kr/api/returnData.api?kind=f001&serviceKey=${apiKey}&baseDate=${today}&flowerGubn=1&dataType=json&countPerPage=6`;

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

  return items;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const t = await getTranslations();

  // Fetch market data once for both components
  const marketItems = await fetchMarketData();
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Welcome Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-semibold text-gray-900">
            {t("dashboard.welcome")}
          </h1>
        </div>
        <p className="text-gray-500 text-sm">
          {t("dashboard.welcomeSubtitle")}
        </p>
      </div>

      {/* Quick Actions - Visual Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
        {/* Simulator Card */}
        <Link href="/dashboard/simulator" className="group">
          <div className="relative h-48 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 transition-all hover:shadow-xl hover:shadow-emerald-100 hover:-translate-y-1">
            {/* Illustration */}
            <div className="absolute right-0 bottom-0 w-40 h-40 opacity-90">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                {/* Chat bubbles illustration */}
                <defs>
                  <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#14b8a6" />
                  </linearGradient>
                </defs>
                {/* Main bubble */}
                <rect x="60" y="80" width="100" height="70" rx="16" fill="url(#emeraldGrad)" opacity="0.9"/>
                {/* Dots */}
                <circle cx="90" cy="115" r="6" fill="white" opacity="0.9"/>
                <circle cx="110" cy="115" r="6" fill="white" opacity="0.9"/>
                <circle cx="130" cy="115" r="6" fill="white" opacity="0.9"/>
                {/* Small bubble */}
                <rect x="30" y="50" width="60" height="40" rx="12" fill="#d1fae5"/>
                {/* Floating elements */}
                <circle cx="170" cy="40" r="15" fill="#a7f3d0" opacity="0.6"/>
                <circle cx="40" cy="130" r="10" fill="#6ee7b7" opacity="0.4"/>
                {/* AI sparkle */}
                <path d="M150 60 L155 70 L165 75 L155 80 L150 90 L145 80 L135 75 L145 70 Z" fill="#fbbf24" opacity="0.8"/>
              </svg>
            </div>

            {/* Content */}
            <div className="relative px-7 pt-6 pb-7 h-full flex flex-col justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500 text-white text-xs font-medium rounded-full w-fit mb-3">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                  </svg>
                  AI
                </span>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {t("dashboard.quickStart.simulator.title")}
                </h3>
                <p className="text-gray-500 text-sm max-w-[200px] leading-relaxed">
                  {t("dashboard.quickStart.simulator.description")}
                </p>
              </div>
              <div className="inline-flex items-center gap-1 text-emerald-600 text-sm font-medium group-hover:gap-2 transition-all">
                {t("dashboard.quickStart.simulator.button")}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </div>
        </Link>

        {/* Settings Card */}
        <Link href="/dashboard/settings" className="group">
          <div className="relative h-48 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-gray-100 border border-gray-200 transition-all hover:shadow-xl hover:shadow-gray-200 hover:-translate-y-1">
            {/* Illustration */}
            <div className="absolute right-0 bottom-0 w-40 h-40 opacity-90">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                {/* Gear illustration */}
                <defs>
                  <linearGradient id="slateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#475569" />
                    <stop offset="100%" stopColor="#334155" />
                  </linearGradient>
                </defs>
                {/* Main gear */}
                <g transform="translate(100, 110)">
                  <path d="M0,-45 L8,-40 L8,-30 L18,-25 L25,-35 L35,-25 L25,-18 L30,-8 L40,-8 L40,8 L30,8 L25,18 L35,25 L25,35 L18,25 L8,30 L8,40 L-8,40 L-8,30 L-18,25 L-25,35 L-35,25 L-25,18 L-30,8 L-40,8 L-40,-8 L-30,-8 L-25,-18 L-35,-25 L-25,-35 L-18,-25 L-8,-30 L-8,-40 Z" fill="url(#slateGrad)" opacity="0.8"/>
                  <circle cx="0" cy="0" r="15" fill="#f1f5f9"/>
                </g>
                {/* Small gear */}
                <g transform="translate(55, 60) scale(0.4)">
                  <path d="M0,-45 L8,-40 L8,-30 L18,-25 L25,-35 L35,-25 L25,-18 L30,-8 L40,-8 L40,8 L30,8 L25,18 L35,25 L25,35 L18,25 L8,30 L8,40 L-8,40 L-8,30 L-18,25 L-25,35 L-35,25 L-25,18 L-30,8 L-40,8 L-40,-8 L-30,-8 L-25,-18 L-35,-25 L-25,-35 L-18,-25 L-8,-30 L-8,-40 Z" fill="#94a3b8" opacity="0.6"/>
                </g>
                {/* Decorative dots */}
                <circle cx="170" cy="50" r="8" fill="#cbd5e1" opacity="0.5"/>
                <circle cx="40" cy="140" r="12" fill="#e2e8f0" opacity="0.6"/>
                <circle cx="160" cy="160" r="6" fill="#94a3b8" opacity="0.4"/>
                {/* Sliders */}
                <rect x="30" y="85" width="45" height="6" rx="3" fill="#e2e8f0"/>
                <circle cx="55" cy="88" r="8" fill="#64748b"/>
              </svg>
            </div>

            {/* Content */}
            <div className="relative px-7 pt-6 pb-7 h-full flex flex-col justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-200 text-gray-600 text-xs font-medium rounded-full w-fit mb-3">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  Setup
                </span>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {t("dashboard.quickStart.settings.title")}
                </h3>
                <p className="text-gray-500 text-sm max-w-[200px] leading-relaxed">
                  {t("dashboard.quickStart.settings.description")}
                </p>
              </div>
              <div className="inline-flex items-center gap-1 text-gray-700 text-sm font-medium group-hover:gap-2 transition-all">
                {t("dashboard.quickStart.settings.button")}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Section Label */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-4 bg-emerald-500 rounded-full" />
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
          Overview
        </h2>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        <InventorySummary />
        <MarketPrices items={marketItems} date={today} />
        <BiddingInfo />
      </div>

      {/* Market Price Visualization */}
      <div className="mb-6">
        <MarketPriceChart items={marketItems} date={today} />
      </div>
    </div>
  );
}
