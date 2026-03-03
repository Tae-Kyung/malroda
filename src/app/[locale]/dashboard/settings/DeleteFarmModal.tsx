"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useTranslations } from "next-intl";

interface DeleteFarmModalProps {
  isOpen: boolean;
  farmId: string;
  farmName: string;
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeleteFarmModal({
  isOpen,
  farmId,
  farmName,
  onClose,
  onDeleted,
}: DeleteFarmModalProps) {
  const t = useTranslations();
  const [confirmName, setConfirmName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleDelete = async () => {
    if (confirmName !== farmName) {
      setError(t("farm.nameDoesNotMatch"));
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      const supabase = createClient();

      // Delete the farm (cascade will handle farm_members and items)
      const { error: deleteError } = await supabase
        .from("malroda_farms")
        .delete()
        .eq("id", farmId);

      if (deleteError) throw deleteError;

      setConfirmName("");
      onDeleted();
    } catch (err: any) {
      console.error("Error deleting farm:", err);
      setError(err.message || t("farm.deleteError"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setConfirmName("");
    setError("");
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-red-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-red-900">
                {t("farm.deleteFarm")}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-1 text-red-400 hover:text-red-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-2">
            {t("farm.deleteConfirm")}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            {t("farm.deleteWarning")}
          </p>

          <div className="p-3 bg-gray-50 rounded-lg mb-4">
            <p className="text-sm font-medium text-gray-900">{farmName}</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("farm.typeFarmName")}
            </label>
            <input
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={farmName}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
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
              onClick={handleClose}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={handleDelete}
              disabled={confirmName !== farmName || isDeleting}
              className="flex-1 px-4 py-3 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? t("farm.deleting") : t("common.delete")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
