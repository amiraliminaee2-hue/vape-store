"use client";

export default function ProductDetail() {
  return (
    <section className="py-40">
      <div className="max-w-7xl mx-auto px-6">

        <div className="grid lg:grid-cols-2 gap-20 items-center">

          <div>
            <span
              className="
                px-4
                py-2
                rounded-full
                border
                border-zinc-800
                bg-zinc-900/50
              "
            >
              مهندسی پیشرفته
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
              طراحی شده
              <br />
              برای عملکرد
            </h2>

            <p
              className="
                mt-8
                text-zinc-400
                text-lg
                leading-relaxed
              "
            >
              هر جزئیات به‌گونه‌ای طراحی شده تا تجربه‌ای پریمیوم، یکنواخت و لوکس ارائه دهد.
            </p>
          </div>

          <div className="space-y-8">

            <div className="p-8 rounded-3xl border border-white/10 bg-white/5">
              <h3 className="text-2xl font-semibold">
                جریان هوای هوشمند
              </h3>

              <p className="mt-4 text-zinc-400">
                سیستم جریان هوای تطبیقی برای تجربه‌ای نرم‌تر.
              </p>
            </div>

            <div className="p-8 rounded-3xl border border-white/10 bg-white/5">
              <h3 className="text-2xl font-semibold">
                باتری پریمیوم
              </h3>

              <p className="mt-4 text-zinc-400">
                توان بادوام با بهینه‌سازی مصرف انرژی.
              </p>
            </div>

            <div className="p-8 rounded-3xl border border-white/10 bg-white/5">
              <h3 className="text-2xl font-semibold">
                ساخت دقیق
              </h3>

              <p className="mt-4 text-zinc-400">
                ساخته‌شده با مواد باکیفیت و مهندسی دقیق.
              </p>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}