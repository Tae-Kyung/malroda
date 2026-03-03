"use client";

import { useTranslations } from "next-intl";
// import InventoryBarChart from "./InventoryBarChart";
// import InventoryPieChart from "./InventoryPieChart";
import InventoryTable from "./InventoryTable";

interface InventoryItem {
  item_name: string;
  current_stock: number;
  zone?: string;
  grade?: string;
  unit?: string;
}

interface VisualizationPanelProps {
  data: InventoryItem[] | null;
  vizType: "bar" | "pie" | "table" | "none" | null;
  isLoading: boolean;
}

export default function VisualizationPanel({
  data,
  vizType,
  isLoading,
}: VisualizationPanelProps) {
  const t = useTranslations("simulator.visualization");

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-[calc(100vh-12rem)] bg-white shadow-xl border border-gray-100 rounded-3xl overflow-hidden">
        <header className="bg-gradient-to-r from-purple-500 to-indigo-500 p-4 text-white shadow-md">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-white/30 rounded animate-pulse"></div>
            <div className="h-5 bg-white/30 rounded w-32 animate-pulse"></div>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center bg-gray-50/30">
          <div className="flex flex-col items-center gap-3">
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-ping"></div>
            <span className="text-sm text-gray-400">{t("loading")}</span>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!data || data.length === 0 || vizType === "none") {
    return (
      <div className="flex flex-col h-[calc(100vh-12rem)] bg-white shadow-xl border border-gray-100 rounded-3xl overflow-hidden">
        <header className="bg-gradient-to-r from-purple-500 to-indigo-500 p-4 text-white shadow-md">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <h2 className="font-bold tracking-tight">{t("title")}</h2>
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/30 p-10">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-12 h-12 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 className="text-gray-900 font-bold text-lg mb-2">{t("title")}</h3>
          <p className="text-gray-500 text-sm text-center max-w-xs">{t("empty")}</p>
        </div>
      </div>
    );
  }

  // Render chart based on type (bar and pie charts commented out - keeping only table)
  const renderChart = () => {
    // switch (vizType) {
    //   case "bar":
    //     return <InventoryBarChart data={data} />;
    //   case "pie":
    //     return <InventoryPieChart data={data} />;
    //   case "table":
    //     return <InventoryTable data={data} />;
    //   default:
    //     return <InventoryBarChart data={data} />;
    // }
    return <InventoryTable data={data} />;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-white shadow-xl border border-gray-100 rounded-3xl overflow-hidden">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-500 to-indigo-500 p-4 text-white shadow-md flex justify-between items-center">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h2 className="font-bold tracking-tight">{t("title")}</h2>
        </div>
        <span className="text-xs px-3 py-1 bg-white/20 backdrop-blur-md rounded-full border border-white/30 font-medium uppercase">
          {vizType}
        </span>
      </header>

      {/* Chart Area */}
      <main className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
        <div className="h-full bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {renderChart()}
        </div>
      </main>
    </div>
  );
}
