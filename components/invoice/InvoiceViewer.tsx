"use client";

import { useRef } from "react";
import Image from "next/image";

interface InvoiceItem {
  id: number;
  title: string;
  quantity: number;
  price: number;
  total: number;
}

interface InvoiceData {
  id: number;
  trackingNumber: string;
  transactionId: string | null;
  createdAt: string;
  status: string;
  userName: string;
  userEmail: string;
  phone: string;
  address: string;
  customerNote: string | null;
  adminNote: string | null;
  subtotal: number;
  couponCode: string | null;
  discountAmount: number;
  shippingCost: number;
  totalPrice: number;
  items: InvoiceItem[];
}

interface InvoiceViewerProps {
  data: InvoiceData;
  showPrintButton?: boolean;
  showDownloadButton?: boolean;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  REGISTERED: { label: "ثبت شده", color: "bg-yellow-500/20 text-yellow-400" },
  PAYED: { label: "پرداخت شده", color: "bg-blue-500/20 text-blue-400" },
  PROCESSING: { label: "در حال پردازش", color: "bg-purple-500/20 text-purple-400" },
  SHIPPING: { label: "در حال ارسال", color: "bg-orange-500/20 text-orange-400" },
  SHIPPED: { label: "ارسال شده", color: "bg-teal-500/20 text-teal-400" },
  CANCELLED: { label: "لغو شده", color: "bg-red-500/20 text-red-400" },
  ERROR: { label: "خطا", color: "bg-red-600/20 text-red-500" },
};

