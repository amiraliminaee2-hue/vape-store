import imageCompression from "browser-image-compression";

interface CompressionOptions {
  maxSizeMB?: number;      // حداکثر حجم نهایی (مگابایت)
  maxWidthOrHeight?: number; // حداکثر عرض یا ارتفاع
  useWebWorker?: boolean;   // استفاده از WebWorker برای عملکرد بهتر
  fileType?: string;        // نوع فایل خروجی (image/webp, image/jpeg)
}

const defaultOptions: CompressionOptions = {
  maxSizeMB: 0.5,           // حداکثر ۵۰۰ کیلوبایت
  maxWidthOrHeight: 1200,   // حداکثر ۱۲۰۰ پیکسل
  useWebWorker: true,       // استفاده از WebWorker
  fileType: "image/webp",   // تبدیل به WebP
};

/**
 * Compress an image file and convert to WebP
 * @param file - Original image file
 * @param options - Compression options
 * @returns Compressed WebP file
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const mergeOptions = { ...defaultOptions, ...options };

  try {
    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      throw new Error("فایل انتخاب شده تصویر نیست");
    }

    // Compress the image
    const compressedFile = await imageCompression(file, mergeOptions);

    // If we want WebP and the file isn't already WebP, convert it
    if (mergeOptions.fileType === "image/webp" && file.type !== "image/webp") {
      const webpFile = await convertToWebP(compressedFile);
      return webpFile;
    }

    return compressedFile;
  } catch (error) {
    console.error("Image compression error:", error);
    return file; // Return original file if compression fails
  }
}

/**
 * Convert image to WebP format
 * @param file - Image file to convert
 * @returns WebP file
 */
async function convertToWebP(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const webpFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".webp"), {
              type: "image/webp",
              lastModified: Date.now(),
            });
            resolve(webpFile);
          } else {
            reject(new Error("WebP conversion failed"));
          }
        },
        "image/webp",
        0.85 // WebP quality (85%)
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

/**
 * Compress multiple images
 * @param files - Array of image files
 * @param options - Compression options
 * @returns Array of compressed files
 */
export async function compressMultipleImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<File[]> {
  const compressedFiles: File[] = [];
  
  for (const file of files) {
    const compressed = await compressImage(file, options);
    compressedFiles.push(compressed);
  }
  
  return compressedFiles;
}

/**
 * Get file size in human-readable format
 * @param bytes - File size in bytes
 * @returns Human-readable file size
 */
export function getReadableFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}