import { notFound } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface PageData {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  image: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  status: string;
  publishedAt: Date | null;
  updatedAt: Date;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const prisma = await getPrisma();
  
  const page: PageData | null = await prisma.page.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
    },
  });

  if (!page) {
    return {
      title: "صفحه یافت نشد",
    };
  }

  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || page.excerpt || undefined,
  };
}

export default async function PagePage({ params }: PageProps) {
  const { slug } = await params;
  const prisma = await getPrisma();
  
  const page: PageData | null = await prisma.page.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
    },
  });

  if (!page) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* لینک بازگشت */}
        <Link href="/" className="inline-block mb-8 text-zinc-400 hover:text-white transition">
          ← بازگشت به صفحه اصلی
        </Link>

        {/* تصویر شاخص */}
        {page.image && (
          <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden mb-8">
            <Image
              src={page.image}
              alt={page.title}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* عنوان */}
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{page.title}</h1>

        {/* تاریخ انتشار */}
        {page.publishedAt && (
          <p className="text-zinc-500 mb-8">
            {new Date(page.publishedAt).toLocaleDateString("fa-IR")}
          </p>
        )}

        {/* محتوا */}
        <div
          className="prose prose-invert prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />

        {/* فوتر */}
        <div className="mt-12 pt-8 border-t border-white/10 text-center text-zinc-500 text-sm">
          <p>تاریخ آخرین بروزرسانی: {new Date(page.updatedAt).toLocaleDateString("fa-IR")}</p>
        </div>
      </div>
    </main>
  );
}