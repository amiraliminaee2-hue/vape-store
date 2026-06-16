export default function ProductSpecs() {
  const specs = [
    {
      value: "850mAh",
      label: "باتری",
    },
    {
      value: "45W",
      label: "توان خروجی",
    },
    {
      value: "2ml",
      label: "ظرفیت",
    },
    {
      value: "USB-C",
      label: "شارژ",
    },
  ];

  return (
    <section className="py-40">
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-24">
          <h2 className="text-5xl md:text-7xl font-bold tracking-tight">
            مشخصات فنی
          </h2>

          <p className="mt-6 text-zinc-400 text-lg">
            طراحی‌شده برای عملکرد پریمیوم.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">

          {specs.map((spec) => (
            <div
              key={spec.label}
              className="
                p-10
                rounded-3xl

                border
                border-white/10

                bg-white/5

                backdrop-blur-xl
              "
            >
              <div className="text-4xl font-bold">
                {spec.value}
              </div>

              <div className="mt-3 text-zinc-500">
                {spec.label}
              </div>
            </div>
          ))}

        </div>

      </div>
    </section>
  );
}