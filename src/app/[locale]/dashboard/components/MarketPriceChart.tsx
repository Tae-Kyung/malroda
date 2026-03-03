"use client";

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
}

interface MarketPriceChartProps {
  items: MarketItem[];
  date: string;
}

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#3b82f6", "#ec4899"];

// Bar Chart Component
function BarChartCard({ chartData, t }: { chartData: ChartData[]; t: any }) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{data.fullName}</p>
          <p className="text-sm text-gray-500">{t("grade")}: {data.grade}</p>
          <p className="text-sm font-bold text-emerald-600">
            {data.price.toLocaleString()} {t("currency")}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b border-gray-100 flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-5 h-5 text-emerald-500"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
          />
        </svg>
        <h3 className="text-base font-semibold text-gray-900">{t("barChartTitle")}</h3>
      </div>
      <div className="p-4 flex-1">
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: "#6b7280" }}
                angle={-25}
                textAnchor="end"
                height={50}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#6b7280" }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="price" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// Pie Chart Component
function PieChartCard({ chartData, t }: { chartData: ChartData[]; t: any }) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{data.fullName}</p>
          <p className="text-sm text-gray-500">{t("grade")}: {data.grade}</p>
          <p className="text-sm font-bold text-emerald-600">
            {data.price.toLocaleString()} {t("currency")}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
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
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b border-gray-100 flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-5 h-5 text-purple-500"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z"
          />
        </svg>
        <h3 className="text-base font-semibold text-gray-900">{t("pieChartTitle")}</h3>
      </div>
      <div className="p-4 flex-1">
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="45%"
                labelLine={false}
                label={CustomPieLabel}
                outerRadius={65}
                dataKey="price"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: "10px" }}
                formatter={(value, entry: any) => (
                  <span className="text-[10px] text-gray-600">{entry.payload.fullName}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default function MarketPriceChart({ items, date }: MarketPriceChartProps) {
  const t = useTranslations("market");

  // Transform data for charts
  const chartData = items.map((item, idx) => ({
    name: item.pumName.length > 8 ? item.pumName.substring(0, 8) + "..." : item.pumName,
    fullName: item.pumName,
    price: Number(item.avgAmt?.replace(/,/g, "") || 0),
    grade: item.lvNm,
    color: COLORS[idx % COLORS.length],
  }));

  const highestPrice = Math.max(...chartData.map((d) => d.price));
  const averagePrice = Math.round(chartData.reduce((sum, d) => sum + d.price, 0) / chartData.length);
  const itemCount = chartData.length;

  return (
    <div className="space-y-4">
      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BarChartCard chartData={chartData} t={t} />
        <PieChartCard chartData={chartData} t={t} />
      </div>

      {/* Shared Stats & Footer */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-emerald-50 rounded-lg p-3 text-center">
            <p className="text-xs text-emerald-600 font-medium">{t("highest")}</p>
            <p className="text-lg font-bold text-emerald-700">
              {highestPrice.toLocaleString()}
            </p>
            <p className="text-[10px] text-emerald-500">{t("currency")}</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 text-center">
            <p className="text-xs text-amber-600 font-medium">{t("average")}</p>
            <p className="text-lg font-bold text-amber-700">
              {averagePrice.toLocaleString()}
            </p>
            <p className="text-[10px] text-amber-500">{t("currency")}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-xs text-blue-600 font-medium">{t("items")}</p>
            <p className="text-lg font-bold text-blue-700">{itemCount}</p>
            <p className="text-[10px] text-blue-500">{t("types")}</p>
          </div>
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-3">
          {t("source")} | {t("asOf", { date })}
        </p>
      </div>
    </div>
  );
}
