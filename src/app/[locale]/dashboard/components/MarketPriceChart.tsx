"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

interface MarketItem {
  pumName: string;
  lvNm: string;
  avgAmt: string;
  goodName?: string;
}

interface ChartData {
  name: string;
  fullName: string;
  price: number;
  grade: string;
  color: string;
  gradientId: string;
}

interface MarketPriceChartProps {
  items: MarketItem[];
  date: string;
}

const COLORS = [
  { main: "#10b981", light: "#34d399", gradient: "emerald" },
  { main: "#f59e0b", light: "#fbbf24", gradient: "amber" },
  { main: "#ec4899", light: "#f472b6", gradient: "pink" },
  { main: "#8b5cf6", light: "#a78bfa", gradient: "violet" },
  { main: "#3b82f6", light: "#60a5fa", gradient: "blue" },
  { main: "#ef4444", light: "#f87171", gradient: "red" },
];

export default function MarketPriceChart({ items, date }: MarketPriceChartProps) {
  const t = useTranslations("market");
  const [activeTab, setActiveTab] = useState<"bar" | "pie">("bar");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Transform data for charts
  const chartData: ChartData[] = items.map((item, idx) => ({
    name: item.pumName.length > 6 ? item.pumName.substring(0, 6) + "..." : item.pumName,
    fullName: item.pumName,
    price: Number(item.avgAmt?.replace(/,/g, "") || 0),
    grade: item.lvNm,
    color: COLORS[idx % COLORS.length].main,
    gradientId: `gradient-${idx}`,
  }));

  const highestPrice = Math.max(...chartData.map((d) => d.price));
  const averagePrice = Math.round(chartData.reduce((sum, d) => sum + d.price, 0) / chartData.length);
  const totalValue = chartData.reduce((sum, d) => sum + d.price, 0);
  const itemCount = chartData.length;

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.price / totalValue) * 100).toFixed(1);
      return (
        <div className="bg-white/95 backdrop-blur-sm px-4 py-3 shadow-xl rounded-xl border border-gray-100">
          <p className="font-semibold text-gray-900 text-sm">{data.fullName}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs text-gray-500">{t("grade")}:</span>
            <span className="text-xs font-medium text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
              {data.grade}
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-lg font-bold" style={{ color: data.color }}>
              {data.price.toLocaleString()}
            </span>
            <span className="text-xs text-gray-500">{t("currency")}</span>
          </div>
          <div className="text-[10px] text-gray-400 mt-1">
            {percentage}% {t("ofTotal")}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Pie Label
  const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    if (percent < 0.08) return null; // Hide label for small slices
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-[11px] font-semibold drop-shadow-sm"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Custom Legend
  const CustomLegend = ({ payload }: any) => (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2 px-2">
      {payload?.map((entry: any, index: number) => (
        <div
          key={index}
          className={`flex items-center gap-1.5 cursor-pointer transition-all ${
            hoveredIndex !== null && hoveredIndex !== index ? "opacity-40" : "opacity-100"
          }`}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-[11px] text-gray-600 truncate max-w-[80px]">
            {chartData[index]?.fullName}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Header with Tab Navigation */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{t("chartTitle")}</h3>
            <p className="text-[10px] text-gray-400">{t("asOf", { date })}</p>
          </div>
        </div>

        {/* Tab Pills */}
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setActiveTab("bar")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === "bar"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {t("barChart")}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("pie")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === "pie"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
              {t("pieChart")}
            </span>
          </button>
        </div>
      </div>

      {/* Chart Area */}
      <div className="p-5">
        <div className="h-64">
          {activeTab === "bar" ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -15, bottom: 30 }}
                onMouseMove={(state) => {
                  if (state.activeTooltipIndex !== undefined) {
                    setHoveredIndex(state.activeTooltipIndex);
                  }
                }}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <defs>
                  {chartData.map((entry, index) => (
                    <linearGradient
                      key={entry.gradientId}
                      id={entry.gradientId}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={COLORS[index % COLORS.length].light} />
                      <stop offset="100%" stopColor={COLORS[index % COLORS.length].main} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  angle={-35}
                  textAnchor="end"
                  height={50}
                  axisLine={{ stroke: "#e5e7eb" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                <Bar dataKey="price" radius={[6, 6, 0, 0]} maxBarSize={50}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`url(#${entry.gradientId})`}
                      opacity={hoveredIndex !== null && hoveredIndex !== index ? 0.4 : 1}
                      style={{ transition: "opacity 0.2s ease" }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart
                onMouseMove={(state) => {
                  if (state.activeTooltipIndex !== undefined) {
                    setHoveredIndex(state.activeTooltipIndex);
                  }
                }}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <defs>
                  {chartData.map((entry, index) => (
                    <linearGradient
                      key={`pie-${entry.gradientId}`}
                      id={`pie-${entry.gradientId}`}
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={COLORS[index % COLORS.length].light} />
                      <stop offset="100%" stopColor={COLORS[index % COLORS.length].main} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="45%"
                  labelLine={false}
                  label={CustomPieLabel}
                  innerRadius={45}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="price"
                  strokeWidth={0}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`url(#pie-${entry.gradientId})`}
                      opacity={hoveredIndex !== null && hoveredIndex !== index ? 0.4 : 1}
                      style={{ transition: "opacity 0.2s ease" }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-5 pb-4">
        <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[10px] text-gray-400 mb-0.5">{t("highest")}</p>
              <p className="text-sm font-semibold text-gray-900">
                {highestPrice.toLocaleString()} <span className="text-[10px] font-normal text-gray-400">{t("currency")}</span>
              </p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div>
              <p className="text-[10px] text-gray-400 mb-0.5">{t("average")}</p>
              <p className="text-sm font-semibold text-gray-900">
                {averagePrice.toLocaleString()} <span className="text-[10px] font-normal text-gray-400">{t("currency")}</span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 mb-0.5">{t("items")}</p>
            <p className="text-sm font-semibold text-gray-900">
              {itemCount} <span className="text-[10px] font-normal text-gray-400">{t("types")}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/50">
        <p className="text-[10px] text-gray-400 text-center flex items-center justify-center gap-2">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {t("liveData")}
          </span>
          <span>|</span>
          <span>{t("source")}</span>
        </p>
      </div>
    </div>
  );
}
