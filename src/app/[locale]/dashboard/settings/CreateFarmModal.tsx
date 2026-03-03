"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useTranslations } from "next-intl";

interface CreateFarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateFarmModal({ isOpen, onClose, onCreated }: CreateFarmModalProps) {
  const t = useTranslations();
  const [farmName, setFarmName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmName.trim()) return;

    setIsCreating(true);
    setError("");

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError("User not authenticated");
        return;
      }

      // Create the farm
      const { data: newFarm, error: farmError } = await supabase
        .from("malroda_farms")
        .insert({
          owner_id: user.id,
          farm_name: farmName.trim(),
        })
        .select()
        .single();

      if (farmError) throw farmError;

      // Add user as owner in farm_members
      const { error: memberError } = await supabase
        .from("malroda_farm_members")
        .insert({
          farm_id: newFarm.id,
          user_id: user.id,
          role: "owner",
        });

      if (memberError) throw memberError;

      setFarmName("");
      onCreated();
    } catch (err: any) {
      console.error("Error creating farm:", err);
      setError(err.message || t("farm.createError"));
    } finally {
      setIsCreating(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {t("farm.createFarm")}
            </h2>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleCreate} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("farm.farmName")}
            </label>
            <input
              type="text"
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
              placeholder={t("farm.farmNamePlaceholder")}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              autoFocus
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={!farmName.trim() || isCreating}
              className="flex-1 px-4 py-3 text-sm font-medium text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? t("farm.creating") : t("common.add")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
