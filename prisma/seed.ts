await prisma.category.createMany({
  data: [
    {
      name: "پاد دائمی",
      slug: "pod-system",
      description: "انواع دستگاه‌های پاد دائمی",
    },
    {
      name: "پاد موقت",
      slug: "disposable-pod",
      description: "انواع پادهای یکبار مصرف",
    },
    {
      name: "جویس",
      slug: "e-liquid",
      description: "انواع جویس و سالت نیکوتین",
    },
    {
      name: "لوازم جانبی",
      slug: "accessories",
      description: "لوازم جانبی ویپ و پاد",
    },
    {
      name: "کویل",
      slug: "coil",
      description: "انواع کویل دستگاه‌های ویپ و پاد",
    },
    {
      name: "کارتریج",
      slug: "cartridge",
      description: "انواع کارتریج دستگاه‌های پاد",
    },
  ],
  skipDuplicates: true,
});

console.log("✅ Categories seeded successfully.");