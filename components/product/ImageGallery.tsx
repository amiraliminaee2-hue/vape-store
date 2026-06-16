"use client";

import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Thumbs, FreeMode } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/thumbs";
import "swiper/css/free-mode";

interface ImageGalleryProps {
  images: string[];
  title: string;
}

export default function ImageGallery({ images, title }: ImageGalleryProps) {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // If no images, show placeholder
  if (!images || images.length === 0) {
    return (
      <div className="rounded-3xl bg-white/[0.03] border border-white/10 overflow-hidden">
        <div className="aspect-square flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
          <div className="text-center">
            <div className="text-6xl mb-4">📷</div>
            <p className="text-zinc-500">تصویری موجود نیست</p>
          </div>
        </div>
      </div>
    );
  }

  const mainImages = images.map((img, idx) => ({
    src: img,
    alt: `${title} - تصویر ${idx + 1}`,
  }));

  return (
    <div className="space-y-4">
      {/* Main Swiper */}
      <div className="rounded-3xl bg-white/[0.03] border border-white/10 overflow-hidden">
        <Swiper
          spaceBetween={10}
          navigation={true}
          thumbs={{ swiper: thumbsSwiper }}
          modules={[Navigation, Thumbs]}
          className="product-gallery-main"
          onClick={() => {
            setLightboxIndex(0);
            setLightboxOpen(true);
          }}
        >
          {images.map((image, index) => (
            <SwiperSlide key={index}>
              <div className="aspect-square cursor-zoom-in relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt={`${title} - ${index + 1}`}
                  className="w-full h-full object-contain bg-gradient-to-br from-zinc-900 to-black"
                />
                {/* Zoom icon overlay */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-black/50 backdrop-blur rounded-full p-2">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Thumbnails Swiper */}
      {images.length > 1 && (
        <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-3">
          <Swiper
            onSwiper={(swiper) => setThumbsSwiper(swiper)}
            spaceBetween={10}
            slidesPerView={4}
            freeMode={true}
            watchSlidesProgress={true}
            modules={[FreeMode, Navigation, Thumbs]}
            className="product-gallery-thumbs"
            breakpoints={{
              320: { slidesPerView: 3 },
              640: { slidesPerView: 4 },
              768: { slidesPerView: 5 },
              1024: { slidesPerView: 6 },
            }}
          >
            {images.map((image, index) => (
              <SwiperSlide key={index}>
                <div className="aspect-square rounded-xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-violet-500/50 transition-all">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}

      {/* Lightbox for fullscreen zoom */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={mainImages}
        styles={{
          container: { backgroundColor: "rgba(0, 0, 0, 0.95)" },
        }}
      />
    </div>
  );
}