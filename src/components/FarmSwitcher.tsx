"use client";

import { useState, useRef, useEffect } from "react";
import { useFarm } from "@/contexts/FarmContext";
import { useTranslations } from "next-intl";
import CreateFarmModal from "@/app/[locale]/dashboard/settings/CreateFarmModal";

export default function FarmSwitcher() {
  const { farms, currentFarm, setCurrentFarm, isLoading, refreshFarms } = useFarm();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const t = useTranslations();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFarmCreated = async () => {
    await refreshFarms();
    setShowCreateModal(false);
  };

  if (isLoading) {
    return (
      <div className="h-8 w-32 bg-gray-100 rounded-md animate-pulse" />
    );
  }

  if (!currentFarm || farms.length === 0) {
    return (
      <>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="font-medium">{t("farm.createFarm")}</span>
        </button>
        <CreateFarmModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleFarmCreated}
        />
      </>
    );
  }

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
        >
          <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="font-medium truncate max-w-[120px]">{currentFarm.farm_name}</span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
            <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t("farm.switchFarm")}
            </div>
            {farms.map((farm) => (
              <button
                key={farm.id}
                onClick={() => {
                  setCurrentFarm(farm);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                  farm.id === currentFarm.id
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${farm.id === currentFarm.id ? "bg-emerald-500" : "bg-transparent"}`} />
                <div className="flex-1 text-left">
                  <div className="font-medium truncate">{farm.farm_name}</div>
                  <div className="text-xs text-gray-500 capitalize">{farm.role}</div>
                </div>
                {farm.id === currentFarm.id && (
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}

            {/* Divider */}
            <div className="my-1 border-t border-gray-100" />

            {/* Create New Farm Button */}
            <button
              onClick={() => {
                setIsOpen(false);
                setShowCreateModal(true);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-medium">{t("farm.createFarm")}</span>
            </button>
          </div>
        )}
      </div>

      {/* Create Farm Modal */}
      <CreateFarmModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleFarmCreated}
      />
    </>
  );
}
