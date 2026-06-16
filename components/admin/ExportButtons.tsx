"use client";

interface ExportButtonsProps {
  type: "users" | "products" | "orders";
}

export default function ExportButtons({ type }: ExportButtonsProps) {
  const handleExport = (format: "xlsx" | "csv") => {
    window.open(`/api/admin/reports/export?type=${type}&format=${format}`, "_blank");
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleExport("xlsx")}
        className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center gap-2 text-sm font-medium"
      >
        📊 خروجی Excel
      </button>
      <button
        onClick={() => handleExport("csv")}
        className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 transition-colors flex items-center gap-2 text-sm font-medium"
      >
        📄 خروجی CSV
      </button>
    </div>
  );
}