export default function InvoiceViewer({ 
  data, 
  showPrintButton = true,
  showDownloadButton = true 
}: InvoiceViewerProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = invoiceRef.current;
    if (!printContent) return;

    const originalTitle = document.title;
    document.title = `فاکتور سفارش ${data.trackingNumber}`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html dir="rtl">
          <head>
            <title>فاکتور سفارش ${data.trackingNumber}</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                font-family: 'Tahoma', 'Inter', sans-serif;
              }
              body {
                background: white;
                padding: 40px;
                direction: rtl;
              }
              .invoice {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                border-radius: 24px;
              }
              .header {
                text-align: center;
                border-bottom: 2px solid #e5e7eb;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              .shop-name {
                font-size: 28px;
                font-weight: bold;
                color: #1f2937;
              }
              .info-grid {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
                background: #f9fafb;
                padding: 20px;
                border-radius: 16px;
              }
              .info-box h4 {
                font-size: 12px;
                color: #6b7280;
                margin-bottom: 8px;
              }
              .info-box p {
                font-size: 14px;
                font-weight: 500;
                color: #1f2937;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
              }
              th, td {
                padding: 12px;
                text-align: right;
                border-bottom: 1px solid #e5e7eb;
              }
              th {
                background: #f9fafb;
                font-weight: 600;
                color: #374151;
              }
              .totals {
                width: 300px;
                margin-right: auto;
                margin-top: 20px;
              }
              .totals-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
              }
              .totals-row.total {
                font-weight: bold;
                font-size: 18px;
                border-top: 2px solid #e5e7eb;
                margin-top: 8px;
                padding-top: 12px;
              }
              .footer {
                text-align: center;
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                font-size: 12px;
                color: #9ca3af;
              }
              @media print {
                body {
                  padding: 20px;
                }
                .no-print {
                  display: none;
                }
                button {
                  display: none;
                }
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }

    document.title = originalTitle;
  };

  const handleDownloadPDF = async () => {
  try {
    const response = await fetch(
      `/api/orders/${data.id}/invoice`
    );

    if (!response.ok) {
      throw new Error(
        "خطا در دریافت فاکتور"
      );
    }

    const blob =
      await response.blob();

    const url =
      window.URL.createObjectURL(
        blob
      );

    const a =
      document.createElement("a");

    a.href = url;

    a.download =
      `invoice-${data.trackingNumber}.pdf`;

    document.body.appendChild(a);

    a.click();

    a.remove();

    window.URL.revokeObjectURL(
      url
    );
  } catch (error) {
    console.error(
      "Invoice Download Error:",
      error
    );

    alert(
      "خطا در دانلود فاکتور"
    );
  }
};

  const persianDate = new Date(data.createdAt).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const statusInfo = statusLabels[data.status] || statusLabels.REGISTERED;

  const logoSrc = "/logo.png";

  return (
    <div className="space-y-6">
      {(showPrintButton || showDownloadButton) && (
        <div className="flex justify-end gap-3 no-print">
          {showPrintButton && (
            <button
              onClick={handlePrint}
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors flex items-center gap-2"
            >
              🖨️ چاپ فاکتور
            </button>
          )}
          {showDownloadButton && (
            <button
              onClick={handleDownloadPDF}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center gap-2"
            >
              📥 دانلود PDF
            </button>
          )}
        </div>
      )}

      <div ref={invoiceRef} className="bg-white text-gray-900 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-8">
          {/* هدر */}
          <div className="text-center border-b border-gray-200 pb-6 mb-6">
            <div className="flex justify-between items-start">
              <div className="text-right">
                <h1 className="text-3xl font-bold text-gray-800">پاد بوشهر</h1>
                <p className="text-gray-500 mt-1">فاکتور رسمی خرید</p>
              </div>
              <div className="text-left">
                <div className="w-20 h-20 mx-auto relative">
                  <Image
                    src={logoSrc}
                    alt="پاد بوشهر"
                    width={80}
                    height={80}
                    className="object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        parent.innerHTML = '<span className="text-4xl">🧾</span>';
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* اطلاعات سفارش */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500">شماره سفارش</p>
              <p className="font-mono font-semibold text-sm mt-1">{data.trackingNumber}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500">تاریخ ثبت</p>
              <p className="font-medium text-sm mt-1">{persianDate}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500">وضعیت</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs mt-1 ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500">شماره تراکنش</p>
              <p className="font-mono text-xs mt-1">{data.transactionId || "—"}</p>
            </div>
          </div>

          {/* اطلاعات مشتری */}
          <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-5 mb-8 border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>👤</span> اطلاعات مشتری
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-gray-400">👤</span>
                <div>
                  <p className="text-gray-500 text-xs">نام</p>
                  <p className="font-medium">{data.userName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-gray-400">📧</span>
                <div>
                  <p className="text-gray-500 text-xs">ایمیل</p>
                  <p>{data.userEmail}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-gray-400">📞</span>
                <div>
                  <p className="text-gray-500 text-xs">تلفن</p>
                  <p dir="ltr">{data.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-gray-400">📍</span>
                <div>
                  <p className="text-gray-500 text-xs">آدرس</p>
                  <p className="text-sm">{data.address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* جدول محصولات */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-right py-3 px-4 rounded-tr-xl">محصول</th>
                  <th className="text-center py-3 px-4">تعداد</th>
                  <th className="text-left py-3 px-4">قیمت واحد</th>
                  <th className="text-left py-3 px-4 rounded-tl-xl">مجموع</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="py-3 px-4">{item.title}</td>
                    <td className="text-center py-3 px-4">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm">
                        {item.quantity}
                      </span>
                    </td>
                    <td className="text-left py-3 px-4">{item.price.toLocaleString("fa-IR")} تومان</td>
                    <td className="text-left py-3 px-4 font-medium">{(item.price * item.quantity).toLocaleString("fa-IR")} تومان</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* جمع‌بندی مالی */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex justify-end">
              <div className="w-full md:w-80 space-y-3">
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">جمع کل</span>
                  <span>{data.subtotal.toLocaleString("fa-IR")} تومان</span>
                </div>
                {data.shippingCost > 0 && (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500">هزینه ارسال</span>
                    <span>{data.shippingCost.toLocaleString("fa-IR")} تومان</span>
                  </div>
                )}
                {data.discountAmount > 0 && (
                  <div className="flex justify-between py-2 text-green-600">
                    <span>🎫 تخفیف ({data.couponCode})</span>
                    <span>-{data.discountAmount.toLocaleString("fa-IR")} تومان</span>
                  </div>
                )}
                <div className="border-t-2 border-gray-200 pt-3 mt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>قابل پرداخت</span>
                    <span className="text-green-600">{data.totalPrice.toLocaleString("fa-IR")} تومان</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* یادداشت‌ها */}
          {(data.customerNote || data.adminNote) && (
            <div className="mt-8 pt-6 border-t border-gray-200 bg-gray-50 rounded-xl p-5">
              {data.customerNote && (
                <div className="mb-3">
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <span>📝</span> یادداشت مشتری
                  </p>
                  <p className="text-sm mt-1">{data.customerNote}</p>
                </div>
              )}
              {data.adminNote && (
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <span>🏪</span> یادداشت فروشگاه
                  </p>
                  <p className="text-sm mt-1">{data.adminNote}</p>
                </div>
              )}
            </div>
          )}

          {/* فوتر */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <div className="flex justify-center mb-3">
              <div className="bg-gray-100 px-4 py-2 rounded-lg">
                <span className="text-xs text-gray-500 font-mono">{data.trackingNumber}</span>
              </div>
            </div>
            <p className="text-sm text-gray-400">
              با تشکر از خرید شما
            </p>
            <p className="text-xs text-gray-300 mt-2">
              این فاکتور به عنوان مدرک خرید معتبر است.
            </p>
            <p className="text-xs text-gray-300 mt-1">
              تاریخ چاپ: {new Date().toLocaleDateString("fa-IR")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}