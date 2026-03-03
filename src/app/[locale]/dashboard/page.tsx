import { createClient } from "@/utils/supabase/server";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import InventorySummary from "./components/InventorySummary";
import MarketPrices from "./components/MarketPrices";
import BiddingInfo from "./components/BiddingInfo";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const t = await getTranslations();

  return (
    <div className="px-4 py-8 sm:px-0">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {t("dashboard.welcome")}
          </h2>
          <p className="text-gray-500 text-sm">
            {t("dashboard.welcomeSubtitle")} <br />
          </p>
        </div>
        <div className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
          {user?.email}
        </div>
      </div>

      {/* Main Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-1">
          <InventorySummary userId={user?.id || ""} />
        </div>
        <div className="md:col-span-1">
          <MarketPrices />
        </div>
        <div className="md:col-span-1">
          <BiddingInfo />
        </div>
      </div>

      {/* Quick Start Section */}
      <div className="bg-white overflow-hidden shadow-sm rounded-2xl border border-gray-100">
        <div className="px-6 py-6 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            {t("dashboard.quickStart.title")}
          </h3>
        </div>
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100 transition-all hover:shadow-md">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-emerald-500 shadow-sm mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              {t("dashboard.quickStart.simulator.title")}
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              {t("dashboard.quickStart.simulator.description")}
            </p>
            <Link
              href="/dashboard/simulator"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700"
            >
              {t("dashboard.quickStart.simulator.button")}
            </Link>
          </div>

          <div className="bg-blue-50 rounded-xl p-6 border border-blue-100 transition-all hover:shadow-md">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-blue-500 shadow-sm mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
                />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              {t("dashboard.quickStart.settings.title")}
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              {t("dashboard.quickStart.settings.description")}
            </p>
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              {t("dashboard.quickStart.settings.button")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
