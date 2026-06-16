import { notFound } from "next/navigation";
import { getPrisma } from "@/lib/prisma";

const prisma = await getPrisma();
const data = await prisma.user.findMany();
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import AddToCartButton from "@/components/ui/AddToCartButton";
import WishlistButton from "../../../components/product/WishlistButton";
import PriceWithDiscount from "@/components/ui/PriceWithDiscount";
import StarRating from "@/components/ui/StarRating";
import ProductReviews from "@/components/ui/ProductReviews";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  
  // تلاش برای پیدا کردن محصول با slug یا id
  const isNumeric = /^\d+$/.test(slug);
  let product;
  
  if (isNumeric) {
    product = await prisma.product.findFirst({
      where: {
        id: parseInt(slug),
        isActive: true,
      },
    });
  } else {
    product = await prisma.product.findFirst({
      where: {
        slug,
        isActive: true,
      },
    });
  }

  if (!product) {
    return {
      title: "محصول یافت نشد",
    };
  }

  return {
    title: product.title,
    description: product.description.slice(0, 160),
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  
  // تلاش برای پیدا کردن محصول با slug یا id
  const isNumeric = /^\d+$/.test(slug);
  let product;
  
  if (isNumeric) {
    product = await prisma.product.findFirst({
      where: {
        id: parseInt(slug),
        isActive: true,
      },
      include: {
        category: true,
        specs: true,
        comments: {
          where: { status: "APPROVED" },
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });
  } else {
    product = await prisma.product.findFirst({
      where: {
        slug,
        isActive: true,
      },
      include: {
        category: true,
        specs: true,
        comments: {
          where: { status: "APPROVED" },
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });
  }

  if (!product) {
    notFound();
  }

  // محاسبه میانگین امتیاز
  const avgRating = product.comments && product.comments.length > 0
    ? product.comments.reduce((sum, c) => sum + c.rating, 0) / product.comments.length
    : 0;

  // محصولات مشابه
  const similarProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
      isActive: true,
    },
    take: 4,
    include: {
      category: true,
    },
  });

  // تبدیل تصاویر به WebP
  const processImageUrl = (url: string) => {
    if (!url) return null;
    if (url.includes('/uploads/')) {
      const baseUrl = url.replace(/\.[^/.]+$/, '');
      return `${baseUrl}.webp`;
    }
    return url;
  };

  const discountedPrice = product.discountPercent > 0
    ? product.price - (product.price * product.discountPercent / 100)
    : product.price;

  const productSpecs = product.specs || [];
  
  // ✅ اصلاح: تبدیل نظرات به فرمت مناسب برای ProductReviews
  const safeComments = (product.comments || []).map((comment) => ({
    id: comment.id,
    userName: comment.userName,
    rating: comment.rating,
    content: comment.content,
    createdAt: comment.createdAt,
    user: {
      name: comment.user?.name || null,
      email: comment.user?.email || null,
    },
  }));

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f1a] to-[#0a0a0f] text-white">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        
        {/* مسیر راهنما */}
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-8 flex-wrap">
          <Link href="/" className="hover:text-white transition">خانه</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-white transition">فروشگاه</Link>
          <span>/</span>
          <Link href={`/shop?category=${product.category.slug}`} className="hover:text-white transition">
            {product.category.name}
          </Link>
          <span>/</span>
          <span className="text-white">{product.title}</span>
        </div>

        {/* محصول اصلی */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          
          {/* تصویر */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-white/10 backdrop-blur-sm">
              {product.images?.[0] ? (
                <Image
                  src={processImageUrl(product.images[0]) || product.images[0]}
                  alt={product.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl text-zinc-600">
                  🖼️
                </div>
              )}
            </div>
            
            {product.images && product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.slice(1, 5).map((img, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden bg-zinc-900/50 border border-white/10 flex-shrink-0 cursor-pointer hover:border-violet-500 transition">
                    <Image 
                      src={processImageUrl(img) || img} 
                      alt={`${product.title} - ${idx + 2}`} 
                      fill 
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* اطلاعات محصول */}
          <div className="space-y-6">
            <div>
              {product.discountPercent > 0 && (
                <span className="inline-block mb-3 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm font-semibold">
                  {product.discountPercent}% تخفیف ویژه
                </span>
              )}
              <div className="flex items-start justify-between">
                <h1 className="text-3xl md:text-4xl font-bold">{product.title}</h1>
                <WishlistButton productId={product.id} />
              </div>
              
              <div className="flex items-center gap-2 mt-3">
                <StarRating rating={avgRating} />
                <span className="text-sm text-zinc-500">
                  ({safeComments.length} نظر)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-zinc-400">موجودی:</span>
              {product.stock > 0 ? (
                <span className="text-green-400 font-semibold">{product.stock} عدد باقی مانده</span>
              ) : (
                <span className="text-red-400 font-semibold">ناموجود</span>
              )}
            </div>

            <div className="border-t border-b border-white/10 py-4">
              <PriceWithDiscount
                price={product.price}
                discountPercent={product.discountPercent}
                className="space-y-1"
              />
              {product.discountPercent > 0 && (
                <p className="text-sm text-green-400 mt-2">
                  شما {((product.price - discountedPrice) / 1000).toFixed(0)} هزار تومان صرفه‌جویی می‌کنید!
                </p>
              )}
            </div>

            <AddToCartButton
              productId={product.id}
              productTitle={product.title}
              productPrice={discountedPrice}
              stock={product.stock}
            />

            <div>
              <h2 className="text-xl font-semibold mb-3">توضیحات محصول</h2>
              <p className="text-zinc-300 leading-relaxed">{product.description}</p>
            </div>
          </div>
        </div>

        {/* مشخصات فنی */}
        {productSpecs.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6">مشخصات فنی</h2>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
                {productSpecs.map((spec, idx) => (
                  <div key={spec.id} className={`p-4 flex justify-between ${idx % 2 === 0 ? "bg-white/5" : ""}`}>
                    <span className="text-zinc-400">{spec.key}</span>
                    <span className="font-medium text-violet-300">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* نظرات کاربران */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">
            نظرات کاربران ({safeComments.length})
          </h2>
          
          <ProductReviews 
            productId={product.id}
            initialComments={safeComments}
            averageRating={avgRating}
          />
        </div>

        {/* محصولات مشابه */}
        {similarProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">محصولات مشابه</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {similarProducts.map((similar) => {
                const similarDiscountedPrice = similar.discountPercent > 0
                  ? similar.price - (similar.price * similar.discountPercent / 100)
                  : similar.price;
                  
                return (
                  <Link
                    key={similar.id}
                    href={`/product/${similar.slug}`}
                    className="group bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden hover:border-violet-500/50 hover:scale-105 transition-all duration-300"
                  >
                    <div className="aspect-square relative bg-zinc-900/50">
                      {similar.images?.[0] ? (
                        <Image
                          src={processImageUrl(similar.images[0]) || similar.images[0]}
                          alt={similar.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl text-zinc-600">
                          🖼️
                        </div>
                      )}
                      {similar.discountPercent > 0 && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          {similar.discountPercent}%
                        </div>
                      )}
                    </div>
                    <div className="p-3 text-center">
                      <h3 className="text-sm font-semibold line-clamp-1 group-hover:text-violet-400 transition">
                        {similar.title}
                      </h3>
                      <div className="mt-1">
                        {similar.discountPercent > 0 ? (
                          <div className="flex flex-col items-center">
                            <span className="text-xs text-zinc-500 line-through">
                              {similar.price.toLocaleString("fa-IR")}
                            </span>
                            <span className="text-violet-400 text-sm font-bold">
                              {similarDiscountedPrice.toLocaleString("fa-IR")} تومان
                            </span>
                          </div>
                        ) : (
                          <span className="text-violet-400 text-sm font-bold">
                            {similar.price.toLocaleString("fa-IR")} تومان
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}