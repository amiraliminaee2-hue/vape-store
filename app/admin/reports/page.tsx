"use client";

import { useEffect, useState } from "react";

// ---- Types ----
interface DailySale {
  date: string;
  revenue: number;
  count: number;
}

interface MonthlySale {
  month: string;
  revenue: number;
  count: number;
}

interface TopProduct {
  productId: number;
  title: string;
  price: number;
  totalQuantity: number;
  totalOrders: number;
}

interface Summary {
  totalRevenue: number;
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  totalOrders: number;
  todayOrders: number;
  weekOrders: number;
  monthOrders: number;
}

interface ReportsData {
  dailySales: DailySale[];
  monthlySales: MonthlySale[];
  summary: Summary;
  topProducts: TopProduct[];
}

// ---- Persian month names ----
const persianMonths: Record<string, string> = {
  "01": "ژانویه",
  "02": "فوریه",
  "03": "مارس",
  "04": "آوریل",
  "05": "مه",
  "06": "ژوئن",
  "07": "ژوئیه",
  "08": "اوت",
  "09": "سپتامبر",
  "10": "اکتبر",
  "11": "نوامبر",
  "12": "دسامبر",
};

// ---- Bar Chart Component ----
function BarChart({
  data,
  labelKey,
  valueKey,
  color,
  formatLabel,
  formatValue,
}: {
  data: Record<string, number | string>[];
  labelKey: string;
  valueKey: string;
  color: string;
  formatLabel: (val: string) => string;
  formatValue: (val: number) => string;
}) {
  const values = data.map((d: Record<string, number | string>) => Number(d[valueKey]));
  const maxValue = Math.max(...values, 1);

  return (
    <div className="w-full overflow-x-auto">
      <div
        className="flex items-end gap-1 min-w-0"
        style={{ minWidth: `${data.length * 28}px`, height: "220px" }}
      >
        {data.map((item: Record<string, number | string>, index: number) => {
          const value = Number(item[valueKey]);
          const heightPercent = maxValue > 0 ? (value / maxValue) * 100 : 0;
          const label = String(item[labelKey]);

          return (
            <div
              key={index}
              className="flex flex-col items-center flex-1 group relative"
              style={{ height: "100%" }}
            >
              {/* Tooltip */}
              <div
                className="
                  absolute bottom-full mb-2 left-1/2 -translate-x-1/2
                  bg-zinc-800 border border-white/10 rounded-xl px-3 py-2
                  text-xs whitespace-nowrap opacity-0 group-hover:opacity-100
                  transition-opacity pointer-events-none z-10
                "
              >
                <p className="font-semibold text-white">
                  {formatLabel(label)}
                </p>
                <p className="text-zinc-300 mt-0.5">{formatValue(value)}</p>
                <p className="text-zinc-500 text-[10px]">
                  {Number(item["count"] ?? 0)} سفارش
                </p>
              </div>

              {/* Bar container */}
              <div
                className="w-full flex items-end justify-center"
                style={{ height: "100%" }}
              >
                <div
                  className="w-full rounded-t-md transition-all duration-500"
                  style={{
                    height: `${heightPercent}%`,
                    minHeight: value > 0 ? "4px" : "0px",
                    background: color,
                    opacity: value > 0 ? 1 : 0.2,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* X axis labels - show every N-th */}
      <div
        className="flex gap-1 mt-2"
        style={{ minWidth: `${data.length * 28}px` }}
      >
        {data.map((item: Record<string, number | string>, index: number) => {
          const label = String(item[labelKey]);
          const showLabel =
            data.length <= 14 || index % Math.ceil(data.length / 14) === 0;

          return (
            <div
              key={index}
              className="flex-1 text-center text-zinc-600 overflow-hidden"
              style={{ fontSize: "9px" }}
            >
              {showLabel ? formatLabel(label).slice(-5) : ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- Line Chart Component ----
function LineChart({
  data,
  labelKey,
  valueKey,
  color,
  formatLabel,
  formatValue,
}: {
  data: Record<string, number | string>[];
  labelKey: string;
  valueKey: string;
  color: string;
  formatLabel: (val: string) => string;
  formatValue: (val: number) => string;
}) {
  const values = data.map((d: Record<string, number | string>) => Number(d[valueKey]));
  const maxValue = Math.max(...values, 1);
  const minValue = 0;
  const range = maxValue - minValue || 1;

  const width = 600;
  const height = 200;
  const paddingX = 10;
  const paddingY = 20;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const points = data.map((item: Record<string, number | string>, index: number) => {
    const x = paddingX + (index / Math.max(data.length - 1, 1)) * chartWidth;
    const value = Number(item[valueKey]);
    const y =
      paddingY + chartHeight - ((value - minValue) / range) * chartHeight;
    return { x, y, value, label: String(item[labelKey]) };
  });

  const pathD = points.reduce((acc: string, point: { x: number; y: number; value: number; label: string }, index: number) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const prev = points[index - 1];
    const cpX = (prev.x + point.x) / 2;
    return `${acc} C ${cpX} ${prev.y} ${cpX} ${point.y} ${point.x} ${point.y}`;
  }, "");

  const areaD =
    pathD +
    ` L ${points[points.length - 1]?.x ?? paddingX} ${height - paddingY} L ${paddingX} ${height - paddingY} Z`;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height + 30}`}
        className="w-full"
        style={{ minWidth: "320px" }}
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio: number, i: number) => {
          const y = paddingY + chartHeight - ratio * chartHeight;
          const val = minValue + ratio * range;
          return (
            <g key={i}>
              <line
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="1"
              />
              <text
                x={paddingX - 4}
                y={y + 4}
                textAnchor="end"
                fill="rgba(255,255,255,0.3)"
                fontSize="8"
              >
                {val >= 1000000
                  ? `${(val / 1000000).toFixed(1)}M`
                  : val >= 1000
                    ? `${(val / 1000).toFixed(0)}K`
                    : val.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Area gradient */}
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        {points.length > 1 && (
          <path d={areaD} fill="url(#areaGrad)" />
        )}

        {/* Line */}
        {points.length > 1 && (
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        )}

        {/* Points & tooltips */}
        {points.map((point: { x: number; y: number; value: number; label: string }, index: number) => (
          <g key={index} className="group">
            {/* Invisible hover area */}
            <circle
              cx={point.x}
              cy={point.y}
              r="12"
              fill="transparent"
            />
            {/* Visible dot */}
            <circle
              cx={point.x}
              cy={point.y}
              r="4"
              fill={color}
              stroke="#050505"
              strokeWidth="2"
              opacity={point.value > 0 ? 1 : 0.3}
            />

            {/* Tooltip */}
            <g opacity="0" className="chart-tooltip">
              <rect
                x={Math.min(point.x - 55, width - 115)}
                y={Math.max(point.y - 55, 0)}
                width="110"
                height="48"
                rx="8"
                fill="#1a1a1a"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
              />
              <text
                x={Math.min(point.x - 55, width - 115) + 55}
                y={Math.max(point.y - 55, 0) + 16}
                textAnchor="middle"
                fill="white"
                fontSize="9"
                fontWeight="600"
              >
                {formatLabel(point.label)}
              </text>
              <text
                x={Math.min(point.x - 55, width - 115) + 55}
                y={Math.max(point.y - 55, 0) + 30}
                textAnchor="middle"
                fill="rgba(255,255,255,0.6)"
                fontSize="8"
              >
                {formatValue(point.value)}
              </text>
              <text
                x={Math.min(point.x - 55, width - 115) + 55}
                y={Math.max(point.y - 55, 0) + 42}
                textAnchor="middle"
                fill="rgba(255,255,255,0.4)"
                fontSize="7"
              >
                {Number(data[index]["count"] ?? 0)} سفارش
              </text>
            </g>
          </g>
        ))}

        {/* X axis labels */}
        {points.map((point: { x: number; y: number; value: number; label: string }, index: number) => {
          const showLabel =
            points.length <= 12 ||
            index % Math.ceil(points.length / 12) === 0;
          if (!showLabel) return null;
          return (
            <text
              key={index}
              x={point.x}
              y={height + 14}
              textAnchor="middle"
              fill="rgba(255,255,255,0.3)"
              fontSize="8"
            >
              {formatLabel(point.label).slice(-5)}
            </text>
          );
        })}
      </svg>

      <style jsx>{`
        g:hover .chart-tooltip {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}

// ---- Main Page ----
export default function AdminReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"daily" | "monthly">("daily");
  const [chartType, setChartType] = useState<"bar" | "line">("bar");

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/reports");
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "خطا در دریافت داده");
        }
        const json: ReportsData = await res.json();
        setData(json);
      } catch (e) {
        setError(e instanceof Error ? e.message : "خطای ناشناخته");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (value: number): string =>
    `${value.toLocaleString("fa-IR")} تومان`;

  const formatDailyLabel = (date: string): string => {
    const parts = date.split("-");
    return `${parts[2]}/${parts[1]}`;
  };

  const formatMonthlyLabel = (month: string): string => {
    const parts = month.split("-");
    return persianMonths[parts[1]] ?? parts[1];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-zinc-400">در حال بارگذاری گزارش‌ها...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center max-w-md">
          <p className="text-4xl mb-4">⚠️</p>
          <p className="text-red-400 font-medium">خطا در بارگذاری گزارش</p>
          <p className="text-zinc-500 text-sm mt-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 transition-colors text-sm font-medium"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { summary, dailySales, monthlySales, topProducts } = data;

  const dailyChartData = dailySales.map((d: DailySale) => ({
    date: d.date,
    revenue: d.revenue,
    count: d.count,
  })) as Record<string, number | string>[];

  const monthlyChartData = monthlySales.map((m: MonthlySale) => ({
    month: m.month,
    revenue: m.revenue,
    count: m.count,
  })) as Record<string, number | string>[];

  // Calculate growth percentages
  const todayGrowthVsMonth =
    summary.monthOrders > 0
      ? ((summary.todayOrders / (summary.monthOrders / 30)) * 100 - 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div>
          <h1 className="text-4xl font-bold">گزارش‌گیری حرفه‌ای</h1>
          <p className="mt-2 text-zinc-500">
            تحلیل فروش و درآمد فروشگاه
          </p>
        </div>

        <div className="flex gap-3">
          <div className="flex rounded-2xl border border-white/10 overflow-hidden">
            <button
              onClick={() => setChartType("bar")}
              className={`px-4 py-2 text-sm transition-colors ${
                chartType === "bar"
                  ? "bg-violet-600 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              📊 میله‌ای
            </button>
            <button
              onClick={() => setChartType("line")}
              className={`px-4 py-2 text-sm transition-colors ${
                chartType === "line"
                  ? "bg-violet-600 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              📈 خطی
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-violet-600/20 to-transparent p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-zinc-400 text-sm">درآمد کل</p>
              <p className="mt-3 text-3xl font-bold">
                {summary.totalRevenue.toLocaleString("fa-IR")}
              </p>
              <p className="mt-1 text-zinc-500 text-xs">تومان</p>
            </div>
            <span className="text-3xl">💰</span>
          </div>
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-zinc-500">
              {summary.totalOrders} سفارش کل
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-600/20 to-transparent p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-zinc-400 text-sm">فروش امروز</p>
              <p className="mt-3 text-3xl font-bold">
                {summary.todayRevenue.toLocaleString("fa-IR")}
              </p>
              <p className="mt-1 text-zinc-500 text-xs">تومان</p>
            </div>
            <span className="text-3xl">📅</span>
          </div>
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-zinc-500">
              {summary.todayOrders} سفارش امروز
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-blue-600/20 to-transparent p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-zinc-400 text-sm">فروش این هفته</p>
              <p className="mt-3 text-3xl font-bold">
                {summary.weekRevenue.toLocaleString("fa-IR")}
              </p>
              <p className="mt-1 text-zinc-500 text-xs">تومان</p>
            </div>
            <span className="text-3xl">📆</span>
          </div>
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-zinc-500">
              {summary.weekOrders} سفارش این هفته
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-orange-600/20 to-transparent p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-zinc-400 text-sm">فروش این ماه</p>
              <p className="mt-3 text-3xl font-bold">
                {summary.monthRevenue.toLocaleString("fa-IR")}
              </p>
              <p className="mt-1 text-zinc-500 text-xs">تومان</p>
            </div>
            <span className="text-3xl">🗓️</span>
          </div>
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-zinc-500">
              {summary.monthOrders} سفارش این ماه
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-0">
        <button
          onClick={() => setActiveTab("daily")}
          className={`
            px-6 py-3 rounded-t-2xl text-sm font-medium transition-all
            ${
              activeTab === "daily"
                ? "bg-white/5 text-white border border-b-0 border-white/10"
                : "text-zinc-500 hover:text-zinc-300"
            }
          `}
        >
          📊 فروش روزانه (۳۰ روز اخیر)
        </button>

        <button
          onClick={() => setActiveTab("monthly")}
          className={`
            px-6 py-3 rounded-t-2xl text-sm font-medium transition-all
            ${
              activeTab === "monthly"
                ? "bg-white/5 text-white border border-b-0 border-white/10"
                : "text-zinc-500 hover:text-zinc-300"
            }
          `}
        >
          📈 فروش ماهانه (۱۲ ماه اخیر)
        </button>
      </div>

      {/* Chart Panel */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 space-y-6">
        {activeTab === "daily" ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">نمودار فروش روزانه</h2>
                <p className="text-sm text-zinc-500 mt-1">
                  درآمد هر روز در ۳۰ روز اخیر
                </p>
              </div>

              <div className="flex gap-6 text-sm">
                <div>
                  <p className="text-zinc-500">بیشترین روز</p>
                  <p className="font-semibold text-emerald-400 mt-1">
                    {formatCurrency(
                      Math.max(...dailySales.map((d: DailySale) => d.revenue))
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500">مجموع سفارشات</p>
                  <p className="font-semibold mt-1">
                    {dailySales
                      .reduce((s: number, d: DailySale) => s + d.count, 0)
                      .toLocaleString("fa-IR")}
                  </p>
                </div>
              </div>
            </div>

            <div className="min-h-[240px]">
              {chartType === "bar" ? (
                <BarChart
                  data={dailyChartData}
                  labelKey="date"
                  valueKey="revenue"
                  color="linear-gradient(180deg, #8b5cf6, #6d28d9)"
                  formatLabel={formatDailyLabel}
                  formatValue={formatCurrency}
                />
              ) : (
                <LineChart
                  data={dailyChartData}
                  labelKey="date"
                  valueKey="revenue"
                  color="#8b5cf6"
                  formatLabel={formatDailyLabel}
                  formatValue={formatCurrency}
                />
              )}
            </div>

            {/* Daily data table */}
            <div className="mt-4">
              <h3 className="text-sm font-medium text-zinc-400 mb-3">
                جدول فروش روزانه
              </h3>
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02]">
                      <th className="px-4 py-3 text-right text-zinc-500 font-medium">
                        تاریخ
                      </th>
                      <th className="px-4 py-3 text-right text-zinc-500 font-medium">
                        تعداد سفارش
                      </th>
                      <th className="px-4 py-3 text-right text-zinc-500 font-medium">
                        درآمد
                      </th>
                      <th className="px-4 py-3 text-right text-zinc-500 font-medium">
                        میانگین سفارش
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {[...dailySales]
                      .reverse()
                      .filter((d: DailySale) => d.count > 0)
                      .map((day: DailySale, index: number) => (
                        <tr
                          key={index}
                          className="hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-4 py-3 text-zinc-300 font-mono">
                            {formatDailyLabel(day.date)}/{day.date.slice(0, 4)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-violet-500" />
                              {day.count.toLocaleString("fa-IR")}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-emerald-400">
                            {day.revenue.toLocaleString("fa-IR")} تومان
                          </td>
                          <td className="px-4 py-3 text-zinc-400">
                            {day.count > 0
                              ? Math.round(
                                  day.revenue / day.count
                                ).toLocaleString("fa-IR")
                              : "—"}{" "}
                            تومان
                          </td>
                        </tr>
                      ))}
                    {dailySales.filter((d: DailySale) => d.count > 0).length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-8 text-center text-zinc-500"
                        >
                          هنوز سفارشی در ۳۰ روز اخیر ثبت نشده است
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">نمودار فروش ماهانه</h2>
                <p className="text-sm text-zinc-500 mt-1">
                  درآمد هر ماه در ۱۲ ماه اخیر
                </p>
              </div>

              <div className="flex gap-6 text-sm">
                <div>
                  <p className="text-zinc-500">بهترین ماه</p>
                  <p className="font-semibold text-emerald-400 mt-1">
                    {formatCurrency(
                      Math.max(...monthlySales.map((m: MonthlySale) => m.revenue))
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500">مجموع ۱۲ ماه</p>
                  <p className="font-semibold mt-1">
                    {monthlySales
                      .reduce((s: number, m: MonthlySale) => s + m.revenue, 0)
                      .toLocaleString("fa-IR")}{" "}
                    تومان
                  </p>
                </div>
              </div>
            </div>

            <div className="min-h-[240px]">
              {chartType === "bar" ? (
                <BarChart
                  data={monthlyChartData}
                  labelKey="month"
                  valueKey="revenue"
                  color="linear-gradient(180deg, #10b981, #059669)"
                  formatLabel={formatMonthlyLabel}
                  formatValue={formatCurrency}
                />
              ) : (
                <LineChart
                  data={monthlyChartData}
                  labelKey="month"
                  valueKey="revenue"
                  color="#10b981"
                  formatLabel={formatMonthlyLabel}
                  formatValue={formatCurrency}
                />
              )}
            </div>

            {/* Monthly data table */}
            <div className="mt-4">
              <h3 className="text-sm font-medium text-zinc-400 mb-3">
                جدول فروش ماهانه
              </h3>
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02]">
                      <th className="px-4 py-3 text-right text-zinc-500 font-medium">
                        ماه
                      </th>
                      <th className="px-4 py-3 text-right text-zinc-500 font-medium">
                        تعداد سفارش
                      </th>
                      <th className="px-4 py-3 text-right text-zinc-500 font-medium">
                        درآمد
                      </th>
                      <th className="px-4 py-3 text-right text-zinc-500 font-medium">
                        میانگین سفارش
                      </th>
                      <th className="px-4 py-3 text-right text-zinc-500 font-medium">
                        سهم از کل
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(() => {
                      const totalAllMonths = monthlySales.reduce(
                        (s: number, m: MonthlySale) => s + m.revenue,
                        0
                      );
                      return [...monthlySales]
                        .reverse()
                        .map((month: MonthlySale, index: number) => {
                          const sharePercent =
                            totalAllMonths > 0
                              ? ((month.revenue / totalAllMonths) * 100).toFixed(1)
                              : "0";
                          return (
                            <tr
                              key={index}
                              className="hover:bg-white/[0.02] transition-colors"
                            >
                              <td className="px-4 py-3 font-medium">
                                {formatMonthlyLabel(month.month)}{" "}
                                <span className="text-zinc-500 text-xs">
                                  {month.month.slice(0, 4)}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                  {month.count.toLocaleString("fa-IR")}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-semibold text-emerald-400">
                                {month.revenue.toLocaleString("fa-IR")} تومان
                              </td>
                              <td className="px-4 py-3 text-zinc-400">
                                {month.count > 0
                                  ? Math.round(
                                      month.revenue / month.count
                                    ).toLocaleString("fa-IR")
                                  : "—"}{" "}
                                تومان
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-white/5 rounded-full h-2 max-w-[80px]">
                                    <div
                                      className="h-2 rounded-full bg-emerald-500"
                                      style={{ width: `${sharePercent}%` }}
                                    />
                                  </div>
                                  <span className="text-zinc-400 text-xs">
                                    {sharePercent}٪
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Top Products */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="px-6 py-5 border-b border-white/10">
          <h2 className="text-xl font-semibold">پرفروش‌ترین محصولات</h2>
          <p className="text-sm text-zinc-500 mt-1">
            بر اساس تعداد فروش کل
          </p>
        </div>

        {topProducts.length === 0 ? (
          <div className="p-8 text-zinc-500 text-center">
            هنوز سفارشی ثبت نشده است
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {topProducts.map((product: TopProduct, index: number) => (
              <div
                key={product.productId}
                className="px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`
                      w-10 h-10 rounded-2xl flex items-center justify-center
                      font-bold text-sm flex-shrink-0
                      ${
                        index === 0
                          ? "bg-yellow-500/20 text-yellow-400"
                          : index === 1
                            ? "bg-zinc-400/20 text-zinc-400"
                            : index === 2
                              ? "bg-orange-800/20 text-orange-700"
                              : "bg-white/5 text-zinc-500"
                      }
                    `}
                  >
                    {index + 1}
                  </div>

                  <div>
                    <p className="font-medium">{product.title}</p>
                    <p className="text-sm text-zinc-500 mt-0.5">
                      قیمت واحد:{" "}
                      {product.price.toLocaleString("fa-IR")} تومان
                    </p>
                  </div>
                </div>

                <div className="text-left flex gap-6">
                  <div className="text-center">
                    <p className="text-xs text-zinc-500">تعداد فروش</p>
                    <p className="font-bold text-lg mt-1 text-violet-400">
                      {product.totalQuantity.toLocaleString("fa-IR")}
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-xs text-zinc-500">درآمد کل</p>
                    <p className="font-bold mt-1 text-emerald-400">
                      {(product.price * product.totalQuantity).toLocaleString(
                        "fa-IR"
                      )}{" "}
                      تومان
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats Footer */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 text-center">
          <p className="text-4xl font-bold text-violet-400">
            {summary.totalOrders.toLocaleString("fa-IR")}
          </p>
          <p className="text-zinc-500 text-sm mt-2">کل سفارشات</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 text-center">
          <p className="text-4xl font-bold text-emerald-400">
            {summary.totalOrders > 0
              ? Math.round(
                  summary.totalRevenue / summary.totalOrders
                ).toLocaleString("fa-IR")
              : "۰"}
          </p>
          <p className="text-zinc-500 text-sm mt-2">میانگین ارزش سفارش (تومان)</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 text-center">
          <p
            className={`text-4xl font-bold ${
              Number(todayGrowthVsMonth) >= 0
                ? "text-emerald-400"
                : "text-red-400"
            }`}
          >
            {Number(todayGrowthVsMonth) >= 0 ? "+" : ""}
            {todayGrowthVsMonth}٪
          </p>
          <p className="text-zinc-500 text-sm mt-2">
            عملکرد امروز نسبت به میانگین ماه
          </p>
        </div>
      </div>
    </div>
  );
}