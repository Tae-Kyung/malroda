"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import Image from "next/image";

interface ItemImage {
  id: string;
  image_url: string;
  display_order: number;
  caption: string | null;
}

// Full screen image viewer
function ImageViewer({
  images,
  currentIndex,
  onClose,
  onNavigate,
}: {
  images: ItemImage[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const image = images[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && currentIndex > 0) onNavigate(currentIndex - 1);
      if (e.key === "ArrowRight" && currentIndex < images.length - 1) onNavigate(currentIndex + 1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, images.length, onClose, onNavigate]);

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center" onClick={onClose}>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="absolute top-4 left-4 text-white/70 text-sm">
        {currentIndex + 1} / {images.length}
      </div>

      {currentIndex > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex - 1); }}
          className="absolute left-4 p-2 text-white/70 hover:text-white transition-colors"
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <Image
          src={image.image_url}
          alt={image.caption || ""}
          width={1200}
          height={800}
          className="object-contain max-h-[90vh]"
          priority
        />
      </div>

      {currentIndex < images.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex + 1); }}
          className="absolute right-4 p-2 text-white/70 hover:text-white transition-colors"
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}

interface InventoryItem {
  item_name: string;
  current_stock: number;
  zone?: string;
  grade?: string;
  unit?: string;
}

interface InventoryTableProps {
  data: InventoryItem[];
}

export default function InventoryTable({ data }: InventoryTableProps) {
  const t = useTranslations("simulator.visualization");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [images, setImages] = useState<ItemImage[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  const totalStock = data.reduce((sum, item) => sum + item.current_stock, 0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch images when an item is selected
  useEffect(() => {
    if (selectedItem) {
      fetchImages(selectedItem);
    } else {
      setImages([]);
    }
  }, [selectedItem]);

  const fetchImages = async (item: InventoryItem) => {
    setIsLoadingImages(true);
    try {
      // Build query params with item_name, zone, and grade
      const params = new URLSearchParams();
      params.set('item_name', item.item_name);
      if (item.zone) params.set('zone', item.zone);
      if (item.grade) params.set('grade', item.grade);

      const res = await fetch(`/api/images?${params.toString()}`);
      const data = await res.json();
      if (data.images) {
        setImages(data.images);
      } else {
        setImages([]);
      }
    } catch (err) {
      console.error("Failed to fetch images:", err);
      setImages([]);
    } finally {
      setIsLoadingImages(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="text-left p-2 font-semibold text-gray-600">
                {t("itemName")}
              </th>
              <th className="text-left p-2 font-semibold text-gray-600">
                {t("zone")}
              </th>
              <th className="text-right p-2 font-semibold text-gray-600">
                {t("stock")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((item, idx) => (
              <tr
                key={idx}
                onClick={() => setSelectedItem(item)}
                className="hover:bg-emerald-50/50 transition-colors cursor-pointer"
              >
                <td className="p-2 text-gray-800">
                  <span className="font-medium">{item.item_name}</span>
                  {item.grade && (
                    <span className="text-gray-400 ml-1">({item.grade})</span>
                  )}
                </td>
                <td className="p-2 text-gray-500">{item.zone || "-"}</td>
                <td className="p-2 text-right font-semibold text-emerald-600">
                  {item.current_stock.toLocaleString()}
                  <span className="text-gray-400 font-normal ml-0.5">
                    {item.unit || ""}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center text-sm">
        <span className="text-gray-500">
          {t("total")}: {data.length} {t("items")}
        </span>
        <span className="font-bold text-emerald-600">
          {totalStock.toLocaleString()} {t("totalStock")}
        </span>
      </div>

      {/* Read-only Item Detail Popup */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <span className="font-bold text-lg">{selectedItem.item_name.charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedItem.item_name}</h3>
                    <p className="text-xs text-white/80">{selectedItem.zone || "-"}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-1 text-white/70 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">{t("zone")}</p>
                  <p className="text-sm font-medium text-gray-900">{selectedItem.zone || "-"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">{t("grade")}</p>
                  <p className="text-sm font-medium text-gray-900">{selectedItem.grade || "-"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Unit</p>
                  <p className="text-sm font-medium text-gray-900">{selectedItem.unit || "-"}</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                  <p className="text-xs text-emerald-600 mb-1">{t("stock")}</p>
                  <p className="text-lg font-bold text-emerald-600">{selectedItem.current_stock.toLocaleString()}</p>
                </div>
              </div>

              {/* Images Section */}
              <div>
                <p className="text-xs text-gray-400 mb-2">{t("images")}</p>
                {isLoadingImages ? (
                  <div className="flex justify-center py-4">
                    <div className="w-5 h-5 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
                  </div>
                ) : images.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {images.map((image, index) => (
                      <div
                        key={image.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewerIndex(index);
                        }}
                        className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        <Image
                          src={image.image_url}
                          alt={image.caption || selectedItem.item_name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 text-center py-3">{t("noImages")}</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center">Read-only view</p>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer - Portal to body */}
      {mounted && viewerIndex !== null && images.length > 0 && createPortal(
        <ImageViewer
          images={images}
          currentIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onNavigate={setViewerIndex}
        />,
        document.body
      )}
    </div>
  );
}
