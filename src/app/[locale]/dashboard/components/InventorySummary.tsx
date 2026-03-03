"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useFarm } from "@/contexts/FarmContext";

interface InventoryItem {
  name: string;
  stock: number;
}

export default function InventorySummary() {
  const { currentFarm, isLoading: farmLoading } = useFarm();
  const t = useTranslations("inventory");
  const [topItems, setTopItems] = useState<InventoryItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalStock, setTotalStock] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInventory = async () => {
      if (!currentFarm?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const supabase = createClient();

      const { data: summary } = await supabase
        .from("v_malroda_inventory_summary")
        .select("item_name, current_stock")
        .eq("farm_id", currentFarm.id);

      // Calculate totals
      const itemMap = new Map<string, number>();
      let total = 0;

      if (summary) {
        summary.forEach((item) => {
          if (item.current_stock > 0) {
            const current = itemMap.get(item.item_name) || 0;
            itemMap.set(item.item_name, current + item.current_stock);
            total += item.current_stock;
          }
        });
      }

      // Sort to get top 5 items
      const sorted = Array.from(itemMap.entries())
        .map(([name, stock]) => ({ name, stock }))
        .sort((a, b) => b.stock - a.stock)
        .slice(0, 5);

      setTopItems(sorted);
      setTotalItems(itemMap.size);
      setTotalStock(total);
      setIsLoading(false);
    };

    fetchInventory();
  }, [currentFarm?.id]);

  if (farmLoading || isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 h-full max-h-[400px] flex flex-col overflow-hidden animate-pulse">
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="h-8 w-32 bg-gray-200 rounded" />
          <div className="h-5 w-16 bg-gray-200 rounded" />
        </div>
        <div className="flex-1 px-5 pb-4">
          <div className="h-20 bg-gray-100 rounded-xl mb-3" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!currentFarm) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 h-full max-h-[400px] flex items-center justify-center">
        <p className="text-sm text-gray-500">{t("noFarm")}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 h-full max-h-[400px] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-900">{t("title")}</h3>
        </div>
        <span className="text-[11px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-md">
          {t("itemCount", { count: totalItems })}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 pb-4">
          {/* Total Stock Summary */}
          <div className="p-3 rounded-xl bg-emerald-50 mb-3">
            <p className="text-[11px] text-emerald-600 mb-0.5">{t("totalStock")}</p>
            <p className="text-2xl font-bold text-emerald-700">
              {totalStock.toLocaleString()}
            </p>
          </div>

          {/* Top Items */}
          {topItems.length > 0 ? (
            <div className="space-y-2">
              {topItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {item.name}
                  </span>
                  <span className="text-sm font-semibold text-emerald-600 ml-3">
                    {item.stock.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-400 text-center py-8">
              {t("noInventory")}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/50">
        <Link
          href="/dashboard/settings"
          className="text-[11px] text-gray-400 hover:text-emerald-500 transition-colors flex items-center justify-center gap-1"
        >
          {t("manageAll")}
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
