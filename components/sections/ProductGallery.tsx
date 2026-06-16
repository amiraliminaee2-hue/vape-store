"use client";

const products = [
  {
    id: 1,
    title: "نپتون X",
    subtitle: "دستگاه پرچمدار",
  },
  {
    id: 2,
    title: "نوا ایر",
    subtitle: "فوق‌العاده کامپکت",
  },
  {
    id: 3,
    title: "تایتان پرو",
    subtitle: "حداکثر عملکرد",
  },
];

export default function ProductGallery() {
  return (
    <section className="py-40">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-24">

          <span
            className="
              inline-block
              px-4
              py-2
              rounded-full
              border
              border-zinc-800
              bg-zinc-900/50
            "
          >
            مجموعه محصولات
          </span>

          <h2
            className="
              mt-8
              text-5xl
              md:text-7xl
              font-bold
              tracking-tight
            "
          >
            محصولات پرفروش
          </h2>

          <p
            className="
              mt-6
              text-zinc-400
              text-lg
              max-w-2xl
              mx-auto
            "
          >
            مجموعه‌ای از بهترین و پرفروش‌ترین محصولات ویپ و پاد
          </p>

        </div>

        {/* Cards */}
        <div className="grid lg:grid-cols-3 gap-8">

          {products.map((product) => (
            <div
              key={product.id}
              className="
                group
                relative
                overflow-hidden

                h-[700px]

                rounded-[40px]

                border
                border-white/10

                bg-white/[0.03]

                backdrop-blur-xl

                transition-all
                duration-500

                hover:scale-[1.02]
                hover:border-white/20
              "
            >
              {/* Glow */}
              <div
                className="
                  absolute
                  inset-0

                  opacity-0

                  bg-gradient-to-b
                  from-violet-500/10
                  to-cyan-500/10

                  transition-opacity
                  duration-500

                  group-hover:opacity-100
                "
              />

              {/* Fake Product */}
              <div
                className="
                  absolute
                  top-20
                  left-1/2
                  -translate-x-1/2

                  w-[180px]
                  h-[420px]

                  rounded-[40px]

                  bg-gradient-to-b
                  from-zinc-500
                  to-zinc-900

                  transition-transform
                  duration-500

                  group-hover:translate-y-[-10px]
                "
              />

              {/* Text */}
              <div
                className="
                  absolute
                  bottom-12
                  left-10
                  right-10
                "
              >
                <p className="text-zinc-500">
                  {product.subtitle}
                </p>

                <h3
                  className="
                    mt-3
                    text-4xl
                    font-bold
                  "
                >
                  {product.title}
                </h3>
              </div>
            </div>
          ))}

        </div>

      </div>
    </section>
  );
}