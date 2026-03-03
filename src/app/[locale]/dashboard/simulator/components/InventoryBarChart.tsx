"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useTranslations } from "next-intl";

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#3b82f6", "#ec4899"];

interface InventoryItem {
  item_name: string;
  current_stock: number;
  zone?: string;
  grade?: string;
  unit?: string;
}

interface InventoryBarChartProps {
  data: InventoryItem[];
}

export default function InventoryBarChart({ data }: InventoryBarChartProps) {
  const t = useTranslations("simulator.visualization");

  const chartData = data.map((item, idx) => ({
    name: item.item_name.length > 6
      ? item.item_name.substring(0, 6) + "..."
      : item.item_name,
    fullName: item.item_name,
    value: item.current_stock,
    zone: item.zone || "-",
    grade: item.grade || "-",
    unit: item.unit || "pcs",
    color: COLORS[idx % COLORS.length],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{data.fullName}</p>
          <p className="text-xs text-gray-500">
            {t("zone")}: {data.zone} | {t("grade")}: {data.grade}
          </p>
          <p className="text-sm font-bold text-emerald-600">
            {data.value.toLocaleString()} {data.unit}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full min-h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -15, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 9, fill: "#6b7280" }}
            angle={-25}
            textAnchor="end"
            height={40}
          />
          <YAxis
            tick={{ fontSize: 9, fill: "#6b7280" }}
            tickFormatter={(value) =>
              value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value
            }
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
