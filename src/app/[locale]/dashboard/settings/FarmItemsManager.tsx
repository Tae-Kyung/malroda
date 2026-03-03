"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { addFarmItem, deleteFarmItem, bulkUploadFarmItems } from "./actions";
import ItemImageManager from "./ItemImageManager";
import ItemDetailPanel from "./ItemDetailPanel";

interface Item {
  id: string;
  item_name: string;
  grade: string;
  zone: string;
  unit: string;
  current_stock: number;
}

interface FarmItemsManagerProps {
  farmId: string;
  farmName: string;
  isOwner: boolean;
  initialItems: Item[];
  onItemsChange?: () => void;
}

export default function FarmItemsManager({
  farmId,
  farmName,
  isOwner,
  initialItems,
  onItemsChange,
}: FarmItemsManagerProps) {
  const t = useTranslations("settings.items");
  const tc = useTranslations("common");
  const ti = useTranslations("settings.images");
  const [items, setItems] = useState<Item[]>(initialItems);
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingAction, setIsUploadingAction] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItemForImages, setSelectedItemForImages] = useState<Item | null>(null);
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<Item | null>(null);
  const [imageRefreshKey, setImageRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // New item image upload states
  const [newItemImages, setNewItemImages] = useState<File[]>([]);
  const [newItemImagePreviews, setNewItemImagePreviews] = useState<string[]>([]);
  const [isDraggingNewItem, setIsDraggingNewItem] = useState(false);
  const newItemImageInputRef = useRef<HTMLInputElement>(null);

  // Camera capture states
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Sync items when initialItems changes
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const handleUpload = async (formData: FormData) => {
    setError(null);
    setIsUploadingAction(true);

    const result = await bulkUploadFarmItems(formData);

    if (result.error) {
      setError(result.error);
      setIsUploadingAction(false);
      return;
    }

    alert(t("uploadSuccess", { count: result.count || 0 }));
    setIsUploading(false);
    setIsUploadingAction(false);
    onItemsChange?.();
  };

  // Handle new item image selection
  const handleNewItemImageSelect = (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (fileArray.length === 0) return;

    // Create preview URLs
    const newPreviews = fileArray.map(file => URL.createObjectURL(file));

    setNewItemImages(prev => [...prev, ...fileArray]);
    setNewItemImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const handleNewItemImageRemove = (index: number) => {
    URL.revokeObjectURL(newItemImagePreviews[index]);
    setNewItemImages(prev => prev.filter((_, i) => i !== index));
    setNewItemImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const clearNewItemImages = () => {
    newItemImagePreviews.forEach(url => URL.revokeObjectURL(url));
    setNewItemImages([]);
    setNewItemImagePreviews([]);
  };

  // Camera functions
  const startCamera = async () => {
    setCameraError(null);
    setShowCameraModal(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      setCameraError(err.message || "Cannot access camera");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
    setCameraError(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `camera-${Date.now()}.jpg`, { type: "image/jpeg" });
        handleNewItemImageSelect([file]);
        stopCamera();
      }
    }, "image/jpeg", 0.9);
  };

  const handleAdd = async (formData: FormData) => {
    setError(null);
    setIsSubmitting(true);

    try {
      // 1. Create the item first
      const result = await addFarmItem(formData);

      if (result.error) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      // 2. Immediately add new item to local state (optimistic update)
      if (result.itemId) {
        const newItem: Item = {
          id: result.itemId,
          item_name: formData.get('item_name') as string,
          grade: formData.get('grade') as string,
          zone: formData.get('zone') as string || 'Default',
          unit: formData.get('unit') as string || 'pcs',
          current_stock: parseInt(formData.get('current_stock') as string || '0', 10) || 0,
        };
        setItems((prev) => [...prev, newItem]);
      }

      // 3. Upload images if any
      if (newItemImages.length > 0 && result.itemId) {
        for (const file of newItemImages) {
          const imageFormData = new FormData();
          imageFormData.append("file", file);
          imageFormData.append("item_id", result.itemId);

          try {
            await fetch("/api/images", {
              method: "POST",
              body: imageFormData,
            });
          } catch (err) {
            console.error("Error uploading image:", err);
          }
        }
      }

      // 4. Clean up form
      clearNewItemImages();
      setIsAdding(false);
      setIsSubmitting(false);
    } catch (err) {
      setError("An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm(t("deleteConfirm"))) return;

    setError(null);
    const result = await deleteFarmItem(itemId);

    if (result.error) {
      setError(result.error);
      return;
    }

    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  // Filter items based on search
  const filteredItems = items.filter(item =>
    item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.zone.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.grade.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="relative">
      {/* Main Content */}
      <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-200 ${selectedItemForDetail ? 'mr-[304px]' : ''}`}>
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex flex-col gap-5">
          {/* Items Manager Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">{t("title")}</h2>
              <p className="text-xs text-gray-500">{t("subtitle")}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsAdding(false);
                  setIsUploading(!isUploading);
                }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isUploading
                    ? "bg-gray-100 text-gray-700"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {isUploading ? tc("cancel") : t("csvUpload")}
              </button>
              <button
                onClick={() => {
                  setIsUploading(false);
                  setIsAdding(!isAdding);
                }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  isAdding
                    ? "bg-gray-100 text-gray-700"
                    : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {isAdding ? tc("cancel") : t("addNew")}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* CSV Upload Panel */}
        {isUploading && (
          <div className="mb-6 p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100">
            <form action={handleUpload} className="space-y-4">
              <input type="hidden" name="farm_id" value={farmId} />
              <div>
                <label className="block text-sm font-medium text-emerald-900 mb-2">
                  {t("csvHelp")}
                </label>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <input
                      type="file"
                      name="file"
                      accept=".csv"
                      required
                      className="block w-full text-sm text-emerald-900
                        file:mr-4 file:py-2.5 file:px-5
                        file:rounded-xl file:border-0
                        file:text-sm file:font-semibold
                        file:bg-gradient-to-r file:from-emerald-500 file:to-teal-600 file:text-white
                        hover:file:from-emerald-600 hover:file:to-teal-700
                        file:shadow-lg file:shadow-emerald-500/25
                        file:transition-all file:cursor-pointer
                        cursor-pointer"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isUploadingAction}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
                  >
                    {isUploadingAction ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t("uploading")}
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        {t("upload")}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Add New Item Panel */}
        {isAdding && (
          <div className="mb-6 p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                await handleAdd(formData);
              }}
              className="space-y-4"
            >
              <input type="hidden" name="farm_id" value={farmId} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-emerald-800 mb-1.5 uppercase tracking-wider">
                    {t("zone")} *
                  </label>
                  <input
                    type="text"
                    name="zone"
                    required
                    placeholder={t("zonePlaceholder")}
                    className="w-full text-sm rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-800 mb-1.5 uppercase tracking-wider">
                    {t("itemName")} *
                  </label>
                  <input
                    type="text"
                    name="item_name"
                    required
                    placeholder={t("itemNamePlaceholder")}
                    className="w-full text-sm rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-800 mb-1.5 uppercase tracking-wider">
                    {t("grade")} *
                  </label>
                  <input
                    type="text"
                    name="grade"
                    required
                    placeholder={t("gradePlaceholder")}
                    className="w-full text-sm rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-800 mb-1.5 uppercase tracking-wider">
                    {t("unit")}
                  </label>
                  <input
                    type="text"
                    name="unit"
                    defaultValue={t("unitDefault")}
                    className="w-full text-sm rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-800 mb-1.5 uppercase tracking-wider">
                    {t("currentStock")}
                  </label>
                  <input
                    type="number"
                    name="current_stock"
                    min="0"
                    defaultValue="0"
                    placeholder="0"
                    className="w-full text-sm rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Image Upload Area */}
              <div>
                <label className="block text-xs font-semibold text-emerald-800 mb-1.5 uppercase tracking-wider">
                  {t("images")}
                </label>
                <div
                  className={`border-2 border-dashed rounded-xl p-4 transition-colors ${
                    isDraggingNewItem
                      ? "border-emerald-500 bg-emerald-100/50"
                      : "border-emerald-200 bg-white hover:bg-emerald-50/50"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingNewItem(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDraggingNewItem(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingNewItem(false);
                    handleNewItemImageSelect(e.dataTransfer.files);
                  }}
                >
                  {newItemImagePreviews.length > 0 ? (
                    <div className="space-y-3">
                      {/* Image Previews */}
                      <div className="flex flex-wrap gap-2">
                        {newItemImagePreviews.map((preview, index) => (
                          <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border border-emerald-200 group">
                            <Image
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleNewItemImageRemove(index)}
                              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            >
                              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        {/* Add More Buttons */}
                        <button
                          type="button"
                          onClick={() => newItemImageInputRef.current?.click()}
                          className="w-20 h-20 rounded-lg border-2 border-dashed border-emerald-300 flex flex-col items-center justify-center text-emerald-500 hover:bg-emerald-50 transition-colors"
                          title={ti("uploadHint")}
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={startCamera}
                          className="w-20 h-20 rounded-lg border-2 border-dashed border-emerald-300 flex flex-col items-center justify-center text-emerald-500 hover:bg-emerald-50 transition-colors"
                          title={ti("takePhoto")}
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-xs text-emerald-600">{newItemImages.length} image(s) selected</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-4">
                      <div className="flex items-center gap-4 mb-3">
                        {/* Upload from Files */}
                        <button
                          type="button"
                          onClick={() => newItemImageInputRef.current?.click()}
                          className="flex flex-col items-center justify-center w-24 h-24 rounded-xl border-2 border-dashed border-emerald-300 text-emerald-500 hover:bg-emerald-50 hover:border-emerald-400 transition-colors"
                        >
                          <svg className="w-8 h-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-xs font-medium">{ti("gallery")}</span>
                        </button>
                        {/* Take Photo */}
                        <button
                          type="button"
                          onClick={startCamera}
                          className="flex flex-col items-center justify-center w-24 h-24 rounded-xl border-2 border-dashed border-emerald-300 text-emerald-500 hover:bg-emerald-50 hover:border-emerald-400 transition-colors"
                        >
                          <svg className="w-8 h-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-xs font-medium">{ti("camera")}</span>
                        </button>
                      </div>
                      <p className="text-xs text-emerald-500">{ti("uploadFormats")}</p>
                    </div>
                  )}
                  {/* File input for gallery */}
                  <input
                    ref={newItemImageInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={(e) => e.target.files && handleNewItemImageSelect(e.target.files)}
                  />
                  {/* Hidden canvas for camera capture */}
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {tc("loading")}
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      {t("addButton")}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search Bar */}
        {items.length > 0 && (
          <div className="mb-6">
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search items, zones, grades..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:bg-white transition-all"
              />
            </div>
          </div>
        )}

        {/* Modern Table */}
        {filteredItems.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                    <th className="px-4 py-4 text-center w-16">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">#</span>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t("zone")}</span>
                    </th>
                    <th className="px-6 py-4 text-left w-1/3">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t("itemName")}</span>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t("grade")}</span>
                    </th>
                    <th className="px-6 py-4 text-center">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t("currentStock")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedItems.map((item, index) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedItemForDetail(item)}
                      className={`group transition-all cursor-pointer ${
                        selectedItemForDetail?.id === item.id
                          ? 'bg-emerald-50 border-l-2 border-l-emerald-500'
                          : index % 2 === 0
                          ? 'bg-white hover:bg-gray-50'
                          : 'bg-gray-50/30 hover:bg-gray-100/50'
                      }`}
                    >
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                          {startIndex + index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{item.zone}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm">
                            <span className="text-white font-bold text-sm">{item.item_name.charAt(0)}</span>
                          </div>
                          <span className="font-semibold text-gray-900">{item.item_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-100">
                          {item.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center min-w-[80px] px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20">
                          <span className="text-white font-bold text-lg">{item.current_stock.toLocaleString()}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer with Pagination */}
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-t border-gray-100">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Left: Item count and per page selector */}
                <div className="flex items-center gap-4">
                  <p className="text-sm text-gray-500">
                    Showing <span className="font-semibold text-gray-700">{startIndex + 1}-{Math.min(endIndex, filteredItems.length)}</span> of <span className="font-semibold text-gray-700">{filteredItems.length}</span> items
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Per page:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>

                {/* Center: Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    {/* Previous Button */}
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    {/* Page Numbers */}
                    {getPageNumbers().map((page, idx) => (
                      <button
                        key={idx}
                        onClick={() => typeof page === 'number' && setCurrentPage(page)}
                        disabled={page === '...'}
                        className={`min-w-[40px] h-10 rounded-lg text-sm font-medium transition-all ${
                          page === currentPage
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25'
                            : page === '...'
                            ? 'text-gray-400 cursor-default'
                            : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    {/* Next Button */}
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Right: Total stock */}
                <p className="text-sm font-semibold text-gray-700">
                  {t("currentStock")}: <span className="text-emerald-600">{filteredItems.reduce((sum, item) => sum + item.current_stock, 0).toLocaleString()}</span>
                </p>
              </div>
            </div>
          </div>
        ) : items.length > 0 ? (
          <div className="text-center py-12 rounded-2xl border border-gray-200 bg-gray-50/50">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-gray-500">No items match your search</p>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-gray-500 mb-4">{t("noItems")}</p>
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t("addNew")}
            </button>
          </div>
        )}
      </div>

      </div>

      {/* Detail Panel - Absolute positioned */}
      <div
        className={`absolute top-0 right-0 w-72 transition-all duration-200 ease-out ${
          selectedItemForDetail ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'
        }`}
      >
        <div className="sticky top-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {selectedItemForDetail && (
            <ItemDetailPanel
              item={selectedItemForDetail}
              onClose={() => setSelectedItemForDetail(null)}
              onManageImages={() => {
                setSelectedItemForImages(selectedItemForDetail);
              }}
              onDelete={() => {
                handleDelete(selectedItemForDetail.id);
                setSelectedItemForDetail(null);
              }}
              imageRefreshKey={imageRefreshKey}
            />
          )}
        </div>
      </div>

      {/* Image Manager Modal */}
      {selectedItemForImages && (
        <ItemImageManager
          itemId={selectedItemForImages.id}
          itemName={`${selectedItemForImages.item_name} (${selectedItemForImages.grade}) - ${selectedItemForImages.zone}`}
          onClose={() => setSelectedItemForImages(null)}
          onImagesChange={() => setImageRefreshKey((k) => k + 1)}
        />
      )}

      {/* Camera Capture Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">{ti("takePhoto")}</h2>
                </div>
                <button
                  onClick={stopCamera}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Camera View */}
            <div className="relative bg-black aspect-[4/3]">
              {cameraError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
                  <svg className="w-12 h-12 text-red-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-center text-sm">{cameraError}</p>
                  <p className="text-center text-xs text-gray-400 mt-2">Please allow camera access in your browser settings</p>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Controls */}
            <div className="px-6 py-4 bg-gray-50 flex items-center justify-center gap-4">
              <button
                onClick={stopCamera}
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
              >
                {tc("cancel")}
              </button>
              <button
                onClick={capturePhoto}
                disabled={!cameraStream || !!cameraError}
                className="px-8 py-3 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {ti("capture")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
