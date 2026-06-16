"use client";

import { useState } from "react";
import { generateUploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

// ایجاد کامپوننت UploadButton سفارشی
const UploadButton = generateUploadButton<OurFileRouter>();

interface ImageUploaderProps {
  onUploaded: (urls: string[]) => void;
  existingImages?: string[];
}

export default function ImageUploader({ 
  onUploaded, 
  existingImages = [] 
}: ImageUploaderProps) {
  const [images, setImages] = useState<string[]>(existingImages);
  const [uploading, setUploading] = useState(false);

  return (
    <div className="space-y-4">
      <UploadButton
        endpoint="productImage"
        onUploadBegin={() => {
          setUploading(true);
        }}
        onClientUploadComplete={(res) => {
          setUploading(false);
          if (res) {
            const urls = res.map((f) => f.url);
            const newImages = [...images, ...urls];
            setImages(newImages);
            onUploaded(newImages);
          }
        }}
        onUploadError={(error: Error) => {
          setUploading(false);
          console.error("Upload error:", error);
          alert("خطا در آپلود تصویر");
        }}
        appearance={{
          button: {
            backgroundColor: '#8b5cf6',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '16px',
            fontSize: '14px',
          },
          allowedContent: {
            color: '#71717a',
          },
        }}
      />

      {uploading && (
        <div className="text-zinc-400 text-sm">در حال آپلود...</div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {images.map((image, index) => (
          <div key={index} className="relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt={`Product image ${index + 1}`}
              className="
                h-32
                w-full
                object-cover
                rounded-xl
                bg-white/5
              "
            />
            <button
              type="button"
              onClick={() => {
                const newImages = images.filter((_, i) => i !== index);
                setImages(newImages);
                onUploaded(newImages);
              }}
              className="
                absolute
                top-2
                right-2
                w-6 h-6
                rounded-full
                bg-red-500
                text-white
                flex items-center justify-center
                text-xs
                opacity-0
                group-hover:opacity-100
                transition-opacity
                hover:bg-red-600
              "
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