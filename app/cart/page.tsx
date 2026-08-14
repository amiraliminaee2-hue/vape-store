"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  CartItem,
  getCart,
  removeFromCart,
  increaseQuantity,
  decreaseQuantity,
} from "@/lib/cart";

interface SavedAddress {
  id: number;
  label: string;
  address: string;
}

interface CouponInfo {
  valid: boolean;
  coupon?: {
    id: number;
    code: string;
    type: string;
    value: number;
    discountAmount: number;
  };
  error?: string;
}

interface ShippingMethod {
  id: number;
  name: string;
  code: string;
  basePrice: number;
  pricePerKg: number | null;
  estimatedDays: string | null;
  isActive: boolean;
}

interface PaymentMethod {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
  settings: {
    cardNumber?: string;
    bankName?: string;
    accountName?: string;
    message?: string;
    gateway?: string;
    telegram?: string;
    rubika?: string;
  };
}

interface ExtendedCartItem extends CartItem {
  discountPercent: number;
}

export default function CartPage() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const router = useRouter();

  const [items, setItems] = useState<ExtendedCartItem[]>([]);
  const [address, setAddress] = useState("");
  const [province, setProvince] = useState("");
  const [phone, setPhone] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [adminNote, setAdminNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null
  );
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<
    number | null
  >(null);
  const [shippingPrice, setShippingPrice] = useState(0);
  const [methodPrices, setMethodPrices] = useState<Record<number, number>>({});

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    number | null
  >(null);

  const [couponCode, setCouponCode] = useState("");
  const [couponInfo, setCouponInfo] = useState<CouponInfo | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<
    CouponInfo["coupon"] | null
  >(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  const [cart2cartSettings, setCart2cartSettings] = useState({
    cart2cart_telegram: "",
    cart2cart_rubika: "",
    cart2cart_phone: "",
    cart2cart_card_number: "",
    cart2cart_bank_name: "",
    cart2cart_account_name: "",
  });

  // ============================================
  // محاسبه قیمت روش‌های ارسال
  // ============================================

  const calculateAllMethodPrices = useCallback(async () => {
    if (!province || shippingMethods.length === 0) {
      return;
    }

    const prices: Record<number, number> = {};

    const totalWeight = items.reduce(
      (sum, item) => sum + item.quantity * 200,
      0
    );

    for (const method of shippingMethods) {
      const params = new URLSearchParams();

      params.set("methodId", method.id.toString());
      params.set("province", province);

      if (totalWeight > 0) {
        params.set("totalWeight", totalWeight.toString());
      }

      try {
        const res = await fetch(
          `/api/shipping/calculate?${params.toString()}`,
          {
            cache: "no-store",
          }
        );

        if (!res.ok) {
          throw new Error("خطا در محاسبه هزینه ارسال");
        }

        const data = await res.json();

        prices[method.id] =
          typeof data.price === "number" ? data.price : method.basePrice;
      } catch (error) {
        console.error(
          `Error calculating shipping method ${method.id}:`,
          error
        );

        prices[method.id] = method.basePrice;
      }
    }

    setMethodPrices(prices);
  }, [province, shippingMethods, items]);

  const calculateShippingPrice = useCallback(async () => {
    if (!selectedShippingMethod) {
      setShippingPrice(0);
      return;
    }

    const totalWeight = items.reduce(
      (sum, item) => sum + item.quantity * 200,
      0
    );

    const params = new URLSearchParams();

    params.set("methodId", selectedShippingMethod.toString());

    if (province) {
      params.set("province", province);
    }

    if (totalWeight > 0) {
      params.set("totalWeight", totalWeight.toString());
    }

    try {
      const res = await fetch(
        `/api/shipping/calculate?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      if (!res.ok) {
        throw new Error("خطا در محاسبه هزینه ارسال");
      }

      const data = await res.json();

      setShippingPrice(
        typeof data.price === "number" ? data.price : 0
      );
    } catch (error) {
      console.error("Error calculating shipping:", error);
      setShippingPrice(0);
    }
  }, [selectedShippingMethod, province, items]);

  useEffect(() => {
    calculateAllMethodPrices();
  }, [calculateAllMethodPrices]);

  useEffect(() => {
    if (selectedShippingMethod && province) {
      calculateShippingPrice();
    } else {
      setShippingPrice(0);
    }
  }, [
    selectedShippingMethod,
    province,
    calculateShippingPrice,
  ]);

  // ============================================
  // احراز هویت
  // ============================================

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // ============================================
  // تنظیمات پرداخت کارت به کارت
  // ============================================

  const fetchCart2CartSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings?group=payment", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("خطا در دریافت تنظیمات پرداخت");
      }

      const data = await res.json();

      setCart2cartSettings({
        cart2cart_telegram: data.cart2cart_telegram || "",
        cart2cart_rubika: data.cart2cart_rubika || "",
        cart2cart_phone: data.cart2cart_phone || "",
        cart2cart_card_number:
          data.cart2cart_card_number || "6037-****-****-****",
        cart2cart_bank_name:
          data.cart2cart_bank_name || "بانک ملی",
        cart2cart_account_name:
          data.cart2cart_account_name || "فروشگاه ویپ",
      });
    } catch (error) {
      console.error("Error fetching cart2cart settings:", error);
    }
  }, []);

  // ============================================
  // دریافت روش‌های ارسال
  // ============================================

  const fetchShippingMethods = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/shipping-methods", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("خطا در دریافت روش‌های ارسال");
      }

      const data = await res.json();

      const activeMethods = Array.isArray(data)
        ? data.filter((method: ShippingMethod) => method.isActive)
        : [];

      setShippingMethods(activeMethods);

      // اگر روش انتخاب‌شده دیگر فعال نیست، انتخاب را پاک کن
      setSelectedShippingMethod((current) => {
        if (
          current !== null &&
          activeMethods.some(
            (method: ShippingMethod) => method.id === current
          )
        ) {
          return current;
        }

        return null;
      });
    } catch (error) {
      console.error("Error fetching shipping methods:", error);
      setShippingMethods([]);
    }
  }, []);

  // ============================================
  // دریافت روش‌های پرداخت
  // ============================================

  const fetchPaymentMethods = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/payment-methods", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("خطا در دریافت روش‌های پرداخت");
      }

      const data = await res.json();

      const activeMethods = Array.isArray(data)
        ? data.filter((method: PaymentMethod) => method.isActive)
        : [];

      setPaymentMethods(activeMethods);

      // اگر روش انتخاب‌شده دیگر فعال نیست، انتخاب را پاک کن
      setSelectedPaymentMethod((current) => {
        if (
          current !== null &&
          activeMethods.some(
            (method: PaymentMethod) => method.id === current
          )
        ) {
          return current;
        }

        return null;
      });
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      setPaymentMethods([]);
    }
  }, []);

  useEffect(() => {
    fetchShippingMethods();
    fetchPaymentMethods();
    fetchCart2CartSettings();
  }, [
    fetchShippingMethods,
    fetchPaymentMethods,
    fetchCart2CartSettings,
  ]);

  // ============================================
  // دریافت آدرس‌های ذخیره‌شده
  // ============================================

  useEffect(() => {
    const fetchSavedAddresses = async () => {
      if (!session?.user?.id) {
        return;
      }

      setLoadingAddresses(true);

      try {
        const res = await fetch("/api/profile/addresses", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("خطا در دریافت آدرس‌ها");
        }

        const data = await res.json();

        console.log("Fetched addresses:", data);

        setSavedAddresses(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch addresses:", error);
        setSavedAddresses([]);
      } finally {
        setLoadingAddresses(false);
      }
    };

    fetchSavedAddresses();
  }, [session?.user?.id]);

  // ============================================
  // دریافت سبد خرید
  // ============================================

  const loadCart = useCallback(async (): Promise<ExtendedCartItem[]> => {
    if (!isAuthenticated) {
      setItems([]);
      return [];
    }

    try {
      const data = await getCart();

      const normalizedItems = data.map((item) => ({
        ...item,
        discountPercent: Number(item.discountPercent) || 0,
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 0,
      }));

      setItems(normalizedItems);

      return normalizedItems;
    } catch (error) {
      console.error("Error loading cart:", error);
      return [];
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadCart();
    } else if (status !== "loading") {
      setItems([]);
    }
  }, [
    isAuthenticated,
    status,
    loadCart,
  ]);

  // ============================================
  // محاسبه مبلغ سبد
  // ============================================

  const subtotal = items.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    const discountPercent =
      Number(item.discountPercent) || 0;
    const quantity = Number(item.quantity) || 0;

    const discountedPrice =
      discountPercent > 0
        ? price - (price * discountPercent) / 100
        : price;

    return sum + discountedPrice * quantity;
  }, 0);

  const discountAmount = appliedCoupon?.discountAmount || 0;

  const finalTotal = Math.max(
    0,
    subtotal - discountAmount + shippingPrice
  );

  // ============================================
  // اعتبارسنجی کوپن
  // ============================================

  const validateCoupon = useCallback(
    async (code: string, currentItems = items) => {
      const normalizedCode = code.trim().toUpperCase();

      if (!normalizedCode) {
        setCouponInfo(null);
        return;
      }

      setCheckingCoupon(true);

      const productIds = currentItems.map(
        (item) => item.productId
      );

      const currentSubtotal = currentItems.reduce(
        (sum, item) => {
          const price = Number(item.price) || 0;
          const discountPercent =
            Number(item.discountPercent) || 0;
          const quantity = Number(item.quantity) || 0;

          const discountedPrice =
            discountPercent > 0
              ? price - (price * discountPercent) / 100
              : price;

          return sum + discountedPrice * quantity;
        },
        0
      );

      try {
        const params = new URLSearchParams();

        params.set("code", normalizedCode);
        params.set(
          "subtotal",
          currentSubtotal.toString()
        );
        params.set(
          "productIds",
          productIds.join(",")
        );

        const res = await fetch(
          `/api/coupons?${params.toString()}`,
          {
            cache: "no-store",
          }
        );

        const data = await res.json();

        setCouponInfo(data);

        // اگر کد قبلی بعد از تغییر سبد دیگر معتبر نیست
        if (
          appliedCoupon &&
          appliedCoupon.code === normalizedCode &&
          !data.valid
        ) {
          setAppliedCoupon(null);
        }
      } catch (error) {
        console.error("Coupon validation error:", error);

        setCouponInfo({
          valid: false,
          error: "خطا در اعتبارسنجی کد تخفیف",
        });
      } finally {
        setCheckingCoupon(false);
      }
    },
    [items, appliedCoupon]
  );

  const applyCoupon = () => {
    if (couponInfo?.valid && couponInfo.coupon) {
      setAppliedCoupon(couponInfo.coupon);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponInfo(null);
  };

  // ============================================
  // بررسی مجدد کوپن بعد از تغییر سبد
  // ============================================

  const revalidateAppliedCoupon = useCallback(
    async (currentItems: ExtendedCartItem[]) => {
      if (!appliedCoupon) {
        return;
      }

      const productIds = currentItems.map(
        (item) => item.productId
      );

      const currentSubtotal = currentItems.reduce(
        (sum, item) => {
          const price = Number(item.price) || 0;
          const discountPercent =
            Number(item.discountPercent) || 0;
          const quantity = Number(item.quantity) || 0;

          const discountedPrice =
            discountPercent > 0
              ? price - (price * discountPercent) / 100
              : price;

          return sum + discountedPrice * quantity;
        },
        0
      );

      try {
        const params = new URLSearchParams();

        params.set("code", appliedCoupon.code);
        params.set(
          "subtotal",
          currentSubtotal.toString()
        );
        params.set(
          "productIds",
          productIds.join(",")
        );

        const res = await fetch(
          `/api/coupons?${params.toString()}`,
          {
            cache: "no-store",
          }
        );

        const data = await res.json();

        if (!data.valid) {
          setAppliedCoupon(null);

          setCouponInfo({
            valid: false,
            error: "کد تخفیف دیگر معتبر نیست",
          });
        } else if (data.coupon) {
          // مبلغ تخفیف را از سرور دوباره دریافت کن
          setAppliedCoupon(data.coupon);
          setCouponInfo(data);
        }
      } catch (error) {
        console.error(
          "Coupon revalidation error:",
          error
        );
      }
    },
    [appliedCoupon]
  );

  // ============================================
  // حذف محصول
  // ============================================

  const handleDelete = async (id: number) => {
    try {
      setLoading(true);

      await removeFromCart(id);

      const newItems = await loadCart();

      await revalidateAppliedCoupon(newItems);
    } catch (error) {
      console.error("Delete cart item error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "خطا در حذف محصول"
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // افزایش تعداد
  // ============================================

  const handleIncrease = async (id: number) => {
    try {
      setLoading(true);

      await increaseQuantity(id);

      const newItems = await loadCart();

      await revalidateAppliedCoupon(newItems);
    } catch (error) {
      console.error(
        "Increase cart item error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "خطا در افزایش تعداد"
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // کاهش تعداد
  // ============================================

  const handleDecrease = async (id: number) => {
    try {
      setLoading(true);

      await decreaseQuantity(id);

      const newItems = await loadCart();

      await revalidateAppliedCoupon(newItems);
    } catch (error) {
      console.error(
        "Decrease cart item error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "خطا در کاهش تعداد"
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // انتخاب آدرس ذخیره‌شده
  // ============================================

  const handleSelectAddress = (id: number) => {
    const selected = savedAddresses.find(
      (addr) => addr.id === id
    );

    if (!selected) {
      return;
    }

    setAddress(selected.address);
    setSelectedAddressId(id);

    const provincesList = [
      "تهران",
      "البرز",
      "اصفهان",
      "فارس",
      "خراسان رضوی",
      "خوزستان",
      "مازندران",
      "گیلان",
      "کرمان",
      "آذربایجان شرقی",
      "آذربایجان غربی",
      "قم",
      "سمنان",
      "یزد",
      "همدان",
      "مرکزی",
      "لرستان",
      "کردستان",
      "کرمانشاه",
      "ایلام",
      "بوشهر",
      "هرمزگان",
      "چهارمحال و بختیاری",
      "کهگیلویه و بویراحمد",
      "زنجان",
      "اردبیل",
      "گلستان",
      "خراسان شمالی",
      "خراسان جنوبی",
      "سیستان و بلوچستان",
    ];

    for (const provinceName of provincesList) {
      if (selected.address.includes(provinceName)) {
        setProvince(provinceName);
        break;
      }
    }
  };

  // ============================================
  // پرداخت و ثبت سفارش
  // ============================================

  const handlePayment = async () => {
    if (paying || loading) {
      return;
    }

    if (items.length === 0) {
      alert("سبد خرید خالی است");
      return;
    }

    if (!address.trim()) {
      alert("آدرس را وارد کنید");
      return;
    }

    if (!province.trim()) {
      alert("لطفاً استان خود را انتخاب کنید");
      return;
    }

    if (!phone.trim()) {
      alert("شماره تلفن را وارد کنید");
      return;
    }

    if (!selectedShippingMethod) {
      alert("لطفاً روش ارسال را انتخاب کنید");
      return;
    }

    if (!selectedPaymentMethod) {
      alert("لطفاً روش پرداخت را انتخاب کنید");
      return;
    }

    const normalizedPhone = phone.trim().replace(/\s/g, "");

    const phoneRegex = /^09[0-9]{9}$/;

    if (!phoneRegex.test(normalizedPhone)) {
      alert(
        "شماره تلفن باید با 09 شروع شود و 11 رقم باشد (مثال: 09123456789)"
      );
      return;
    }

    try {
      setPaying(true);

      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: address.trim(),
          province: province.trim(),
          phone: normalizedPhone,
          customerNote: customerNote.trim(),
          adminNote: adminNote.trim(),

          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            flavors: item.flavors || [],
          })),

          couponCode: appliedCoupon?.code || null,
          discountAmount,
          shippingMethodId: selectedShippingMethod,
          paymentMethodId: selectedPaymentMethod,
          shippingPrice,
        }),
      });

      const orderData = await orderRes.json();

      console.log("Order Response:", {
        status: orderRes.status,
        data: orderData,
      });

      if (!orderRes.ok) {
        const errorMessage =
          orderData.error ||
          (orderData.details
            ? JSON.stringify(orderData.details)
            : "خطا در ثبت سفارش");

        throw new Error(errorMessage);
      }

      if (!orderData || !orderData.id) {
        throw new Error("پاسخ سفارش ناقص است");
      }

      const selectedPayment = paymentMethods.find(
        (payment) =>
          payment.id === selectedPaymentMethod
      );

      // ============================================
      // پرداخت کارت به کارت
      // ============================================

      if (selectedPayment?.code === "cart2cart") {
        const message = `✅ سفارش شما با موفقیت ثبت شد.
🆔 شماره سفارش: ${orderData.id}
💰 مبلغ قابل پرداخت: ${finalTotal.toLocaleString(
          "fa-IR"
        )} تومان

لطفاً مبلغ را به شماره کارت زیر واریز کنید:
🏦 ${cart2cartSettings.cart2cart_bank_name}
💳 ${cart2cartSettings.cart2cart_card_number}
👤 نام صاحب حساب: ${cart2cartSettings.cart2cart_account_name}

پس از واریز، رسید را در یکی از پیام رسان‌های زیر ارسال کنید:
${
  cart2cartSettings.cart2cart_telegram
    ? `📱 تلگرام: ${cart2cartSettings.cart2cart_telegram}`
    : ""
}
${
  cart2cartSettings.cart2cart_rubika
    ? `📱 روبیکا: ${cart2cartSettings.cart2cart_rubika}`
    : ""
}
${
  cart2cartSettings.cart2cart_phone
    ? `📞 پشتیبانی: ${cart2cartSettings.cart2cart_phone}`
    : ""
}

سفارش شما پس از تأیید پرداخت، ارسال خواهد شد.`;

        alert(message);

        if (
          cart2cartSettings.cart2cart_telegram
        ) {
          window.open(
            cart2cartSettings.cart2cart_telegram,
            "_blank",
            "noopener,noreferrer"
          );
        } else if (
          cart2cartSettings.cart2cart_rubika
        ) {
          window.open(
            cart2cartSettings.cart2cart_rubika,
            "_blank",
            "noopener,noreferrer"
          );
        }

        router.push("/dashboard/orders");
        return;
      }

      // ============================================
      // پرداخت آنلاین
      // ============================================

      const paymentRes = await fetch(
        "/api/payment/request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId: orderData.id,
            amount: finalTotal,
            mobile: normalizedPhone,
          }),
        }
      );

      const contentType =
        paymentRes.headers.get("content-type");

      if (
        !contentType ||
        !contentType.includes("application/json")
      ) {
        const text = await paymentRes.text();

        console.error(
          "Non-JSON payment response:",
          text
        );

        throw new Error(
          "درگاه پرداخت در دسترس نیست. لطفاً چند دقیقه دیگر تلاش کنید."
        );
      }

      const paymentData =
        await paymentRes.json();

      console.log("Payment Response:", {
        status: paymentRes.status,
        data: paymentData,
      });

      if (!paymentRes.ok) {
        throw new Error(
          paymentData.error ||
            "خطا در اتصال به درگاه پرداخت"
        );
      }

      if (!paymentData.paymentUrl) {
        throw new Error(
          "آدرس درگاه پرداخت دریافت نشد"
        );
      }

      window.location.assign(
        paymentData.paymentUrl
      );
    } catch (error) {
      console.error("Payment error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "خطا در پرداخت"
      );
    } finally {
      setPaying(false);
    }
  };

  // ============================================
  // وضعیت احراز هویت
  // ============================================

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 sm:p-10">
        <div className="text-center">
          <p className="text-zinc-500">
            در حال انتقال به صفحه ورود...
          </p>
        </div>
      </main>
    );
  }

  // ============================================
  // UI
  // ============================================

  return (
    <main className="min-h-screen p-4 sm:p-6 md:p-8 lg:p-10 max-w-7xl mx-auto">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 sm:mb-8 md:mb-10">
        سبد خرید
      </h1>

      {items.length === 0 ? (
        <div className="text-center py-12 sm:py-20">
          <p className="text-zinc-500">
            سبد خرید خالی است
          </p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* ========================================
              Cart Items
          ======================================== */}

          <div className="flex-1 space-y-3 sm:space-y-4">
            {items.map((item) => {
              const price =
                Number(item.price) || 0;

              const discountPercent =
                Number(item.discountPercent) || 0;

              const quantity =
                Number(item.quantity) || 0;

              const discountedPrice =
                discountPercent > 0
                  ? price -
                    (price * discountPercent) /
                      100
                  : price;

              const originalTotal =
                price * quantity;

              const discountedTotal =
                discountedPrice * quantity;

              const hasDiscount =
                discountPercent > 0;

              return (
                <div
                  key={item.id}
                  className="
                    p-3 sm:p-4 md:p-5
                    border border-white/10
                    rounded-xl sm:rounded-2xl
                    flex flex-col sm:flex-row
                    justify-between
                    items-center
                    gap-3 sm:gap-4
                  "
                >
                  <div className="flex items-center gap-2 sm:gap-3 order-2 sm:order-1">
                    <button
                      onClick={() =>
                        handleIncrease(
                          item.productId
                        )
                      }
                      disabled={loading || paying}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      +
                    </button>

                    <span className="min-w-[30px] text-center text-sm sm:text-base">
                      {quantity}
                    </span>

                    <button
                      onClick={() =>
                        handleDecrease(
                          item.productId
                        )
                      }
                      disabled={loading || paying}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      -
                    </button>
                  </div>

                  <div className="flex-1 text-center sm:text-right order-1 sm:order-2">
                    <h3 className="font-semibold text-sm sm:text-base">
                      {item.title}
                    </h3>

                    {hasDiscount && (
                      <span className="text-[10px] sm:text-xs text-red-400 bg-red-500/20 px-1.5 sm:px-2 py-0.5 rounded-full">
                        {discountPercent}% تخفیف
                      </span>
                    )}

                    {item.flavors &&
                      item.flavors.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {item.flavors.map(
                            (flavor) => (
                              <div
                                key={
                                  flavor.flavorId
                                }
                                className="text-xs text-zinc-400"
                              >
                                {flavor.name} ×{" "}
                                {flavor.quantity}
                              </div>
                            )
                          )}
                        </div>
                      )}
                  </div>

                  <div className="text-left order-3">
                    {hasDiscount ? (
                      <>
                        <p className="text-xs sm:text-sm text-zinc-500 line-through">
                          {originalTotal.toLocaleString(
                            "fa-IR"
                          )}{" "}
                          تومان
                        </p>

                        <p className="text-sm sm:text-base text-violet-400 font-semibold">
                          {discountedTotal.toLocaleString(
                            "fa-IR"
                          )}{" "}
                          تومان
                        </p>
                      </>
                    ) : (
                      <p className="text-sm sm:text-base">
                        {originalTotal.toLocaleString(
                          "fa-IR"
                        )}{" "}
                        تومان
                      </p>
                    )}

                    <button
                      onClick={() =>
                        handleDelete(
                          item.productId
                        )
                      }
                      disabled={loading || paying}
                      className="mt-1 sm:mt-2 text-red-400 text-xs sm:text-sm disabled:opacity-50"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ========================================
              Checkout Sidebar
          ======================================== */}

          <div className="lg:w-96 space-y-6">
            {/* ========================================
                Coupon
            ======================================== */}

            <div className="border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4">
                🎫 کد تخفیف
              </h2>

              {appliedCoupon ? (
                <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                  <div>
                    <span className="text-green-400 font-mono text-base sm:text-lg">
                      {appliedCoupon.code}
                    </span>

                    <span className="text-zinc-400 mr-2 sm:mr-3 text-sm">
                      {appliedCoupon.type ===
                      "FIXED"
                        ? `${appliedCoupon.value.toLocaleString()} تومان تخفیف`
                        : `${appliedCoupon.value}% تخفیف`}
                    </span>
                  </div>

                  <button
                    onClick={removeCoupon}
                    disabled={paying}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition text-sm disabled:opacity-50"
                  >
                    حذف
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => {
                      const value =
                        e.target.value.toUpperCase();

                      setCouponCode(value);

                      validateCoupon(value);
                    }}
                    placeholder="کد تخفیف خود را وارد کنید"
                    disabled={paying}
                    className="flex-1 p-3 sm:p-4 rounded-xl bg-zinc-900 border border-white/10 focus:border-violet-500 outline-none transition-colors text-sm sm:text-base disabled:opacity-50"
                  />

                  <button
                    onClick={applyCoupon}
                    disabled={
                      !couponInfo?.valid ||
                      checkingCoupon ||
                      paying
                    }
                    className="px-5 sm:px-6 py-3 sm:py-4 rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    {checkingCoupon
                      ? "بررسی..."
                      : "اعمال"}
                  </button>
                </div>
              )}

              {couponInfo && !appliedCoupon && (
                <div
                  className={`mt-3 p-2 sm:p-3 rounded-xl text-xs sm:text-sm ${
                    couponInfo.valid
                      ? "bg-green-500/10 text-green-400"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {couponInfo.valid
                    ? `✅ کد تخفیف معتبر است - ${
                        couponInfo.coupon?.type ===
                        "FIXED"
                          ? `${couponInfo.coupon?.value.toLocaleString()} تومان`
                          : `${couponInfo.coupon?.value}%`
                      } تخفیف`
                    : `❌ ${
                        couponInfo.error ||
                        "کد تخفیف نامعتبر است"
                      }`}
                </div>
              )}
            </div>

            {/* ========================================
                Customer Information
            ======================================== */}

            <div className="border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4">
                اطلاعات مشتری
              </h2>

              <div className="space-y-3 sm:space-y-4">
                <input
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                  placeholder="شماره تلفن"
                  disabled={paying}
                  className="w-full p-3 sm:p-4 rounded-xl bg-zinc-900 border border-white/10 text-sm sm:text-base disabled:opacity-50"
                />

                <div>
                  <label className="block text-sm text-zinc-400 mb-2">
                    استان
                  </label>

                  <select
                    value={province}
                    onChange={(e) => {
                      setProvince(
                        e.target.value
                      );
                      setSelectedAddressId(null);
                    }}
                    disabled={paying}
                    className="w-full p-3 sm:p-4 rounded-xl bg-zinc-900 border border-white/10 focus:border-violet-500 outline-none transition-colors text-sm sm:text-base disabled:opacity-50"
                  >
                    <option value="">
                      استان خود را انتخاب کنید
                    </option>

                    <option value="تهران">
                      تهران
                    </option>
                    <option value="البرز">
                      البرز
                    </option>
                    <option value="اصفهان">
                      اصفهان
                    </option>
                    <option value="فارس">
                      فارس
                    </option>
                    <option value="خراسان رضوی">
                      خراسان رضوی
                    </option>
                    <option value="خوزستان">
                      خوزستان
                    </option>
                    <option value="مازندران">
                      مازندران
                    </option>
                    <option value="گیلان">
                      گیلان
                    </option>
                    <option value="کرمان">
                      کرمان
                    </option>
                    <option value="آذربایجان شرقی">
                      آذربایجان شرقی
                    </option>
                    <option value="آذربایجان غربی">
                      آذربایجان غربی
                    </option>
                    <option value="قم">
                      قم
                    </option>
                    <option value="سمنان">
                      سمنان
                    </option>
                    <option value="یزد">
                      یزد
                    </option>
                    <option value="همدان">
                      همدان
                    </option>
                    <option value="مرکزی">
                      مرکزی
                    </option>
                    <option value="لرستان">
                      لرستان
                    </option>
                    <option value="کردستان">
                      کردستان
                    </option>
                    <option value="کرمانشاه">
                      کرمانشاه
                    </option>
                    <option value="ایلام">
                      ایلام
                    </option>
                    <option value="بوشهر">
                      بوشهر
                    </option>
                    <option value="هرمزگان">
                      هرمزگان
                    </option>
                    <option value="چهارمحال و بختیاری">
                      چهارمحال و بختیاری
                    </option>
                    <option value="کهگیلویه و بویراحمد">
                      کهگیلویه و بویراحمد
                    </option>
                    <option value="زنجان">
                      زنجان
                    </option>
                    <option value="اردبیل">
                      اردبیل
                    </option>
                    <option value="گلستان">
                      گلستان
                    </option>
                    <option value="خراسان شمالی">
                      خراسان شمالی
                    </option>
                    <option value="خراسان جنوبی">
                      خراسان جنوبی
                    </option>
                    <option value="سیستان و بلوچستان">
                      سیستان و بلوچستان
                    </option>
                  </select>
                </div>

                {savedAddresses.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-xs sm:text-sm text-zinc-400">
                      آدرس‌های ذخیره شده
                    </label>

                    <select
                      value={
                        selectedAddressId || ""
                      }
                      onChange={(e) =>
                        handleSelectAddress(
                          Number(
                            e.target.value
                          )
                        )
                      }
                      disabled={paying}
                      className="w-full p-3 sm:p-4 rounded-xl bg-zinc-900 border border-white/10 text-white outline-none focus:border-violet-500/50 transition-colors text-sm sm:text-base disabled:opacity-50"
                    >
                      <option value="">
                        -- انتخاب از آدرس‌های ذخیره شده --
                      </option>

                      {savedAddresses.map(
                        (addr) => (
                          <option
                            key={addr.id}
                            value={addr.id}
                          >
                            {addr.label} -{" "}
                            {addr.address.slice(
                              0,
                              40
                            )}
                            ...
                          </option>
                        )
                      )}
                    </select>
                  </div>
                )}

                {loadingAddresses && (
                  <p className="text-xs sm:text-sm text-zinc-500">
                    در حال بارگذاری آدرس‌ها...
                  </p>
                )}

                <textarea
                  value={address}
                  onChange={(e) => {
                    setAddress(
                      e.target.value
                    );
                    setSelectedAddressId(null);
                  }}
                  placeholder="آدرس کامل"
                  rows={3}
                  disabled={paying}
                  className="w-full p-3 sm:p-4 rounded-xl bg-zinc-900 border border-white/10 text-sm sm:text-base resize-none disabled:opacity-50"
                />

                <textarea
                  value={customerNote}
                  onChange={(e) =>
                    setCustomerNote(
                      e.target.value
                    )
                  }
                  placeholder="یادداشت مشتری (مثال: زنگ نزنید)"
                  rows={2}
                  disabled={paying}
                  className="w-full p-3 sm:p-4 rounded-xl bg-zinc-900 border border-white/10 text-sm sm:text-base resize-none disabled:opacity-50"
                />

                <textarea
                  value={adminNote}
                  onChange={(e) =>
                    setAdminNote(
                      e.target.value
                    )
                  }
                  placeholder="توضیحات سفارش برای مدیر"
                  rows={2}
                  disabled={paying}
                  className="w-full p-3 sm:p-4 rounded-xl bg-zinc-900 border border-white/10 text-sm sm:text-base resize-none disabled:opacity-50"
                />
              </div>
            </div>

            {/* ========================================
                Shipping Methods
            ======================================== */}

            {shippingMethods.length > 0 && (
              <div className="border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4">
                  🚚 روش ارسال
                </h2>

                <div className="space-y-3">
                  {shippingMethods.map(
                    (method) => (
                      <label
                        key={method.id}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedShippingMethod ===
                          method.id
                            ? "border-violet-500 bg-violet-500/10"
                            : "border-white/10 hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="shippingMethod"
                            value={method.id}
                            checked={
                              selectedShippingMethod ===
                              method.id
                            }
                            onChange={() =>
                              setSelectedShippingMethod(
                                method.id
                              )
                            }
                            disabled={paying}
                            className="w-4 h-4"
                          />

                          <div>
                            <div className="font-semibold text-sm sm:text-base">
                              {method.name}
                            </div>

                            {method.estimatedDays && (
                              <div className="text-xs text-zinc-500">
                                زمان تحویل:{" "}
                                {
                                  method.estimatedDays
                                }
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="font-bold text-violet-400 text-sm sm:text-base">
                          {(
                            methodPrices[
                              method.id
                            ] ??
                            method.basePrice
                          ).toLocaleString(
                            "fa-IR"
                          )}{" "}
                          تومان
                        </div>
                      </label>
                    )
                  )}
                </div>

                {selectedShippingMethod &&
                  shippingPrice > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10 text-left">
                      <span className="text-zinc-400">
                        هزینه ارسال:{" "}
                      </span>

                      <span className="font-bold">
                        {shippingPrice.toLocaleString(
                          "fa-IR"
                        )}{" "}
                        تومان
                      </span>
                    </div>
                  )}
              </div>
            )}

            {/* ========================================
                Payment Methods
            ======================================== */}

            {paymentMethods.length > 0 && (
              <div className="border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4">
                  💰 روش پرداخت
                </h2>

                <div className="space-y-3">
                  {paymentMethods.map(
                    (method) => (
                      <label
                        key={method.id}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedPaymentMethod ===
                          method.id
                            ? "border-violet-500 bg-violet-500/10"
                            : "border-white/10 hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={method.id}
                            checked={
                              selectedPaymentMethod ===
                              method.id
                            }
                            onChange={() =>
                              setSelectedPaymentMethod(
                                method.id
                              )
                            }
                            disabled={paying}
                            className="w-4 h-4"
                          />

                          <div>
                            <div className="font-semibold text-sm sm:text-base">
                              {method.name}
                            </div>

                            {method.code ===
                              "cart2cart" &&
                              method.settings
                                ?.message && (
                                <div className="text-xs text-zinc-500 mt-1 max-w-[200px]">
                                  {method.settings.message.slice(
                                    0,
                                    50
                                  )}
                                  ...
                                </div>
                              )}
                          </div>
                        </div>
                      </label>
                    )
                  )}
                </div>

                {selectedPaymentMethod &&
                  paymentMethods.find(
                    (p) =>
                      p.id ===
                      selectedPaymentMethod
                  )?.code ===
                    "cart2cart" && (
                    <div className="mt-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                      <p className="text-xs text-yellow-400">
                        {paymentMethods.find(
                          (p) =>
                            p.id ===
                            selectedPaymentMethod
                        )?.settings?.message ||
                          "لطفاً پس از واریز، رسید را در پیام رسان ارسال کنید."}
                      </p>

                      {(
                        paymentMethods.find(
                          (p) =>
                            p.id ===
                            selectedPaymentMethod
                        )?.settings
                          ?.telegram ||
                        paymentMethods.find(
                          (p) =>
                            p.id ===
                            selectedPaymentMethod
                        )?.settings?.rubika
                      ) && (
                        <p className="text-xs text-zinc-400 mt-2">
                          ارسال رسید:

                          {paymentMethods.find(
                            (p) =>
                              p.id ===
                              selectedPaymentMethod
                          )?.settings
                            ?.telegram && (
                            <a
                              href={
                                paymentMethods.find(
                                  (p) =>
                                    p.id ===
                                    selectedPaymentMethod
                                )?.settings
                                  ?.telegram
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-violet-400 hover:underline ml-2"
                            >
                              تلگرام
                            </a>
                          )}

                          {paymentMethods.find(
                            (p) =>
                              p.id ===
                              selectedPaymentMethod
                          )?.settings
                            ?.rubika && (
                            <a
                              href={
                                paymentMethods.find(
                                  (p) =>
                                    p.id ===
                                    selectedPaymentMethod
                                )?.settings
                                  ?.rubika
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-violet-400 hover:underline mr-2"
                            >
                              روبیکا
                            </a>
                          )}
                        </p>
                      )}
                    </div>
                  )}
              </div>
            )}

            {/* ========================================
                Order Summary
            ======================================== */}

            <div className="border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between text-base sm:text-lg">
                  <span className="text-zinc-400">
                    جمع سبد:
                  </span>

                  <span>
                    {subtotal.toLocaleString(
                      "fa-IR"
                    )}{" "}
                    تومان
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-base sm:text-lg text-green-400">
                    <span>تخفیف کد:</span>

                    <span>
                      -
                      {discountAmount.toLocaleString(
                        "fa-IR"
                      )}{" "}
                      تومان
                    </span>
                  </div>
                )}

                {shippingPrice > 0 && (
                  <div className="flex justify-between text-base sm:text-lg">
                    <span className="text-zinc-400">
                      هزینه ارسال:
                    </span>

                    <span>
                      {shippingPrice.toLocaleString(
                        "fa-IR"
                      )}{" "}
                      تومان
                    </span>
                  </div>
                )}

                <div className="border-t border-white/10 pt-3 mt-2">
                  <div className="flex justify-between text-xl sm:text-2xl md:text-3xl font-bold">
                    <span>
                      مجموع قابل پرداخت:
                    </span>

                    <span>
                      {finalTotal.toLocaleString(
                        "fa-IR"
                      )}{" "}
                      تومان
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={
                  loading ||
                  paying ||
                  items.length === 0
                }
                className="mt-5 sm:mt-6 w-full px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-green-600 hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-medium"
              >
                {paying
                  ? "در حال اتصال به درگاه..."
                  : loading
                  ? "در حال بروزرسانی..."
                  : "پرداخت و ثبت سفارش"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}