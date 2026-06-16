export default function Features() {
  const features = [
    {
      id: 1,
      title: "کیفیت عالی",
      description:
        "محصولات ما با بهترین مواد اولیه و بالاترین استانداردهای کیفیت ساخته می‌شوند.",
    },
    {
      id: 2,
      title: "ارسال سریع",
      description:
        "ارسال به سراسر کشور در کمترین زمان ممکن با بسته‌بندی حرفه‌ای.",
    },
    {
      id: 3,
      title: "پشتیبانی ۲۴ ساعته",
      description:
        "تیم پشتیبانی ما همیشه آماده پاسخگویی به سوالات شماست.",
    },
    {
      id: 4,
      title: "گارانتی اصالت کالا",
      description:
        "تمام محصولات دارای گارانتی اصالت و ضمانت بازگشت وجه می‌باشند.",
    },
    {
      id: 5,
      title: "تخفیف‌های ویژه",
      description:
        "تخفیف‌های ویژه برای اعضای ویژه و خریداران دائمی.",
    },
    {
      id: 6,
      title: "مشاوره رایگان",
      description:
        "مشاوره رایگان قبل از خرید برای انتخاب بهترین محصول.",
    },
  ];

  return (
    <section className="py-40 relative">
      <div className="max-w-7xl mx-auto px-6">

        {/* Section Header */}
        <div className="text-center mb-20">

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
            چرا ما؟
          </span>

          <h2
            className="
              mt-8
              text-5xl
              md:text-6xl
              font-bold
              tracking-tight
            "
          >
            ویژگی‌های منحصر به فرد
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
            تجربه خرید لذت‌بخش با امکانات ویژه فروشگاه پاد بوشهر
          </p>

        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">

          {features.map((feature) => (
            <div
              key={feature.id}
              className="
                group
                p-8
                rounded-3xl
                border
                border-white/10
                bg-white/5
                backdrop-blur-md

                hover:scale-105
                hover:border-white/20

                transition-all
                duration-300
              "
            >
              <div
                className="
                  w-14
                  h-14
                  rounded-2xl
                  bg-gradient-to-br
                  from-violet-500/20
                  to-cyan-500/20
                  mb-6

                  group-hover:scale-110

                  transition-all
                  duration-300
                "
              />

              <h3 className="text-2xl font-semibold">
                {feature.title}
              </h3>

              <p className="mt-4 text-zinc-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
}