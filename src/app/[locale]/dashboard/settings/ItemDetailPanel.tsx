"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import Image from "next/image";

interface Item {
  id: string;
  item_name: string;
  grade: string;
  zone: string;
  unit: string;
  current_stock: number;
}

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

  // Keyboard navigation
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
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={onClose}>
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Image counter */}
      <div className="absolute top-4 left-4 text-white/70 text-sm">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Previous button */}
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

      {/* Image */}
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

      {/* Next button */}
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

interface ItemDetailPanelProps {
  item: Item;
  onClose: () => void;
  onManageImages: () => void;
  onDelete: () => void;
  imageRefreshKey?: number;
}

export default function ItemDetailPanel({
  item,
  onClose,
  onManageImages,
  onDelete,
  imageRefreshKey = 0,
}: ItemDetailPanelProps) {
  const t = useTranslations("settings.items");
  const tc = useTranslations("common");
  const [images, setImages] = useState<ItemImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchImages();
  }, [item.id, imageRefreshKey]);

  const fetchImages = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/images?item_id=${item.id}`);
      const data = await res.json();
      if (data.images) {
        setImages(data.images);
      }
    } catch (err) {
      console.error("Failed to fetch images:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-medium text-gray-900">Item Details</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
            title={tc("delete")}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* Item Name */}
        <div className="mb-6">
          <p className="text-xs text-gray-400 mb-1">{t("itemName")}</p>
          <p className="text-lg font-semibold text-gray-900">{item.item_name}</p>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-xs text-gray-400 mb-1">{t("zone")}</p>
            <p className="text-sm text-gray-900">{item.zone}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">{t("grade")}</p>
            <p className="text-sm text-gray-900">{item.grade}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">{t("unit")}</p>
            <p className="text-sm text-gray-900">{item.unit}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">{t("currentStock")}</p>
            <p className="text-sm font-semibold text-emerald-600">{item.current_stock.toLocaleString()}</p>
          </div>
        </div>

        {/* Images */}
        <div>
          <p className="text-xs text-gray-400 mb-3">{t("images")}</p>

          {isLoading ? (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin" />
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
                    alt={image.caption || item.item_name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
              ))}
              {/* Edit button */}
              <button
                onClick={onManageImages}
                className="aspect-square rounded-lg border border-dashed border-gray-300 flex items-center justify-center hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={onManageImages}
              className="w-full py-6 border border-dashed border-gray-200 rounded-lg text-center hover:border-gray-300 transition-colors"
            >
              <svg className="w-6 h-6 mx-auto mb-1 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
              <p className="text-xs text-gray-400">Add images</p>
            </button>
          )}
        </div>
      </div>

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
