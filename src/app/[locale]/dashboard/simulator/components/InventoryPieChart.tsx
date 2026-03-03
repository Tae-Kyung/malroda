"use client";

import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
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

interface InventoryPieChartProps {
  data: InventoryItem[];
}

export default function InventoryPieChart({ data }: InventoryPieChartProps) {
  const t = useTranslations("simulator.visualization");

  const chartData = data.map((item, idx) => ({
    name: item.item_name.length > 8
      ? item.item_name.substring(0, 8) + "..."
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

  const CustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Hide labels for small slices

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-[10px] font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="h-full min-h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={100}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: "9px" }}
            formatter={(value, entry: any) => (
              <span className="text-[9px] text-gray-600">
                {entry.payload.fullName}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
