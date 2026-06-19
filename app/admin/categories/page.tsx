export const dynamic = 'force-dynamic';  // 👈 این خط اضافه شد

import { getPrisma } from "@/lib/prisma";

interface Category {
  id: number;
  name: string;
  description: string | null;
  _count: {
    products: number;
  };
}

export default async function CategoriesPage() {
  const prisma = await getPrisma();
  
  const categories: Category[] = await prisma.category.findMany({
    include: {
      _count: {
        select: {
          products: true,
        },
      },
    },
  });

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">
        دسته بندی ها
      </h1>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {categories.map((category: Category) => (
          <div
            key={category.id}
            className="
              rounded-3xl
              border border-white/10
              p-6
              bg-white/[0.03]
            "
          >
            <h2 className="text-xl font-semibold">
              {category.name}
            </h2>

            <p className="text-zinc-500 mt-2">
              {category.description}
            </p>

            <div className="mt-5 text-violet-400">
              {category._count.products} محصول
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}