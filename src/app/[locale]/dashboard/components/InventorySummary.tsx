import { createClient } from "@/utils/supabase/server";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

export default async function InventorySummary({ userId }: { userId: string }) {
  const supabase = await createClient();
  const t = await getTranslations("inventory");

  // Get farm_id
  const { data: member } = await supabase
    .from("malroda_farm_members")
    .select("farm_id")
    .eq("user_id", userId)
    .single();

  let farmId = member?.farm_id;

  if (!farmId) {
    // Fallback for missing member record
    const { data: firstFarm } = await supabase
      .from("malroda_farms")
      .select("id")
      .limit(1)
      .single();
    if (firstFarm) farmId = firstFarm.id;
  }

  if (!farmId) return <div>{t("noFarm")}</div>;

  // Fetch grouped inventory
  const { data: summary } = await supabase
    .from("v_malroda_inventory_summary")
    .select("item_name, current_stock")
    .eq("farm_id", farmId);

  // Calculate totals
  const itemMap = new Map<string, number>();
  let totalItems = 0;
  let totalStock = 0;

  if (summary) {
    summary.forEach((item) => {
      if (item.current_stock > 0) {
        const current = itemMap.get(item.item_name) || 0;
        itemMap.set(item.item_name, current + item.current_stock);
        totalStock += item.current_stock;
      }
    });
    totalItems = itemMap.size;
  }

  // Sort to get top 5 items
  const topItems = Array.from(itemMap.entries())
    .map(([name, stock]) => ({ name, stock }))
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 5);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
      <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5 text-emerald-600"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
            />
          </svg>
          {t("title")}
        </h3>
        <span className="text-xs font-medium bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">
          {t("itemCount", { count: totalItems })}
        </span>
      </div>

      <div className="p-5 flex-1">
        <div className="flex justify-between items-end mb-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">{t("totalStock")}</p>
            <p className="text-3xl font-bold text-gray-900">
              {totalStock.toLocaleString()}
            </p>
          </div>
        </div>

        {topItems.length > 0 ? (
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
              {t("topItems")}
            </h4>
            <div className="space-y-3">
              {topItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="text-gray-700 font-medium truncate pr-4">
                    {item.name}
                  </span>
                  <span className="text-gray-900 font-semibold">
                    {item.stock.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500 text-sm">
            {t("noInventory")}
          </div>
        )}
      </div>

      <div className="bg-gray-50 p-3 mt-auto border-t border-gray-100 text-center">
        <Link
          href="/dashboard/settings"
          className="text-sm text-emerald-600 font-medium hover:text-emerald-700"
        >
          {t("manageAll")} &rarr;
        </Link>
      </div>
    </div>
  );
}
