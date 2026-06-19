"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface ImageUploaderDirectProps {
  onUploaded: (urls: string[]) => void;
  existingImages?: string[];
}

export default function ImageUploaderDirect({
  onUploaded,
  existingImages = [],
}: ImageUploaderDirectProps) {
  const [images, setImages] = useState<string[]>(existingImages);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setProgress(0);

    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;
      
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (res.ok && data.url) {
          uploadedUrls.push(data.url);
        } else {
          console.error("Upload failed:", data.error);
          alert(`خطا در آپلود ${file.name}: ${data.error}`);
        }
      } catch (error) {
        console.error("Upload error:", error);
        alert(`خطا در آپلود ${file.name}`);
      }

      setProgress(((i + 1) / files.length) * 100);
    }

    const newImages = [...images, ...uploadedUrls];
    setImages(newImages);
    onUploaded(newImages);
    setUploading(false);
    setProgress(0);

    // reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onUploaded(newImages);
  };

  return (
    <div className="space-y-4">
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          multiple
          onChange={handleFileSelect}
          disabled={uploading}
          className="block w-full text-sm text-zinc-400
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-violet-600 file:text-white
            hover:file:bg-violet-500
            disabled:opacity-50"
        />
        <p className="text-xs text-zinc-500 mt-2">
          فرمت‌های مجاز: JPEG, PNG, WebP, GIF | حداکثر حجم: ۵ مگابایت
        </p>
      </div>

      {uploading && (
        <div className="space-y-2">
          <div className="w-full bg-zinc-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-violet-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-zinc-400 text-center">
            در حال آپلود... {Math.round(progress)}%
          </p>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {images.map((image, index) => (
          <div key={index} className="relative group aspect-square">
            <Image
              src={image}
              alt={`تصویر ${index + 1}`}
              fill
              className="object-cover rounded-xl bg-white/5"
              sizes="(max-width: 768px) 25vw, (max-width: 1024px) 20vw, 15vw"
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {images.length === 0 && !uploading && (
        <div className="text-center text-zinc-500 text-sm py-8 border border-dashed border-white/10 rounded-xl">
          برای آپلود تصویر کلیک کنید
        </div>
      )}
    </div>
  );
}