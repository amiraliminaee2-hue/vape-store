"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Seller {
  id: string;
  userId: string;
  storeName: string;
  slug: string;
  description: string | null;
  logo: string | null;
  coverImage: string | null;
  phone: string | null;
  address: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  commission: number;
  totalSales: number;
  totalEarned: number;
  productsCount?: number;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
}

interface StatusLabels {
  [key: string]: string;
}

interface StatusColors {
  [key: string]: string;
}

const statusLabels: StatusLabels = {
  PENDING: "در انتظار تأیید",
  APPROVED: "تأیید شده",
  REJECTED: "رد شده",
  SUSPENDED: "تعلیق شده",
};

const statusColors: StatusColors = {
  PENDING: "bg-yellow-500/20 text-yellow-300",
  APPROVED: "bg-emerald-500/20 text-emerald-300",
  REJECTED: "bg-red-500/20 text-red-300",
  SUSPENDED: "bg-orange-500/20 text-orange-300",
};

interface FilterOption {
  value: string;
  label: string;
}

const filterOptions: FilterOption[] = [
  { value: "ALL", label: "همه" },
  { value: "PENDING", label: "در انتظار تأیید" },
  { value: "APPROVED", label: "تأیید شده" },
  { value: "REJECTED", label: "رد شده" },
  { value: "SUSPENDED", label: "تعلیق شده" },
];

export default function SellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSellers = async (): Promise<void> => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== "ALL") params.set("status", filter);
    if (search) params.set("search", search);
    params.set("page", String(page));
    params.set("limit", "20");

    try {
      const res = await fetch(`/api/admin/sellers?${params.toString()}`);
      const data = await res.json();
      setSellers(data.sellers || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching sellers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, [filter, search, page]);

  const handleSearch = (e: React.FormEvent): void => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleStatusChange = async (sellerId: string, newStatus: string): Promise<void> => {
    setUpdatingId(sellerId);
    try {
      const res = await fetch(`/api/admin/sellers?id=${sellerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchSellers();
      } else {
        alert("خطا در تغییر وضعیت");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("خطا در تغییر وضعیت");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (sellerId: string): Promise<void> => {
    if (!confirm("آیا از حذف این فروشنده مطمئن هستید؟")) return;

    setDeletingId(sellerId);
    try {
      const res = await fetch(`/api/admin/sellers?id=${sellerId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchSellers();
      } else {
        alert("خطا در حذف فروشنده");
      }
    } catch (error) {
      console.error("Error deleting seller:", error);
      alert("خطا در حذف فروشنده");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold">فروشندگان</h1>
          <p className="mt-2 text-zinc-500">{total} فروشنده</p>
        </div>
        <Link
          href="/admin/sellers/new"
          className="px-6 py-3 rounded-full bg-violet-600 hover:bg-violet-500 transition-colors font-medium"
        >
          + افزودن فروشنده
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-3">
          {filterOptions.map((opt: FilterOption) => (
            <button
              key={opt.value}
              onClick={() => {
                setFilter(opt.value);
                setPage(1);
              }}
              className={`
                px-5 py-2.5
                rounded-full
                border
                font-medium
                text-sm
                transition-all duration-200
                ${
                  filter === opt.value
                    ? "bg-white text-black border-white"
                    : "border-white/10 text-zinc-400 hover:border-white/30 hover:text-white"
                }
              `}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
            placeholder="جستجو (نام فروشگاه، ایمیل)..."
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-zinc-600 outline-none focus:border-violet-500/50 w-64"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors"
          >
            جستجو
          </button>
        </form>
      </div>

      {/* Sellers Table */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i: number) => (
            <div key={i} className="h-32 rounded-3xl border border-white/5 bg-white/[0.02] animate-pulse" />
          ))}
        </div>
      ) : sellers.length === 0 ? (
        <div className="rounded-3xl border border-white/10 p-10 text-center">
          <p className="text-zinc-500">فروشنده‌ای یافت نشد</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sellers.map((seller: Seller) => (
            <div
              key={seller.id}
              className="rounded-3xl border border-white/10 bg-white/[0.02] p-6"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold">{seller.storeName}</h3>
                    <span
                      className={`
                        px-3 py-1 rounded-full text-xs font-medium
                        ${statusColors[seller.status]}
                      `}
                    >
                      {statusLabels[seller.status]}
                    </span>
                  </div>

                  <p className="text-sm text-zinc-500 mt-1">
                    slug: {seller.slug}
                  </p>

                  {seller.description && (
                    <p className="text-sm text-zinc-400 mt-2 max-w-2xl">
                      {seller.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-4 mt-3 text-sm">
                    <span className="text-zinc-500">
                      فروشنده: {seller.user?.name || seller.user?.email || "-"}
                    </span>
                    {seller.phone && (
                      <span className="text-zinc-500">📞 {seller.phone}</span>
                    )}
                    <span className="text-zinc-500">
                      📦 محصولات: {seller.productsCount || 0}
                    </span>
                    <span className="text-zinc-500">
                      💰 کمیسیون: {seller.commission}%
                    </span>
                    <span className="text-zinc-500">
                      🏆 مجموع فروش: {seller.totalSales.toLocaleString("fa-IR")} تومان
                    </span>
                  </div>

                  <p className="text-xs text-zinc-600 mt-2">
                    تاریخ عضویت: {new Date(seller.createdAt).toLocaleDateString("fa-IR")}
                  </p>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  {seller.status !== "APPROVED" && (
                    <button
                      onClick={() => handleStatusChange(seller.id, "APPROVED")}
                      disabled={updatingId === seller.id}
                      className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      تأیید
                    </button>
                  )}

                  {seller.status !== "REJECTED" && (
                    <button
                      onClick={() => handleStatusChange(seller.id, "REJECTED")}
                      disabled={updatingId === seller.id}
                      className="px-4 py-2 rounded-xl bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      رد
                    </button>
                  )}

                  {seller.status !== "SUSPENDED" && (
                    <button
                      onClick={() => handleStatusChange(seller.id, "SUSPENDED")}
                      disabled={updatingId === seller.id}
                      className="px-4 py-2 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      تعلیق
                    </button>
                  )}

                  <Link
                    href={`/admin/sellers/${seller.id}`}
                    className="px-4 py-2 rounded-xl bg-violet-600/20 text-violet-400 hover:bg-violet-600 hover:text-white transition-colors text-sm font-medium"
                  >
                    جزئیات
                  </Link>

                  <button
                    onClick={() => handleDelete(seller.id)}
                    disabled={deletingId === seller.id}
                    className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {deletingId === seller.id ? "..." : "حذف"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-3">
          {Array.from({ length: totalPages }).map((_, i: number) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`
                w-10 h-10 rounded-full border transition-all
                ${
                  page === i + 1
                    ? "bg-white text-black border-white"
                    : "border-white/10 text-zinc-400 hover:border-white/30"
                }
              `}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}