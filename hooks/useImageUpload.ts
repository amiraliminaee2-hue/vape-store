"use client";

import { useState } from "react";
import { compressMultipleImages, getReadableFileSize } from "@/lib/imageCompression";

interface UseImageUploadProps {
  maxFiles?: number;
  maxSizeMB?: number;
  onUpload?: (files: File[]) => void;
}

export function useImageUpload({ maxFiles = 5, maxSizeMB = 2, onUpload }: UseImageUploadProps = {}) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    setError(null);
    setLoading(true);

    const fileArray = Array.from(selectedFiles);
    
    // Check number of files
    if (files.length + fileArray.length > maxFiles) {
      setError(`حداکثر ${maxFiles} فایل می‌توانید آپلود کنید`);
      setLoading(false);
      return;
    }

    // Check file sizes
    const oversizedFiles = fileArray.filter(f => f.size > maxSizeMB * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError(`حجم فایل‌ها باید کمتر از ${maxSizeMB} مگابایت باشد`);
      setLoading(false);
      return;
    }

    try {
      // Compress images
      const compressedFiles = await compressMultipleImages(fileArray);
      
      // Create previews
      const newPreviews = compressedFiles.map(f => URL.createObjectURL(f));
      
      setFiles(prev => [...prev, ...compressedFiles]);
      setPreviews(prev => [...prev, ...newPreviews]);
      
      if (onUpload) {
        onUpload(compressedFiles);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در فشرده‌سازی تصاویر");
    } finally {
      setLoading(false);
    }
  };

  const removeFile = (index: number) => {
    // Revoke object URL to avoid memory leaks
    URL.revokeObjectURL(previews[index]);
    
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const clearFiles = () => {
    previews.forEach(url => URL.revokeObjectURL(url));
    setFiles([]);
    setPreviews([]);
  };

  return {
    files,
    previews,
    loading,
    error,
    handleFileSelect,
    removeFile,
    clearFiles,
  };
}