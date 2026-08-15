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

export default function ImageGallery({
  images,
  title,
}: ImageGalleryProps) {
  const [thumbsSwiper, setThumbsSwiper] =
    useState<SwiperType | null>(null);

  const [lightboxOpen, setLightboxOpen] =
    useState(false);

  const [lightboxIndex, setLightboxIndex] =
    useState(0);

  const [activeIndex, setActiveIndex] =
    useState(0);

  const [imageErrors, setImageErrors] =
    useState<Record<number, boolean>>({});

  if (!images || images.length === 0) {
    return (
      <div className="rounded-3xl bg-white/[0.03] border border-white/10 overflow-hidden">
        <div className="aspect-square flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
          <div className="text-center">
            <div className="text-6xl mb-4">📷</div>

            <p className="text-zinc-500">
              تصویری موجود نیست
            </p>
          </div>
        </div>
      </div>
    );
  }

  const mainImages = images.map((img, idx) => ({
    src: img,
    alt: `${title} - تصویر ${idx + 1}`,
  }));

  const handleImageError = (index: number) => {
    setImageErrors((prev) => ({
      ...prev,
      [index]: true,
    }));
  };

  return (
    <div className="space-y-4 w-full">
      {/* ==================== MAIN IMAGE SLIDER ==================== */}

      <div className="rounded-3xl bg-white/[0.03] border border-white/10 overflow-hidden">
        <Swiper
          spaceBetween={10}
          navigation={images.length > 1}
          thumbs={{
            swiper:
              thumbsSwiper && !thumbsSwiper.destroyed
                ? thumbsSwiper
                : null,
          }}
          modules={[Navigation, Thumbs]}
          className="product-gallery-main w-full"
          onSlideChange={(swiper) => {
            setActiveIndex(swiper.activeIndex);
          }}
          onClick={(swiper) => {
            const index = swiper.clickedIndex;

            if (
              typeof index === "number" &&
              index >= 0 &&
              index < images.length
            ) {
              setLightboxIndex(index);
            } else {
              setLightboxIndex(activeIndex);
            }

            setLightboxOpen(true);
          }}
        >
          {images.map((image, index) => (
            <SwiperSlide key={`${image}-${index}`}>
              <div className="relative w-full aspect-square cursor-zoom-in group bg-gradient-to-br from-zinc-900 to-black">
                {!imageErrors[index] ? (
                  <img
                    src={image}
                    alt={`${title} - تصویر ${index + 1}`}
                    className="
                      absolute
                      inset-0
                      w-full
                      h-full
                      object-contain
                      p-2
                      sm:p-4
                      md:p-6
                      select-none
                    "
                    loading={
                      index === 0
                        ? "eager"
                        : "lazy"
                    }
                    decoding="async"
                    onError={() =>
                      handleImageError(index)
                    }
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600">
                    <span className="text-5xl mb-3">
                      🖼️
                    </span>

                    <span className="text-sm">
                      تصویر قابل نمایش نیست
                    </span>
                  </div>
                )}

                {/* شماره تصویر */}
                {images.length > 1 && (
                  <div
                    className="
                      absolute
                      top-3
                      left-3
                      z-10
                      px-3
                      py-1
                      rounded-full
                      bg-black/50
                      backdrop-blur-md
                      border border-white/10
                      text-xs
                      text-white
                    "
                  >
                    {index + 1} / {images.length}
                  </div>
                )}

                {/* Zoom icon */}
                <div
                  className="
                    absolute
                    bottom-4
                    right-4
                    z-10
                    opacity-0
                    group-hover:opacity-100
                    transition-opacity
                  "
                >
                  <div className="bg-black/60 backdrop-blur-md rounded-full p-3 border border-white/10">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* ==================== THUMBNAILS ==================== */}

      {images.length > 1 && (
        <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-3">
          <Swiper
            onSwiper={(swiper) => {
              setThumbsSwiper(swiper);
            }}
            spaceBetween={10}
            slidesPerView={3}
            freeMode={true}
            watchSlidesProgress={true}
            modules={[FreeMode, Navigation, Thumbs]}
            className="product-gallery-thumbs"
            breakpoints={{
              320: {
                slidesPerView: 3,
              },
              480: {
                slidesPerView: 4,
              },
              640: {
                slidesPerView: 5,
              },
              768: {
                slidesPerView: 5,
              },
              1024: {
                slidesPerView: 6,
              },
            }}
          >
            {images.map((image, index) => (
              <SwiperSlide
                key={`${image}-thumb-${index}`}
              >
                <div
                  className={`
                    relative
                    aspect-square
                    rounded-xl
                    overflow-hidden
                    cursor-pointer
                    border-2
                    transition-all
                    bg-zinc-900
                    ${
                      activeIndex === index
                        ? "border-violet-500"
                        : "border-transparent hover:border-violet-500/50"
                    }
                  `}
                >
                  {!imageErrors[index] ? (
                    <img
                      src={image}
                      alt={`${title} - thumbnail ${
                        index + 1
                      }`}
                      className="
                        w-full
                        h-full
                        object-cover
                        select-none
                      "
                      loading="lazy"
                      decoding="async"
                      onError={() =>
                        handleImageError(index)
                      }
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-700">
                      🖼️
                    </div>
                  )}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}

      {/* ==================== LIGHTBOX ==================== */}

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={mainImages}
        styles={{
          container: {
            backgroundColor: "rgba(0, 0, 0, 0.96)",
          },
        }}
      />
    </div>
  );
}