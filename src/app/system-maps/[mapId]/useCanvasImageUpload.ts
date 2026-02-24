"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { imageDefaultWidth, imageMinHeight } from "./canvasShared";

type AddImageAssetInput = {
  storagePath: string;
  description: string;
  width: number;
  height: number;
};

type UseCanvasImageUploadParams = {
  canWriteMap: boolean;
  mapId: string;
  userId: string | null;
  setError: (value: string | null) => void;
  setShowAddMenu: (updater: (prev: boolean) => boolean) => void;
  handleAddImageAsset: (input: AddImageAssetInput) => Promise<unknown>;
};

export function useCanvasImageUpload({
  canWriteMap,
  mapId,
  userId,
  setError,
  setShowAddMenu,
  handleAddImageAsset,
}: UseCanvasImageUploadParams) {
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);
  const [imageUploadFile, setImageUploadFile] = useState<File | null>(null);
  const [imageUploadPreviewUrl, setImageUploadPreviewUrl] = useState<string | null>(null);
  const [imageUploadWidth, setImageUploadWidth] = useState<number>(imageDefaultWidth);
  const [imageUploadHeight, setImageUploadHeight] = useState<number>(imageDefaultWidth);
  const [imageUploadDescription, setImageUploadDescription] = useState("");
  const [imageUploadSaving, setImageUploadSaving] = useState(false);

  useEffect(() => {
    return () => {
      if (imageUploadPreviewUrl) URL.revokeObjectURL(imageUploadPreviewUrl);
    };
  }, [imageUploadPreviewUrl]);

  const handleStartAddImageAsset = useCallback(() => {
    if (!canWriteMap) {
      setError("You have view access only for this map.");
      return;
    }
    setShowAddMenu(() => false);
    setImageUploadFile(null);
    setImageUploadDescription("");
    setImageUploadPreviewUrl(null);
    setImageUploadWidth(imageDefaultWidth);
    setImageUploadHeight(imageDefaultWidth);
    setShowImageUploadModal(true);
  }, [canWriteMap, setError, setShowAddMenu]);

  const handleSelectImageUploadFile = useCallback((file: File | null) => {
    setImageUploadFile(file);
    if (!file) {
      setImageUploadPreviewUrl(null);
      setImageUploadWidth(imageDefaultWidth);
      setImageUploadHeight(imageDefaultWidth);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setImageUploadPreviewUrl(objectUrl);
    const img = new Image();
    img.onload = () => {
      const ratio = img.width > 0 ? img.height / img.width : 1;
      const width = imageDefaultWidth;
      const height = Math.max(imageMinHeight, Math.round(width * ratio));
      setImageUploadWidth(width);
      setImageUploadHeight(height);
    };
    img.src = objectUrl;
  }, []);

  const handleCancelImageUpload = useCallback(() => {
    if (imageUploadPreviewUrl) URL.revokeObjectURL(imageUploadPreviewUrl);
    setShowImageUploadModal(false);
    setImageUploadFile(null);
    setImageUploadPreviewUrl(null);
    setImageUploadDescription("");
    setImageUploadSaving(false);
  }, [imageUploadPreviewUrl]);

  const handleConfirmImageUpload = useCallback(async () => {
    if (!canWriteMap || !imageUploadFile || !userId) return;
    setImageUploadSaving(true);
    const ext = imageUploadFile.name.includes(".") ? imageUploadFile.name.split(".").pop() : "bin";
    const baseName = imageUploadFile.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9-_ ]/g, "").trim().replace(/\s+/g, "-").toLowerCase() || "image";
    const storagePath = `${mapId}/${Date.now()}-${crypto.randomUUID()}-${baseName}.${ext}`;
    const { error: uploadError } = await supabaseBrowser.storage.from("systemmap").upload(storagePath, imageUploadFile, {
      cacheControl: "3600",
      upsert: false,
    });
    if (uploadError) {
      setError(uploadError.message || "Unable to upload image.");
      setImageUploadSaving(false);
      return;
    }
    const inserted = await handleAddImageAsset({
      storagePath,
      description: imageUploadDescription.trim() || imageUploadFile.name.replace(/\.[^/.]+$/, ""),
      width: imageUploadWidth,
      height: imageUploadHeight,
    });
    if (!inserted) {
      await supabaseBrowser.storage.from("systemmap").remove([storagePath]);
      setImageUploadSaving(false);
      return;
    }
    setImageUploadSaving(false);
    handleCancelImageUpload();
  }, [
    canWriteMap,
    handleAddImageAsset,
    handleCancelImageUpload,
    imageUploadDescription,
    imageUploadFile,
    imageUploadHeight,
    imageUploadWidth,
    mapId,
    setError,
    userId,
  ]);

  return {
    showImageUploadModal,
    imageUploadFile,
    imageUploadPreviewUrl,
    imageUploadDescription,
    setImageUploadDescription,
    imageUploadSaving,
    handleStartAddImageAsset,
    handleSelectImageUploadFile,
    handleCancelImageUpload,
    handleConfirmImageUpload,
  };
}
