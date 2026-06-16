"use client";

import { useEffect, useState, useCallback, useRef, startTransition } from "react";
import ProductCard from "@/components/shop/ProductCard";
import PriceFilter from "@/components/shop/PriceFilter";
import gsap from "gsap";

interface Spec {
  id: number;
  key: string;
  value: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Product {
  id: number;
  title: string;
  price: number;
  images: string[];
  category: Category;
  specs: Spec[];
  stock: number;
  isFeatured: boolean;
  slug: string;
  averageRating?: number;
  reviewCount?: number;
}

const SORT_OPTIONS = [
  { value: "newest", label: "جدیدترین" },
  { value: "price_asc", label: "ارزان‌ترین" },
  { value: "price_desc", label: "گران‌ترین" },
  { value: "name", label: "حروف الفبا" },
];

const CATEGORY_OPTIONS = [
  { value: "", label: "همه محصولات" },
  { value: "devices", label: "دستگاه‌ها" },
  { value: "liquids", label: "لیکوئیدها" },
  { value: "accessories", label: "لوازم جانبی" },
];

// Get min and max price from products
const getPriceRange = (products: Product[]) => {
  if (products.length === 0) return { min: 0, max: 10000000 };
  const prices = products.map(p => p.price);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
};

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [category, setCategory] = useState("");
  const [searchInput, setSearchInput] = useState("");
  
  // Price filter states
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(10000000);
  const [globalMinPrice, setGlobalMinPrice] = useState<number>(0);
  const [globalMaxPrice, setGlobalMaxPrice] = useState<number>(10000000);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [priceRangeLoaded, setPriceRangeLoaded] = useState(false);

  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Fetch all products once to get price range
  useEffect(() => {
    async function fetchAllProducts() {
      try {
        const res = await fetch(`/api/products?limit=1000&admin=true`);
        const data = await res.json();
        if (isMounted.current && data.products) {
          setAllProducts(data.products);
          const { min, max } = getPriceRange(data.products);
          setGlobalMinPrice(min);
          setGlobalMaxPrice(max);
          setMinPrice(min);
          setMaxPrice(max);
          setPriceRangeLoaded(true);
        }
      } catch (error) {
        console.error("Error fetching price range:", error);
        setPriceRangeLoaded(true);
      }
    }
    fetchAllProducts();
  }, []);

  const fetchProducts = useCallback(async () => {
    const params = new URLSearchParams();
    if (category && category !== "") params.set("category", category);
    if (search && search.trim() !== "") params.set("search", search.trim());
    if (sort) params.set("sort", sort);
    params.set("page", String(page));
    params.set("limit", "12");
    
    // Add price filters
    if (minPrice > 0 && minPrice !== globalMinPrice) params.set("minPrice", String(minPrice));
    if (maxPrice < globalMaxPrice && maxPrice !== globalMaxPrice) params.set("maxPrice", String(maxPrice));

    try {
      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();

      if (isMounted.current) {
        startTransition(() => {
          setProducts(data.products || []);
          setTotal(data.total || 0);
          setTotalPages(data.totalPages || 1);
          setLoading(false);
        });
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      if (isMounted.current) {
        startTransition(() => {
          setLoading(false);
        });
      }
    }
  }, [category, search, sort, page, minPrice, maxPrice, globalMinPrice, globalMaxPrice]);

  useEffect(() => {
    if (!priceRangeLoaded) return;
    
    startTransition(() => {
      setLoading(true);
    });
    
    const timer = setTimeout(() => {
      fetchProducts();
    }, 100); // Small delay to prevent race conditions
    
    return () => clearTimeout(timer);
  }, [fetchProducts, priceRangeLoaded]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, category, sort, minPrice, maxPrice]);

  useEffect(() => {
    if (!headerRef.current) return;

    gsap.fromTo(
      headerRef.current,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
    );
  }, []);

