"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useTranslations } from "next-intl";
import { useFarm } from "@/contexts/FarmContext";
import FarmItemsManager from "./FarmItemsManager";
import DeleteFarmModal from "./DeleteFarmModal";

interface FarmItem {
  id: string;
  farm_id: string;
  zone: string;
  item_name: string;
  grade: string;
  unit: string;
  current_stock: number;
}

export default function SettingsContent() {
  const t = useTranslations();
  const { currentFarm, farms, isLoading: farmLoading, refreshFarms } = useFarm();
  const [farmItems, setFarmItems] = useState<FarmItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchFarmItems = async () => {
    if (!currentFarm?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    const { data: items } = await supabase
      .from("malroda_items")
      .select("*")
      .eq("farm_id", currentFarm.id)
      .order("zone", { ascending: true })
      .order("item_name", { ascending: true });

    setFarmItems(items || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchFarmItems();
  }, [currentFarm?.id]);

  const handleFarmDeleted = async () => {
    await refreshFarms();
    setShowDeleteModal(false);
  };

  if (farmLoading || isLoading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <div className="h-7 w-32 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-8 animate-pulse">
          <div className="h-8 w-32 bg-gray-200 rounded mb-4" />
          <div className="h-12 bg-gray-100 rounded mb-6" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("settings.title")}</h1>
        <p className="text-sm text-gray-500 mt-1">{t("settings.subtitle")}</p>
      </div>

      {currentFarm ? (
        <>
          <FarmItemsManager
            farmId={currentFarm.id}
            farmName={currentFarm.farm_name}
            isOwner={currentFarm.role === "owner"}
            initialItems={farmItems}
            onItemsChange={fetchFarmItems}
          />

          {/* Danger Zone - Delete Farm */}
          {currentFarm.role === "owner" && (
            <div className="mt-8 bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-red-50 border-b border-red-200">
                <h3 className="text-sm font-semibold text-red-900">Danger Zone</h3>
              </div>
              <div className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{t("farm.deleteFarm")}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t("farm.deleteWarning")}</p>
                </div>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  disabled={farms.length <= 1}
                  className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={farms.length <= 1 ? t("farm.cannotDeleteOnly") : ""}
                >
                  {t("farm.deleteFarm")}
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <p className="text-gray-500">{t("settings.noFarm")}</p>
        </div>
      )}

      {/* Delete Farm Modal */}
      {currentFarm && (
        <DeleteFarmModal
          isOpen={showDeleteModal}
          farmId={currentFarm.id}
          farmName={currentFarm.farm_name}
          onClose={() => setShowDeleteModal(false)}
          onDeleted={handleFarmDeleted}
        />
      )}
    </div>
  );
}
