"use client";

import {
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";
import Link from "next/link";
import InvoiceViewer from "@/components/invoice/InvoiceViewer";

/*
 * ============================================================
 * Order Item Flavor
 * ============================================================
 *
 * طعم‌های انتخاب شده برای هر آیتم سفارش
 *
 * ساختار:
 *
 * OrderItem
 *   └── flavors
 *         └── OrderItemFlavor
 *               └── Flavor
 *
 * این اطلاعات از API سفارش دریافت می‌شوند.
 * ============================================================
 */

interface OrderItemFlavor {
  id: number;
  flavorId: number;
  quantity: number;
  price: number;

  flavor: {
    id: number;
    name: string;
  };
}

/*
 * ============================================================
 * Order Item
 * ============================================================
 */

interface OrderItem {
  id: number;
  quantity: number;
  price: number;

  product: {
    id: number;
    title: string;
    slug: string;
    images: string[];
  };

  /*
   * طعم‌های انتخاب شده برای این محصول
   *
   * اختیاری نگه داشته شده تا اگر API یا سفارش قدیمی
   * بدون flavors بود، صفحه دچار مشکل نشود.
   */
  flavors?: OrderItemFlavor[];
}

/*
 * ============================================================
 * Order
 * ============================================================
 */

interface Order {
  id: number;
  trackingNumber: string;
  transactionId: string | null;
  userId: string;
  address: string;
  phone: string;
  customerNote: string | null;
  adminNote: string | null;
  totalPrice: number;
  couponCode: string | null;
  discountAmount: number;
  status: string;
  createdAt: string;

  items: OrderItem[];
}

/*
 * ============================================================
 * Invoice Item Flavor
 * ============================================================
 *
 * این ساختار باید دقیقاً با InvoiceViewer یکی باشد.
 * ============================================================
 */

interface InvoiceItemFlavor {
  id: number;
  flavorId: number;
  name: string;
  quantity: number;
  price: number;
}

/*
 * ============================================================
 * Invoice Item
 * ============================================================
 */

interface InvoiceItem {
  id: number;
  title: string;
  quantity: number;
  price: number;
  total: number;

  /*
   * توجه:
   * این property در InvoiceViewer اجباری است.
   *
   * بنابراین اینجا هم باید حتماً آرایه ارسال شود.
   */
  flavors: InvoiceItemFlavor[];
}

/*
 * ============================================================
 * Invoice Data
 * ============================================================
 *
 * این ساختار باید با InvoiceViewer کاملاً یکسان باشد.
 * ============================================================
 */

interface InvoiceData {
  id: number;
  trackingNumber: string;
  transactionId: string | null;
  createdAt: string;
  status: string;
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

/*
 * ============================================================
 * Status Option
 * ============================================================
 */

interface StatusOption {
  value: string;
  label: string;
}

/*
 * ============================================================
 * Status Options
 * ============================================================
 */

const statusOptions: StatusOption[] = [
  {
    value: "REGISTERED",
    label: "ثبت شده",
  },
  {
    value: "PAYED",
    label: "پرداخت شده",
  },
  {
    value: "PROCESSING",
    label: "در حال پردازش",
  },
  {
    value: "SHIPPING",
    label: "در حال ارسال",
  },
  {
    value: "SHIPPED",
    label: "ارسال شده",
  },
  {
    value: "CANCELLED",
    label: "لغو شده",
  },
];

/*
 * ============================================================
 * Admin Order Detail Page
 * ============================================================
 */

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();

  /*
   * ----------------------------------------------------------
   * State
   * ----------------------------------------------------------
   */

  const [order, setOrder] =
    useState<Order | null>(null);

  const [loading, setLoading] =
    useState<boolean>(true);

  const [updatingStatus, setUpdatingStatus] =
    useState<boolean>(false);

  const [adminNote, setAdminNote] =
    useState<string>("");

  const [savingNote, setSavingNote] =
    useState<boolean>(false);

  /*
   * ----------------------------------------------------------
   * Order ID
   * ----------------------------------------------------------
   */

  const orderId =
    params?.["id"] as string;

  /*
   * ==========================================================
   * Fetch Order
   * ==========================================================
   */

  const fetchOrder =
    useCallback(
      async (): Promise<void> => {
        try {
          const res =
            await fetch(
              `/api/admin/orders/${orderId}`
            );

          if (!res.ok) {
            if (res.status === 404) {
              router.push(
                "/admin/orders"
              );
            }

            throw new Error(
              "خطا در دریافت سفارش"
            );
          }

          const data: Order =
            await res.json();

          setOrder(data);

          setAdminNote(
            data.adminNote || ""
          );
        } catch (error) {
          console.error(
            "Error fetching order:",
            error
          );
        } finally {
          setLoading(false);
        }
      },
      [
        orderId,
        router,
      ]
    );

  /*
   * ==========================================================
   * Initial Fetch
   * ==========================================================
   */

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [
    orderId,
    fetchOrder,
  ]);

  /*
   * ==========================================================
   * Change Order Status
   * ==========================================================
   */

  const handleStatusChange =
    async (
      newStatus: string
    ): Promise<void> => {
      if (!order) {
        return;
      }

      setUpdatingStatus(true);

      try {
        const res =
          await fetch(
            `/api/admin/orders/${orderId}/status`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                status:
                  newStatus,
              }),
            }
          );

        if (res.ok) {
          await fetchOrder();
        } else {
          const error =
            await res.json();

          alert(
            error.error ||
              "خطا در بروزرسانی وضعیت"
          );
        }
      } catch (error) {
        console.error(
          "Error updating status:",
          error
        );

        alert(
          "خطا در بروزرسانی وضعیت"
        );
      } finally {
        setUpdatingStatus(false);
      }
    };

  /*
   * ==========================================================
   * Save Admin Note
   * ==========================================================
   */

  const saveAdminNote =
    async (): Promise<void> => {
      setSavingNote(true);

      try {
        const res =
          await fetch(
            `/api/admin/orders/${orderId}`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                adminNote,
              }),
            }
          );

        if (res.ok) {
          await fetchOrder();

          alert(
            "یادداشت با موفقیت ذخیره شد"
          );
        } else {
          const error =
            await res.json();

          alert(
            error.error ||
              "خطا در ذخیره یادداشت"
          );
        }
      } catch (error) {
        console.error(
          "Error saving note:",
          error
        );

        alert(
          "خطا در ذخیره یادداشت"
        );
      } finally {
        setSavingNote(false);
      }
    };

  /*
   * ==========================================================
   * Loading
   * ==========================================================
   */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white p-8">
        <div className="text-center py-20">
          در حال بارگذاری...
        </div>
      </div>
    );
  }

  /*
   * ==========================================================
   * Order Not Found
   * ==========================================================
   */

  if (!order) {
    return (
      <div className="min-h-screen bg-[#050505] text-white p-8">
        <div className="text-center py-20">
          <p className="text-zinc-500">
            سفارش یافت نشد
          </p>

          <Link
            href="/admin/orders"
            className="mt-4 inline-block text-violet-400"
          >
            بازگشت به لیست سفارش‌ها
          </Link>
        </div>
      </div>
    );
  }

  /*
   * ==========================================================
   * Build Invoice Data
   * ==========================================================
   *
   * این قسمت مهم‌ترین تغییر این فایل است.
   *
   * قبلاً فقط:
   *
   * title
   * quantity
   * price
   * total
   *
   * ارسال می‌شد.
   *
   * حالا flavors نیز از OrderItem گرفته شده
   * و به ساختار مورد انتظار InvoiceViewer تبدیل می‌شود.
   * ==========================================================
   */

  const invoiceData: InvoiceData = {
    id:
      order.id,

    trackingNumber:
      order.trackingNumber,

    transactionId:
      order.transactionId,

    createdAt:
      order.createdAt,

    status:
      order.status,

    phone:
      order.phone,

    address:
      order.address,

    customerNote:
      order.customerNote,

    adminNote:
      order.adminNote,

    subtotal:
      order.totalPrice +
      (order.discountAmount || 0),

    couponCode:
      order.couponCode,

    discountAmount:
      order.discountAmount || 0,

    shippingCost:
      0,

    totalPrice:
      order.totalPrice,

    /*
     * --------------------------------------------------------
     * تبدیل OrderItem به InvoiceItem
     * --------------------------------------------------------
     */

    items:
      order.items.map(
        (
          item: OrderItem
        ): InvoiceItem => {
          /*
           * ------------------------------------------------------
           * استخراج طعم‌ها
           * ------------------------------------------------------
           *
           * اگر سفارش قدیمی باشد یا API طعم نداشته باشد،
           * آرایه خالی ارسال می‌کنیم.
           *
           * بنابراین InvoiceViewer همیشه:
           *
           * flavors: InvoiceItemFlavor[]
           *
           * دریافت می‌کند.
           */

          const flavors: InvoiceItemFlavor[] =
            item.flavors?.map(
              (
                flavorItem: OrderItemFlavor
              ): InvoiceItemFlavor => ({
                id:
                  flavorItem.id,

                flavorId:
                  flavorItem.flavorId,

                name:
                  flavorItem.flavor?.name ||
                  "طعم نامشخص",

                quantity:
                  flavorItem.quantity,

                price:
                  flavorItem.price,
              })
            ) || [];

          /*
           * ------------------------------------------------------
           * Invoice Item
           * ------------------------------------------------------
           */

          return {
            id:
              item.id,

            title:
              item.product.title,

            quantity:
              item.quantity,

            price:
              item.price,

            total:
              item.price *
              item.quantity,

            /*
             * بسیار مهم:
             *
             * flavors همیشه وجود دارد.
             * حتی اگر محصول بدون طعم باشد:
             *
             * flavors: []
             */
            flavors,
          };
        }
      ),
  };

  /*
   * ==========================================================
   * Render
   * ==========================================================
   */

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* -----------------------------------------------------
            Back + Status
            ----------------------------------------------------- */}

        <div className="flex justify-between items-center">
          <Link
            href="/admin/orders"
            className="text-zinc-400 hover:text-white"
          >
            ← بازگشت به لیست سفارش‌ها
          </Link>

          <div className="flex items-center gap-4">
            <select
              value={
                order.status
              }
              onChange={(e) =>
                handleStatusChange(
                  e.target.value
                )
              }
              disabled={
                updatingStatus
              }
              className="px-4 py-2 rounded-xl bg-zinc-900 border border-white/10 focus:border-violet-500 outline-none"
            >
              {statusOptions.map(
                (
                  opt: StatusOption
                ) => (
                  <option
                    key={
                      opt.value
                    }
                    value={
                      opt.value
                    }
                  >
                    {
                      opt.label
                    }
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {/* -----------------------------------------------------
            Admin Note
            ----------------------------------------------------- */}

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="font-bold mb-3">
            یادداشت مدیر
          </h3>

          <textarea
            value={
              adminNote
            }
            onChange={(e) =>
              setAdminNote(
                e.target.value
              )
            }
            rows={3}
            className="w-full p-3 rounded-xl bg-zinc-900 border border-white/10 focus:border-violet-500 outline-none"
            placeholder="یادداشتی برای این سفارش وارد کنید..."
          />

          <button
            onClick={
              saveAdminNote
            }
            disabled={
              savingNote
            }
            className="mt-3 px-6 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors disabled:opacity-50"
          >
            {savingNote
              ? "در حال ذخیره..."
              : "ذخیره یادداشت"}
          </button>
        </div>

        {/* -----------------------------------------------------
            Invoice
            ----------------------------------------------------- */}

        <InvoiceViewer
          data={
            invoiceData
          }
          showPrintButton={
            true
          }
        />

      </div>
    </div>
  );
}