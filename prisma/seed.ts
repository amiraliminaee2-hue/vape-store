import { getPrisma } from "../lib/prisma";
import "dotenv/config";

async function main() {
  const prisma = await getPrisma();

  // ==================== CATEGORIES ====================
  const deviceCategory = await prisma.category.upsert({
    where: { slug: "devices" },
    update: {},
    create: {
      name: "دستگاه‌ها",
      slug: "devices",
      description: "انواع دستگاه‌های ویپ پریمیوم",
    },
  });

  const liquidCategory = await prisma.category.upsert({
    where: { slug: "liquids" },
    update: {},
    create: {
      name: "لیکوئیدها",
      slug: "liquids",
      description: "انواع لیکوئید با طعم‌های متنوع",
    },
  });

  const accessoryCategory = await prisma.category.upsert({
    where: { slug: "accessories" },
    update: {},
    create: {
      name: "لوازم جانبی",
      slug: "accessories",
      description: "کویل، تانک و لوازم جانبی",
    },
  });

  // ==================== PRODUCTS ====================
  await prisma.product.upsert({
    where: { slug: "nebula-x" },
    update: {},
    create: {
      title: "Nebula X",
      slug: "nebula-x",
      description:
        "پرچمدار مجموعه Nebula با طراحی آینده‌نگرانه و عملکرد بی‌نظیر. ساخته شده از آلومینیوم هوافضایی با پوشش سرامیکی.",
      price: 3200000,
      stock: 15,
      images: [],
      isFeatured: true,
      categoryId: deviceCategory.id,
      specs: {
        create: [
          { key: "باتری", value: "850mAh" },
          { key: "توان خروجی", value: "45W" },
          { key: "ظرفیت تانک", value: "2ml" },
          { key: "شارژ", value: "USB-C 45min" },
          { key: "جنس بدنه", value: "آلومینیوم" },
        ],
      },
    },
  });

  await prisma.product.upsert({
    where: { slug: "nova-air" },
    update: {},
    create: {
      title: "Nova Air",
      slug: "nova-air",
      description:
        "فوق‌العاده کامپکت و سبک. مناسب برای استفاده روزانه با باتری قدرتمند و طراحی ارگونومیک.",
      price: 2800000,
      stock: 22,
      images: [],
      isFeatured: true,
      categoryId: deviceCategory.id,
      specs: {
        create: [
          { key: "باتری", value: "650mAh" },
          { key: "توان خروجی", value: "30W" },
          { key: "ظرفیت تانک", value: "1.5ml" },
          { key: "شارژ", value: "USB-C 30min" },
          { key: "وزن", value: "68 گرم" },
        ],
      },
    },
  });

  await prisma.product.upsert({
    where: { slug: "titan-pro" },
    update: {},
    create: {
      title: "Titan Pro",
      slug: "titan-pro",
      description:
        "حداکثر عملکرد برای کاربران حرفه‌ای. سیستم جریان هوای دوگانه و تنظیمات پیشرفته.",
      price: 4500000,
      stock: 8,
      images: [],
      isFeatured: true,
      categoryId: deviceCategory.id,
      specs: {
        create: [
          { key: "باتری", value: "1200mAh" },
          { key: "توان خروجی", value: "80W" },
          { key: "ظرفیت تانک", value: "3ml" },
          { key: "شارژ", value: "USB-C 45min" },
          { key: "جریان هوا", value: "دوگانه قابل تنظیم" },
        ],
      },
    },
  });

  await prisma.product.upsert({
    where: { slug: "titan-mini" },
    update: {},
    create: {
      title: "Titan Mini",
      slug: "titan-mini",
      description:
        "نسخه کامپکت Titan Pro با همان کیفیت ساخت در ابعاد کوچک‌تر.",
      price: 2500000,
      stock: 30,
      images: [],
      categoryId: deviceCategory.id,
      specs: {
        create: [
          { key: "باتری", value: "900mAh" },
          { key: "توان خروجی", value: "50W" },
          { key: "ظرفیت تانک", value: "2ml" },
          { key: "شارژ", value: "USB-C 35min" },
        ],
      },
    },
  });

  await prisma.product.upsert({
    where: { slug: "arctic-menthol-50ml" },
    update: {},
    create: {
      title: "Arctic Menthol 50ml",
      slug: "arctic-menthol-50ml",
      description: "لیکوئید نعناع یخی با سردی فوق‌العاده و طعم ماندگار.",
      price: 450000,
      stock: 50,
      images: [],
      categoryId: liquidCategory.id,
      specs: {
        create: [
          { key: "حجم", value: "50ml" },
          { key: "نیکوتین", value: "3mg" },
          { key: "نسبت VG/PG", value: "70/30" },
        ],
      },
    },
  });

  await prisma.product.upsert({
    where: { slug: "mango-tango-30ml" },
    update: {},
    create: {
      title: "Mango Tango 30ml",
      slug: "mango-tango-30ml",
      description: "ترکیب انبه استوایی با لمسی از ترشی ملایم.",
      price: 320000,
      stock: 45,
      images: [],
      categoryId: liquidCategory.id,
      specs: {
        create: [
          { key: "حجم", value: "30ml" },
          { key: "نیکوتین", value: "6mg" },
          { key: "نسبت VG/PG", value: "60/40" },
        ],
      },
    },
  });

  await prisma.product.upsert({
    where: { slug: "mesh-coil-x1" },
    update: {},
    create: {
      title: "Mesh Coil X1",
      slug: "mesh-coil-x1",
      description: "کویل مش با طول عمر بالا و طعم‌رسانی دقیق.",
      price: 180000,
      stock: 40,
      images: [],
      categoryId: accessoryCategory.id,
      specs: {
        create: [
          { key: "نوع", value: "Mesh Coil" },
          { key: "مقاومت", value: "0.8Ω" },
        ],
      },
    },
  });

  // ==================== SHIPPING METHODS ====================
  const shippingMethods = [
    { name: "پست پیشتاز", code: "post", basePrice: 45000, pricePerKg: 5000, estimatedDays: "۲-۳ روز کاری" },
    { name: "تیپاکس", code: "tipax", basePrice: 65000, pricePerKg: 8000, estimatedDays: "۱-۲ روز کاری" },
    { name: "اسنپ باکس", code: "snapp", basePrice: 55000, pricePerKg: 6000, estimatedDays: "همان روز" },
  ];

  for (const method of shippingMethods) {
    await prisma.shippingMethod.upsert({
      where: { code: method.code },
      update: {},
      create: method,
    });
  }
  console.log("✅ Shipping methods seeded");

  // ==================== PAYMENT METHODS ====================
  const paymentMethods = [
    { 
      name: "پرداخت آنلاین", 
      code: "online", 
      isActive: true, 
      settings: { gateway: "zarinpal" } 
    },
    { 
      name: "کارت به کارت", 
      code: "cart2cart", 
      isActive: true, 
      settings: { 
        cardNumber: "6037-****-****-****",
        bankName: "بانک ملی",
        accountName: "فروشگاه ویپ",
        message: "لطفاً مبلغ را به شماره کارت ۶۰۳۷-****-****-**** واریز کنید و رسید را در تلگرام یا روبیکا ارسال نمایید."
      } 
    },
  ];

  for (const method of paymentMethods) {
    await prisma.paymentMethod.upsert({
      where: { code: method.code },
      update: {},
      create: method,
    });
  }
  console.log("✅ Payment methods seeded");

  // ==================== SETTINGS ====================
  
  // Contact Settings
  await prisma.setting.upsert({
    where: { key: "site_phone" },
    update: {},
    create: {
      key: "site_phone",
      value: "۰۲۱-۱۲۳۴۵۶۷۸",
      type: "text",
      group: "contact",
      label: "شماره تماس",
    },
  });

  await prisma.setting.upsert({
    where: { key: "site_email" },
    update: {},
    create: {
      key: "site_email",
      value: "info@vapestore.ir",
      type: "text",
      group: "contact",
      label: "ایمیل",
    },
  });

  await prisma.setting.upsert({
    where: { key: "site_address" },
    update: {},
    create: {
      key: "site_address",
      value: "تهران، خیابان ولیعصر، پلاک ۱۲۳",
      type: "text",
      group: "contact",
      label: "آدرس",
    },
  });

  await prisma.setting.upsert({
    where: { key: "working_hours" },
    update: {},
    create: {
      key: "working_hours",
      value: "شنبه تا پنجشنبه ۱۰ صبح تا ۸ شب",
      type: "text",
      group: "contact",
      label: "ساعات کاری",
    },
  });

  // Social Media
  await prisma.setting.upsert({
    where: { key: "instagram_url" },
    update: {},
    create: {
      key: "instagram_url",
      value: "https://instagram.com/vapestore",
      type: "text",
      group: "social",
      label: "اینستاگرام",
    },
  });

  await prisma.setting.upsert({
    where: { key: "telegram_url" },
    update: {},
    create: {
      key: "telegram_url",
      value: "https://t.me/vapestore",
      type: "text",
      group: "social",
      label: "تلگرام",
    },
  });

  await prisma.setting.upsert({
    where: { key: "whatsapp_url" },
    update: {},
    create: {
      key: "whatsapp_url",
      value: "https://wa.me/989123456789",
      type: "text",
      group: "social",
      label: "واتساپ",
    },
  });

  await prisma.setting.upsert({
    where: { key: "rubika_url" },
    update: {},
    create: {
      key: "rubika_url",
      value: "https://rubika.ir/vapestore",
      type: "text",
      group: "social",
      label: "روبیکا",
    },
  });

  // Payment Settings
  await prisma.setting.upsert({
    where: { key: "cart2cart_telegram" },
    update: {},
    create: {
      key: "cart2cart_telegram",
      value: "https://t.me/vapestore_support",
      type: "text",
      group: "payment",
      label: "تلگرام برای کارت به کارت",
    },
  });

  await prisma.setting.upsert({
    where: { key: "cart2cart_rubika" },
    update: {},
    create: {
      key: "cart2cart_rubika",
      value: "https://rubika.ir/vapestore_support",
      type: "text",
      group: "payment",
      label: "روبیکا برای کارت به کارت",
    },
  });

  await prisma.setting.upsert({
    where: { key: "cart2cart_card_number" },
    update: {},
    create: {
      key: "cart2cart_card_number",
      value: "6037-****-****-****",
      type: "text",
      group: "payment",
      label: "شماره کارت",
    },
  });

  // Site Texts
  await prisma.setting.upsert({
    where: { key: "about_us_text" },
    update: {},
    create: {
      key: "about_us_text",
      value: "فروشگاه تخصصی ویپ و پاد با بهترین کیفیت و قیمت مناسب",
      type: "text",
      group: "general",
      label: "درباره ما",
    },
  });

  await prisma.setting.upsert({
    where: { key: "footer_text" },
    update: {},
    create: {
      key: "footer_text",
      value: "© ۲۰۲۴ فروشگاه ویپ. تمامی حقوق محفوظ است.",
      type: "text",
      group: "general",
      label: "متن فوتر",
    },
  });

  await prisma.setting.upsert({
    where: { key: "header_text" },
    update: {},
    create: {
      key: "header_text",
      value: "به فروشگاه ویپ خوش آمدید",
      type: "text",
      group: "general",
      label: "متن هدر",
    },
  });

  // SEO Settings
  await prisma.setting.upsert({
    where: { key: "meta_title" },
    update: {},
    create: {
      key: "meta_title",
      value: "فروشگاه ویپ | بهترین قیمت پاد و لیکوئید",
      type: "text",
      group: "seo",
      label: "عنوان سایت",
    },
  });

  await prisma.setting.upsert({
    where: { key: "meta_description" },
    update: {},
    create: {
      key: "meta_description",
      value: "فروشگاه تخصصی ویپ، پاد، لیکوئید و لوازم جانبی",
      type: "text",
      group: "seo",
      label: "توضیحات متا",
    },
  });

  await prisma.setting.upsert({
    where: { key: "meta_keywords" },
    update: {},
    create: {
      key: "meta_keywords",
      value: "ویپ, پاد, لیکوئید, فروشگاه ویپ",
      type: "text",
      group: "seo",
      label: "کلمات کلیدی",
    },
  });

  console.log("✅ Seed completed successfully (Products + Settings + Shipping + Payment)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    const prisma = await getPrisma();
    await prisma.$disconnect();
  });