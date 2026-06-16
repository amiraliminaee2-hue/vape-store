import { z } from "zod";

// Common schemas
export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "id باید عدد باشد"),
});

export const productIdParamSchema = z.object({
  productId: z.string().regex(/^\d+$/, "productId باید عدد باشد"),
});

// Spec schemas (قبل از productBaseSchema تعریف شود)
export const specsItemSchema = z.object({
  key: z.string().min(1, "کلید مشخصات نمی‌تواند خالی باشد"),
  value: z.string().min(1, "مقدار مشخصات نمی‌تواند خالی باشد"),
});

export const specsArraySchema = z.array(specsItemSchema).optional().default([]);

// Product schemas
export const productBaseSchema = {
  title: z.string().min(2, "عنوان محصول حداقل ۲ کاراکتر باید باشد").max(200, "عنوان محصول حداکثر ۲۰۰ کاراکتر است"),
  slug: z.string().min(2, "slug حداقل ۲ کاراکتر باید باشد").max(200, "slug حداکثر ۲۰۰ کاراکتر است").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug نامعتبر است"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "قیمت نمی‌تواند منفی باشد"),
  stock: z.coerce.number().int("موجودی باید عدد صحیح باشد").min(0, "موجودی نمی‌تواند منفی باشد"),
  images: z.array(z.string()).optional().default([]),
  isActive: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
  categoryId: z.coerce.number().int("categoryId باید عدد صحیح باشد").positive("categoryId نامعتبر است"),
  specs: z.array(specsItemSchema).optional().default([]),
};

export const productCreateSchema = z.object(productBaseSchema);

export const productUpdateSchema = z.object({
  ...productBaseSchema,
  slug: z.string().optional(),
});

// Comment schemas
export const commentCreateSchema = z.object({
  productId: z.coerce.number().positive("productId معتبر نیست"),
  content: z.string().min(1, "متن نظر نمی‌تواند خالی باشد").max(1000, "متن نظر حداکثر ۱۰۰۰ کاراکتر است"),
  rating: z.coerce.number().min(1, "امتیاز باید بین ۱ تا ۵ باشد").max(5, "امتیاز باید بین ۱ تا ۵ باشد"),
});

export const commentStatusSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
});

// Cart schemas
export const cartItemSchema = z.object({
  productId: z.coerce.number().positive("productId معتبر نیست"),
  quantity: z.coerce.number().int().min(1, "تعداد باید حداقل ۱ باشد").max(99, "تعداد حداکثر ۹۹ است"),
});

export const cartActionSchema = z.object({
  action: z.enum(["increase", "decrease"]),
});

// ==================== Order schemas با فیلدهای جدید ====================
export const orderCreateSchema = z.object({
  address: z.string().min(5, "آدرس حداقل ۵ کاراکتر باید باشد").max(500, "آدرس حداکثر ۵۰۰ کاراکتر است"),
  phone: z.string().regex(/^09[0-9]{9}$/, "شماره تلفن نامعتبر است"),
  customerNote: z.string().max(500, "یادداشت حداکثر ۵۰۰ کاراکتر است").optional(),
  adminNote: z.string().max(500, "یادداشت حداکثر ۵۰۰ کاراکتر است").optional(),
  items: z.array(z.object({
    productId: z.coerce.number().positive(),
    quantity: z.coerce.number().int().min(1),
  })).min(1, "سبد خرید خالی است"),
  // فیلدهای کد تخفیف
  couponCode: z.string().optional(),
  discountAmount: z.number().min(0).optional().default(0),
  // ✅ فیلدهای جدید روش ارسال و پرداخت
  shippingMethodId: z.number().optional().nullable(),
  paymentMethodId: z.number().optional().nullable(),
  shippingPrice: z.number().min(0).optional().default(0),
});

export const orderStatusSchema = z.object({
  status: z.enum(["REGISTERED", "PAYED", "PROCESSING", "SHIPPING", "SHIPPED", "CANCELLED", "ERROR"]),
});

// User profile schemas
export const userProfileSchema = z.object({
  firstName: z.string().max(100, "نام حداکثر ۱۰۰ کاراکتر است").optional(),
  lastName: z.string().max(100, "نام خانوادگی حداکثر ۱۰۰ کاراکتر است").optional(),
  phone: z.string().regex(/^09[0-9]{9}$/, "شماره تلفن نامعتبر است").optional(),
});

export const addressSchema = z.object({
  label: z.string().min(1, "برچسب آدرس نمی‌تواند خالی باشد").max(50, "برچسب آدرس حداکثر ۵۰ کاراکتر است"),
  address: z.string().min(5, "آدرس حداقل ۵ کاراکتر باید باشد").max(500, "آدرس حداکثر ۵۰۰ کاراکتر است"),
});

// Wishlist schemas
export const wishlistItemSchema = z.object({
  productId: z.coerce.number().positive("productId معتبر نیست"),
});

// Category schemas
export const categoryCreateSchema = z.object({
  name: z.string().min(2, "نام دسته‌بندی حداقل ۲ کاراکتر باید باشد").max(100, "نام دسته‌بندی حداکثر ۱۰۰ کاراکتر است"),
  slug: z.string().min(2, "slug حداقل ۲ کاراکتر باید باشد").max(100, "slug حداکثر ۱۰۰ کاراکتر است").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug نامعتبر است"),
  description: z.string().optional(),
  image: z.string().url("آدرس تصویر نامعتبر است").optional(),
});

// Query params schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  sort: z.enum(["newest", "price_asc", "price_desc", "name"]).default("newest"),
});

export const productFiltersSchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  admin: z.enum(["true", "false"]).optional(),
});