  useEffect(() => {
    if (!gridRef.current || loading) return;

    const cards = gridRef.current.querySelectorAll(".product-card-item");

    if (cards.length === 0) return;

    gsap.fromTo(
      cards,
      { opacity: 0, y: 30, scale: 0.97 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.5,
        stagger: 0.07,
        ease: "power3.out",
      }
    );
  }, [products, loading]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleCategoryChange = (val: string) => {
    setCategory(val);
  };

  const handleSortChange = (val: string) => {
    setSort(val);
  };

  const handlePriceChange = (newMin: number, newMax: number) => {
    setMinPrice(newMin);
    setMaxPrice(newMax);
  };

  return (
    <main className="min-h-screen pt-24 sm:pt-28 md:pt-32 pb-16 sm:pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header - ریسپانسیو */}
        <div ref={headerRef} className="text-center sm:text-right">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold">
            فروشگاه
          </h1>
          <p className="mt-2 sm:mt-4 text-zinc-400 text-sm sm:text-base">
            {total} محصول موجود
          </p>
        </div>

        {/* Filters - ریسپانسیو */}
        <div className="mt-8 sm:mt-12 flex flex-col lg:flex-row gap-6 items-start justify-between">
          
          {/* Left side filters - ریسپانسیو */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 w-full lg:w-auto">
            
            {/* Search - ریسپانسیو */}
            <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="جستجوی محصول..."
                className="
                  flex-1 sm:flex-initial
                  px-4 sm:px-5 py-2.5 sm:py-3
                  rounded-full
                  bg-white/5
                  border border-white/10
                  text-white
                  placeholder:text-zinc-500
                  outline-none
                  focus:border-violet-500/50
                  focus:ring-2 focus:ring-violet-500/20
                  transition-all
                  w-full sm:w-56 md:w-64
                "
              />
              <button
                type="submit"
                className="
                  px-5 sm:px-6 py-2.5 sm:py-3
                  rounded-full
                  bg-violet-600
                  hover:bg-violet-500
                  transition-all
                  font-medium
                  text-sm sm:text-base
                  cursor-pointer
                "
              >
                جستجو
              </button>
            </form>

            {/* Category Filter - ریسپانسیو */}
            <div className="flex gap-2 flex-wrap">
              {CATEGORY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleCategoryChange(opt.value)}
                  className={`
                    px-3 sm:px-5 py-2 sm:py-2.5
                    rounded-full
                    border
                    font-medium
                    text-xs sm:text-sm
                    transition-all duration-200
                    whitespace-nowrap
                    cursor-pointer
                    ${
                      category === opt.value
                        ? "bg-white text-black border-white"
                        : "border-white/10 text-zinc-400 hover:border-white/30 hover:text-white"
                    }
                  `}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Sort - ریسپانسیو */}
            <select
              value={sort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="
                px-4 sm:px-5 py-2.5 sm:py-3
                rounded-full
                bg-white/5
                border border-white/10
                text-white
                outline-none
                focus:border-violet-500/50
                transition-colors
                cursor-pointer
                text-sm sm:text-base
                w-full sm:w-auto
              "
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-zinc-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Price Filter - ریسپانسیو */}
          {priceRangeLoaded && (
            <div className="w-full lg:w-64">
              <PriceFilter
                min={globalMinPrice}
                max={globalMaxPrice}
                onPriceChange={handlePriceChange}
              />
            </div>
          )}
        </div>

        {/* Products Grid - ریسپانسیو */}
        <div
          ref={gridRef}
          className="
            mt-12 sm:mt-16
            grid
            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-3
            xl:grid-cols-4
            gap-4 sm:gap-6 lg:gap-8
          "
        >
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="
                  h-[380px] sm:h-[420px] lg:h-[450px]
                  rounded-2xl sm:rounded-3xl
                  border border-white/5
                  bg-white/[0.02]
                  animate-pulse
                "
              />
            ))
          ) : products.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <p className="text-2xl mb-2">🔍</p>
              <p className="text-zinc-500">محصولی یافت نشد</p>
              <p className="text-zinc-600 text-sm mt-1">
                &quot;عبارت را در دسته‌بندی‌های دیگر جستجو کنید&quot;
              </p>
            </div>
          ) : (
            products.map((product) => (
              <div key={product.id} className="product-card-item">
                <ProductCard
                  id={product.id}
                  title={product.title}
                  price={product.price}
                  seller={product.category.name}
                  stock={product.stock}
                  isFeatured={product.isFeatured}
                  images={product.images}
                  averageRating={product.averageRating}
                  reviewCount={product.reviewCount}
                />
              </div>
            ))
          )}
        </div>

        {/* Pagination - ریسپانسیو */}
        {totalPages > 1 && (
          <div className="mt-12 sm:mt-16 flex justify-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="
                w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12
                rounded-full
                border border-white/10
                text-zinc-400
                transition-all duration-200
                hover:border-white/30 hover:text-white
                disabled:opacity-30 disabled:cursor-not-allowed
                text-sm sm:text-base
              "
            >
              ←
            </button>
            
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              
              return (
                <button
                  key={i}
                  onClick={() => setPage(pageNum)}
                  className={`
                    w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12
                    rounded-full
                    border
                    font-medium
                    text-sm sm:text-base
                    transition-all duration-200
                    ${
                      page === pageNum
                        ? "bg-white text-black border-white"
                        : "border-white/10 text-zinc-400 hover:border-white/30 hover:text-white"
                    }
                  `}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="
                w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12
                rounded-full
                border border-white/10
                text-zinc-400
                transition-all duration-200
                hover:border-white/30 hover:text-white
                disabled:opacity-30 disabled:cursor-not-allowed
                text-sm sm:text-base
              "
            >
              →
            </button>
          </div>
        )}

      </div>
    </main>
  );
}