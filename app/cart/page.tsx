"use client";

import { useState, useEffect, useCallback } from "react";
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

// گسترش تایپ CartItem برای شامل discountPercent
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
  const [loading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // ==================== روش ارسال ====================
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<number | null>(null);
  const [shippingPrice, setShippingPrice] = useState(0);
  const [methodPrices, setMethodPrices] = useState<Record<number, number>>({});

  // ==================== روش پرداخت ====================
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<number | null>(null);

  // حالت‌های مربوط به کد تخفیف
  const [couponCode, setCouponCode] = useState("");
  const [couponInfo, setCouponInfo] = useState<CouponInfo | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponInfo["coupon"] | null>(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  // تنظیمات کارت به کارت
  const [cart2cartSettings, setCart2cartSettings] = useState({
    cart2cart_telegram: "",
    cart2cart_rubika: "",
    cart2cart_phone: "",
    cart2cart_card_number: "",
    cart2cart_bank_name: "",
    cart2cart_account_name: "",
  });

  // محاسبه قیمت نهایی برای همه روش‌های ارسال (برای نمایش در لیست)
  const calculateAllMethodPrices = useCallback(async () => {
    if (!province || shippingMethods.length === 0) return;
    
    const prices: Record<number, number> = {};
    const totalWeight = items.reduce((sum, item) => sum + (item.quantity * 200), 0);
    
    for (const method of shippingMethods) {
      const params = new URLSearchParams();
      params.set("methodId", method.id.toString());
      params.set("province", province);
      if (totalWeight > 0) params.set("totalWeight", totalWeight.toString());
      
      try {
        const res = await fetch(`/api/shipping/calculate?${params.toString()}`);
        const data = await res.json();
        prices[method.id] = data.price || method.basePrice;
      } catch {
        prices[method.id] = method.basePrice;
      }
    }
    setMethodPrices(prices);
  }, [province, shippingMethods, items]);

  // محاسبه هزینه ارسال برای روش انتخاب شده
  const calculateShippingPrice = useCallback(async () => {
    if (!selectedShippingMethod) return;

    const selectedProvince = province;
    const totalWeight = items.reduce((sum, item) => sum + (item.quantity * 200), 0);

    const params = new URLSearchParams();
    params.set("methodId", selectedShippingMethod.toString());
    if (selectedProvince) params.set("province", selectedProvince);
    if (totalWeight > 0) params.set("totalWeight", totalWeight.toString());

    try {
      const res = await fetch(`/api/shipping/calculate?${params.toString()}`);
      const data = await res.json();
      setShippingPrice(data.price || 0);
    } catch (error) {
      console.error("Error calculating shipping:", error);
    }
  }, [selectedShippingMethod, province, items]);

  // وقتی استان یا سبد خرید یا روش‌های ارسال تغییر می‌کند، قیمت همه روش‌ها را محاسبه کن
  useEffect(() => {
    calculateAllMethodPrices();
  }, [calculateAllMethodPrices]);

  // وقتی روش ارسال انتخاب می‌شود، قیمت نهایی را محاسبه کن
  useEffect(() => {
    if (selectedShippingMethod && province) {
      calculateShippingPrice();
    }
  }, [selectedShippingMethod, province, calculateShippingPrice]);

  // اگر کاربر لاگین نیست، به صفحه ورود هدایت شود
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // دریافت تنظیمات کارت به کارت
  const fetchCart2CartSettings = async () => {
    try {
      const res = await fetch("/api/settings?group=payment");
      const data = await res.json();
      setCart2cartSettings({
        cart2cart_telegram: data.cart2cart_telegram || "",
        cart2cart_rubika: data.cart2cart_rubika || "",
        cart2cart_phone: data.cart2cart_phone || "",
        cart2cart_card_number: data.cart2cart_card_number || "6037-****-****-****",
        cart2cart_bank_name: data.cart2cart_bank_name || "بانک ملی",
        cart2cart_account_name: data.cart2cart_account_name || "فروشگاه ویپ",
      });
    } catch (error) {
      console.error("Error fetching cart2cart settings:", error);
    }
  };

  // دریافت روش‌های ارسال
  const fetchShippingMethods = async () => {
    try {
      const res = await fetch("/api/admin/shipping-methods");
      const data = await res.json();
      const activeMethods = data.filter((m: ShippingMethod) => m.isActive);
      setShippingMethods(activeMethods);
    } catch (error) {
      console.error("Error fetching shipping methods:", error);
    }
  };

  // دریافت روش‌های پرداخت
  const fetchPaymentMethods = async () => {
    try {
      const res = await fetch("/api/admin/payment-methods");
      const data = await res.json();
      const activeMethods = data.filter((m: PaymentMethod) => m.isActive);
      setPaymentMethods(activeMethods);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
    }
  };

  // Fetch CSRF token on component mount
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const res = await fetch("/api/csrf", {
          cache: "no-store",
        });
        const data = await res.json();
        if (data.token) {
          // token stored but not used in this component
        }
      } catch (error) {
        console.error("Failed to fetch CSRF token:", error);
      }
    };
    fetchCsrfToken();
    fetchShippingMethods();
    fetchPaymentMethods();
    fetchCart2CartSettings();
  }, []);

  // Fetch saved addresses - اصلاح شده با session?.user?.id
  useEffect(() => {
    const fetchSavedAddresses = async () => {
      if (!session?.user?.id) return;
      setLoadingAddresses(true);
      try {
        const res = await fetch("/api/profile/addresses");
        if (res.ok) {
          const data = await res.json();
          console.log("Fetched addresses:", data);
          setSavedAddresses(data);
        }
      } catch (error) {
        console.error("Failed to fetch addresses:", error);
      } finally {
        setLoadingAddresses(false);
      }
    };
    fetchSavedAddresses();
  }, [session?.user?.id]);

  const loadCart = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await getCart();
      setItems(data as ExtendedCartItem[]);
    } catch (error) {
      console.error(error);
    }
  }, [isAuthenticated]);

  // اصلاح: هر بار که وضعیت احراز هویت تغییر کرد، سبد خرید را بارگذاری کن
  useEffect(() => {
    if (isAuthenticated) {
      loadCart();
    } else {
      setItems([]);
    }
  }, [isAuthenticated, loadCart]);

  // محاسبه جمع سبد با در نظر گرفتن تخفیف محصولات
  const subtotal = items.reduce((sum, item) => {
    const discountedPrice = item.discountPercent > 0
      ? item.price - (item.price * item.discountPercent / 100)
      : item.price;
    return sum + discountedPrice * item.quantity;
  }, 0);

  // محاسبه تخفیف و قیمت نهایی
  const discountAmount = appliedCoupon?.discountAmount || 0;
  const finalTotal = subtotal - discountAmount + shippingPrice;

  // اعتبارسنجی کد تخفیف (با تأخیر - debounce)
  const validateCoupon = async (code: string) => {
    if (!code.trim()) {
      setCouponInfo(null);
      return;
    }

    setCheckingCoupon(true);
    const productIds = items.map(item => item.productId);
    try {
      const res = await fetch(`/api/coupons?code=${encodeURIComponent(code)}&subtotal=${subtotal}&productIds=${productIds.join(",")}`);
      const data = await res.json();
      setCouponInfo(data);
    } catch {
      setCouponInfo({ valid: false, error: "خطا در اعتبارسنجی کد تخفیف" });
    } finally {
      setCheckingCoupon(false);
    }
  };

  // اعمال کد تخفیف
  const applyCoupon = () => {
    if (couponInfo?.valid && couponInfo.coupon) {
      setAppliedCoupon(couponInfo.coupon);
    }
  };

  // حذف کد تخفیف
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponInfo(null);
  };

  const handleDelete = async (id: number) => {
    await removeFromCart(id);
    await loadCart();
    // بعد از تغییر سبد، کد تخفیف رو دوباره بررسی کن
    if (appliedCoupon) {
      const newProductIds = items.filter(i => i.id !== id).map(i => i.productId);
      const newSubtotal = items.filter(i => i.id !== id).reduce((sum, i) => {
        const discountedPrice = i.discountPercent > 0
          ? i.price - (i.price * i.discountPercent / 100)
          : i.price;
        return sum + discountedPrice * i.quantity;
      }, 0);
      const res = await fetch(`/api/coupons?code=${appliedCoupon.code}&subtotal=${newSubtotal}&productIds=${newProductIds.join(",")}`);
      const data = await res.json();
      if (!data.valid) {
        setAppliedCoupon(null);
        setCouponInfo({ valid: false, error: "کد تخفیف دیگر معتبر نیست" });
      }
    }
  };

  const handleIncrease = async (id: number) => {
    await increaseQuantity(id);
    await loadCart();
    // بعد از تغییر سبد، کد تخفیف رو دوباره بررسی کن
    if (appliedCoupon) {
      const productIds = items.map(i => i.productId);
      const res = await fetch(`/api/coupons?code=${appliedCoupon.code}&subtotal=${subtotal}&productIds=${productIds.join(",")}`);
      const data = await res.json();
      if (!data.valid) {
        setAppliedCoupon(null);
        setCouponInfo({ valid: false, error: "کد تخفیف دیگر معتبر نیست" });
      }
    }
  };

  const handleDecrease = async (id: number) => {
    await decreaseQuantity(id);
    await loadCart();
    // بعد از تغییر سبد، کد تخفیف رو دوباره بررسی کن
    if (appliedCoupon) {
      const productIds = items.map(i => i.productId);
      const res = await fetch(`/api/coupons?code=${appliedCoupon.code}&subtotal=${subtotal}&productIds=${productIds.join(",")}`);
      const data = await res.json();
      if (!data.valid) {
        setAppliedCoupon(null);
        setCouponInfo({ valid: false, error: "کد تخفیف دیگر معتبر نیست" });
      }
    }
  };

  const handleSelectAddress = (id: number) => {
    const selected = savedAddresses.find(addr => addr.id === id);
    if (selected) {
      setAddress(selected.address);
      setSelectedAddressId(id);
      // استخراج استان از آدرس انتخاب شده
      const provincesList = ["تهران", "البرز", "اصفهان", "فارس", "خراسان رضوی", "خوزستان", "مازندران", "گیلان", "کرمان", "آذربایجان شرقی", "آذربایجان غربی", "قم", "سمنان", "یزد", "همدان", "مرکزی", "لرستان", "کردستان", "کرمانشاه", "ایلام", "بوشهر", "هرمزگان", "چهارمحال و بختیاری", "کهگیلویه و بویراحمد", "زنجان", "اردبیل", "گلستان", "خراسان شمالی", "خراسان جنوبی", "سیستان و بلوچستان"];
      for (const p of provincesList) {
        if (selected.address.includes(p)) {
          setProvince(p);
          break;
        }
      }
    }
  };

  // تابع کمکی برای دریافت توکن جدید
  const getFreshCsrfToken = async () => {
    try {
      const res = await fetch("/api/csrf", {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.token) {
        return data.token;
      }
    } catch (error) {
      console.error("Failed to fetch CSRF token:", error);
    }
    return null;
  };

  // پرداخت واقعی با زرین‌پال یا کارت به کارت
  const handlePayment = async () => {
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

    // اعتبارسنجی شماره تلفن
    const phoneRegex = /^09[0-9]{9}$/;
    if (!phoneRegex.test(phone.trim())) {
      alert("شماره تلفن باید با 09 شروع شود و 11 رقم باشد (مثال: 09123456789)");
      return;
    }

    try {
      setPaying(true);

      // دریافت توکن جدید قبل از ثبت سفارش
      const freshToken = await getFreshCsrfToken();
      if (!freshToken) {
        throw new Error("خطا در دریافت توکن امنیتی");
      }

      // 1. ثبت سفارش اولیه با توکن جدید
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": freshToken,
        },
        body: JSON.stringify({
          address,
          phone,
          customerNote,
          adminNote,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          couponCode: appliedCoupon?.code || null,
          discountAmount: discountAmount,
          shippingMethodId: selectedShippingMethod,
          paymentMethodId: selectedPaymentMethod,
          shippingPrice,
        }),
      });

      // خواندن پاسخ حتی اگر خطا باشد
      const orderData = await orderRes.json();
      console.log("Order Response:", { status: orderRes.status, data: orderData });

      if (!orderRes.ok) {
        // نمایش خطای دقیق از سرور
        const errorMessage = orderData.error || 
          (orderData.details ? JSON.stringify(orderData.details) : "خطا در ثبت سفارش");
        throw new Error(errorMessage);
      }

      if (!orderData || !orderData.id) {
        throw new Error("پاسخ سفارش ناقص است");
      }

      // بررسی روش پرداخت
      const selectedPayment = paymentMethods.find(p => p.id === selectedPaymentMethod);
      
      // ==================== اگر روش پرداخت کارت به کارت باشد ====================
      if (selectedPayment?.code === "cart2cart") {
        const message = `✅ سفارش شما با موفقیت ثبت شد.
🆔 شماره سفارش: ${orderData.id}
💰 مبلغ قابل پرداخت: ${finalTotal.toLocaleString("fa-IR")} تومان

لطفاً مبلغ را به شماره کارت زیر واریز کنید:
🏦 ${cart2cartSettings.cart2cart_bank_name}
💳 ${cart2cartSettings.cart2cart_card_number}
👤 نام صاحب حساب: ${cart2cartSettings.cart2cart_account_name}

پس از واریز، رسید را در یکی از پیام رسان‌های زیر ارسال کنید:
${cart2cartSettings.cart2cart_telegram ? `📱 تلگرام: ${cart2cartSettings.cart2cart_telegram}` : ""}
${cart2cartSettings.cart2cart_rubika ? `📱 روبیکا: ${cart2cartSettings.cart2cart_rubika}` : ""}
${cart2cartSettings.cart2cart_phone ? `📞 پشتیبانی: ${cart2cartSettings.cart2cart_phone}` : ""}

سفارش شما پس از تأیید پرداخت، ارسال خواهد شد.`;
        
        alert(message);
        
        // هدایت به لینک تلگرام یا روبیکا اگر تنظیم شده باشد
        if (cart2cartSettings.cart2cart_telegram) {
          window.open(cart2cartSettings.cart2cart_telegram, "_blank");
        } else if (cart2cartSettings.cart2cart_rubika) {
          window.open(cart2cartSettings.cart2cart_rubika, "_blank");
        }
        
        // هدایت به صفحه سفارشات
        router.push(`/dashboard/orders`);
        return;
      }

      // ==================== پرداخت آنلاین ====================
      // تبدیل تومان به ریال (ضرب در 10)
      const amountInRials = finalTotal * 10;

      const paymentRes = await fetch("/api/payment/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderData.id,
          amount: amountInRials,
          description: `پرداخت سفارش شماره ${orderData.id}`,
          mobile: phone,
        }),
      });

      const paymentData = await paymentRes.json();
      console.log("Payment Response:", { status: paymentRes.status, data: paymentData });

      if (!paymentRes.ok) {
        throw new Error(paymentData.error || "خطا در اتصال به درگاه پرداخت");
      }

      if (!paymentData.paymentUrl) {
        throw new Error("آدرس درگاه پرداخت دریافت نشد");
      }

      // 3. هدایت به درگاه زرین‌پال
      window.location.assign(paymentData.paymentUrl);
    } catch (error) {
      console.error("Payment error:", error);
      alert(error instanceof Error ? error.message : "خطا در پرداخت");
    } finally {
      setPaying(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 sm:p-10">
        <div className="text-center">
          <p className="text-zinc-500">در حال انتقال به صفحه ورود...</p>
        </div>
      </main>
    );
  }

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
          
          {/* ستون راست: لیست محصولات */}
          <div className="flex-1 space-y-3 sm:space-y-4">
            {items.map((item) => {
              const discountedPrice = item.discountPercent > 0
                ? item.price - (item.price * item.discountPercent / 100)
                : item.price;
              const originalTotal = item.price * item.quantity;
              const discountedTotal = discountedPrice * item.quantity;
              const hasDiscount = item.discountPercent > 0;

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
                  {/* کنترل تعداد */}
                  <div className="flex items-center gap-2 sm:gap-3 order-2 sm:order-1">
                    <button
                      onClick={() => handleIncrease(item.id)}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-violet-600 hover:bg-violet-500"
                    >
                      +
                    </button>
                    <span className="min-w-[30px] text-center text-sm sm:text-base">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleDecrease(item.id)}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700"
                    >
                      -
                    </button>
                  </div>

                  {/* اطلاعات محصول */}
                  <div className="flex-1 text-center sm:text-right order-1 sm:order-2">
                    <h3 className="font-semibold text-sm sm:text-base">
                      {item.title}
                    </h3>
                    {hasDiscount && (
                      <span className="text-[10px] sm:text-xs text-red-400 bg-red-500/20 px-1.5 sm:px-2 py-0.5 rounded-full">
                        {item.discountPercent}% تخفیف
                      </span>
                    )}
                  </div>

                  {/* قیمت و حذف */}
                  <div className="text-left order-3">
                    {hasDiscount ? (
                      <>
                        <p className="text-xs sm:text-sm text-zinc-500 line-through">
                          {originalTotal.toLocaleString("fa-IR")} تومان
                        </p>
                        <p className="text-sm sm:text-base text-violet-400 font-semibold">
                          {discountedTotal.toLocaleString("fa-IR")} تومان
                        </p>
                      </>
                    ) : (
                      <p className="text-sm sm:text-base">
                        {originalTotal.toLocaleString("fa-IR")} تومان
                      </p>
                    )}
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="mt-1 sm:mt-2 text-red-400 text-xs sm:text-sm"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ستون چپ: خلاصه سفارش */}
          <div className="lg:w-96 space-y-6">
            
            {/* بخش کد تخفیف */}
            <div className="border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4">
                🎫 کد تخفیف
              </h2>
              
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                  <div>
                    <span className="text-green-400 font-mono text-base sm:text-lg">{appliedCoupon.code}</span>
                    <span className="text-zinc-400 mr-2 sm:mr-3 text-sm">
                      {appliedCoupon.type === "FIXED" 
                        ? `${appliedCoupon.value.toLocaleString()} تومان تخفیف`
                        : `${appliedCoupon.value}% تخفیف`}
                    </span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition text-sm"
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
                      setCouponCode(e.target.value.toUpperCase());
                      validateCoupon(e.target.value.toUpperCase());
                    }}
                    placeholder="کد تخفیف خود را وارد کنید"
                    className="flex-1 p-3 sm:p-4 rounded-xl bg-zinc-900 border border-white/10 focus:border-violet-500 outline-none transition-colors text-sm sm:text-base"
                  />
                  <button
                    onClick={applyCoupon}
                    disabled={!couponInfo?.valid || checkingCoupon}
                    className="px-5 sm:px-6 py-3 sm:py-4 rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    {checkingCoupon ? "بررسی..." : "اعمال"}
                  </button>
                </div>
              )}
              
              {couponInfo && !appliedCoupon && (
                <div className={`mt-3 p-2 sm:p-3 rounded-xl text-xs sm:text-sm ${
                  couponInfo.valid 
                    ? "bg-green-500/10 text-green-400" 
                    : "bg-red-500/10 text-red-400"
                }`}>
                  {couponInfo.valid 
                    ? `✅ کد تخفیف معتبر است - ${couponInfo.coupon?.type === "FIXED" 
                        ? `${couponInfo.coupon?.value.toLocaleString()} تومان`
                        : `${couponInfo.coupon?.value}%`} تخفیف`
                    : `❌ ${couponInfo.error || "کد تخفیف نامعتبر است"}`}
                </div>
              )}
            </div>

            {/* اطلاعات مشتری */}
            <div className="border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4">
                اطلاعات مشتری
              </h2>

              <div className="space-y-3 sm:space-y-4">
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="شماره تلفن"
                  className="w-full p-3 sm:p-4 rounded-xl bg-zinc-900 border border-white/10 text-sm sm:text-base"
                />

                {/* انتخاب استان */}
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">استان</label>
                  <select
                    value={province}
                    onChange={(e) => {
                      setProvince(e.target.value);
                      setSelectedAddressId(null);
                    }}
                    className="w-full p-3 sm:p-4 rounded-xl bg-zinc-900 border border-white/10 focus:border-violet-500 outline-none transition-colors text-sm sm:text-base"
                  >
                    <option value="">استان خود را انتخاب کنید</option>
                    <option value="تهران">تهران</option>
                    <option value="البرز">البرز</option>
                    <option value="اصفهان">اصفهان</option>
                    <option value="فارس">فارس</option>
                    <option value="خراسان رضوی">خراسان رضوی</option>
                    <option value="خوزستان">خوزستان</option>
                    <option value="مازندران">مازندران</option>
                    <option value="گیلان">گیلان</option>
                    <option value="کرمان">کرمان</option>
                    <option value="آذربایجان شرقی">آذربایجان شرقی</option>
                    <option value="آذربایجان غربی">آذربایجان غربی</option>
                    <option value="قم">قم</option>
                    <option value="سمنان">سمنان</option>
                    <option value="یزد">یزد</option>
                    <option value="همدان">همدان</option>
                    <option value="مرکزی">مرکزی</option>
                    <option value="لرستان">لرستان</option>
                    <option value="کردستان">کردستان</option>
                    <option value="کرمانشاه">کرمانشاه</option>
                    <option value="ایلام">ایلام</option>
                    <option value="بوشهر">بوشهر</option>
                    <option value="هرمزگان">هرمزگان</option>
                    <option value="چهارمحال و بختیاری">چهارمحال و بختیاری</option>
                    <option value="کهگیلویه و بویراحمد">کهگیلویه و بویراحمد</option>
                    <option value="زنجان">زنجان</option>
                    <option value="اردبیل">اردبیل</option>
                    <option value="گلستان">گلستان</option>
                    <option value="خراسان شمالی">خراسان شمالی</option>
                    <option value="خراسان جنوبی">خراسان جنوبی</option>
                    <option value="سیستان و بلوچستان">سیستان و بلوچستان</option>
                  </select>
                </div>

                {/* آدرس‌های ذخیره شده */}
                {savedAddresses.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-xs sm:text-sm text-zinc-400">
                      آدرس‌های ذخیره شده
                    </label>
                    <select
                      value={selectedAddressId || ""}
                      onChange={(e) => handleSelectAddress(Number(e.target.value))}
                      className="w-full p-3 sm:p-4 rounded-xl bg-zinc-900 border border-white/10 text-white outline-none focus:border-violet-500/50 transition-colors text-sm sm:text-base"
                    >
                      <option value="">-- انتخاب از آدرس‌های ذخیره شده --</option>
                      {savedAddresses.map((addr) => (
                        <option key={addr.id} value={addr.id}>
                          {addr.label} - {addr.address.slice(0, 40)}...
                        </option>
                      ))}
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
                    setAddress(e.target.value);
                    setSelectedAddressId(null);
                  }}
                  placeholder="آدرس کامل"
                  rows={3}
                  className="w-full p-3 sm:p-4 rounded-xl bg-zinc-900 border border-white/10 text-sm sm:text-base resize-none"
                />

                <textarea
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  placeholder="یادداشت مشتری (مثال: زنگ نزنید)"
                  rows={2}
                  className="w-full p-3 sm:p-4 rounded-xl bg-zinc-900 border border-white/10 text-sm sm:text-base resize-none"
                />

                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="توضیحات سفارش برای مدیر"
                  rows={2}
                  className="w-full p-3 sm:p-4 rounded-xl bg-zinc-900 border border-white/10 text-sm sm:text-base resize-none"
                />
              </div>
            </div>

            {/* ==================== روش ارسال ==================== */}
            {shippingMethods.length > 0 && (
              <div className="border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4">
                  🚚 روش ارسال
                </h2>
                <div className="space-y-3">
                  {shippingMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedShippingMethod === method.id
                          ? "border-violet-500 bg-violet-500/10"
                          : "border-white/10 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shippingMethod"
                          value={method.id}
                          checked={selectedShippingMethod === method.id}
                          onChange={() => setSelectedShippingMethod(method.id)}
                          className="w-4 h-4"
                        />
                        <div>
                          <div className="font-semibold text-sm sm:text-base">{method.name}</div>
                          {method.estimatedDays && (
                            <div className="text-xs text-zinc-500">زمان تحویل: {method.estimatedDays}</div>
                          )}
                        </div>
                      </div>
                      <div className="font-bold text-violet-400 text-sm sm:text-base">
                        {(methodPrices[method.id] || method.basePrice).toLocaleString("fa-IR")} تومان
                      </div>
                    </label>
                  ))}
                </div>
                {selectedShippingMethod && shippingPrice > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10 text-left">
                    <span className="text-zinc-400">هزینه ارسال: </span>
                    <span className="font-bold">{shippingPrice.toLocaleString("fa-IR")} تومان</span>
                  </div>
                )}
              </div>
            )}

            {/* ==================== روش پرداخت ==================== */}
            {paymentMethods.length > 0 && (
              <div className="border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4">
                  💰 روش پرداخت
                </h2>
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedPaymentMethod === method.id
                          ? "border-violet-500 bg-violet-500/10"
                          : "border-white/10 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.id}
                          checked={selectedPaymentMethod === method.id}
                          onChange={() => setSelectedPaymentMethod(method.id)}
                          className="w-4 h-4"
                        />
                        <div>
                          <div className="font-semibold text-sm sm:text-base">{method.name}</div>
                          {method.code === "cart2cart" && method.settings?.message && (
                            <div className="text-xs text-zinc-500 mt-1 max-w-[200px]">
                              {method.settings.message.slice(0, 50)}...
                            </div>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                {selectedPaymentMethod && paymentMethods.find(p => p.id === selectedPaymentMethod)?.code === "cart2cart" && (
                  <div className="mt-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                    <p className="text-xs text-yellow-400">
                      {paymentMethods.find(p => p.id === selectedPaymentMethod)?.settings?.message || "لطفاً پس از واریز، رسید را در پیام رسان ارسال کنید."}
                    </p>
                    {(paymentMethods.find(p => p.id === selectedPaymentMethod)?.settings?.telegram || paymentMethods.find(p => p.id === selectedPaymentMethod)?.settings?.rubika) && (
                      <p className="text-xs text-zinc-400 mt-2">
                        ارسال رسید: 
                        {paymentMethods.find(p => p.id === selectedPaymentMethod)?.settings?.telegram && (
                          <a href={paymentMethods.find(p => p.id === selectedPaymentMethod)?.settings?.telegram} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline ml-2">تلگرام</a>
                        )}
                        {paymentMethods.find(p => p.id === selectedPaymentMethod)?.settings?.rubika && (
                          <a href={paymentMethods.find(p => p.id === selectedPaymentMethod)?.settings?.rubika} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline mr-2">روبیکا</a>
                        )}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* جمع‌بندی مالی */}
            <div className="border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between text-base sm:text-lg">
                  <span className="text-zinc-400">جمع سبد:</span>
                  <span>{subtotal.toLocaleString("fa-IR")} تومان</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-base sm:text-lg text-green-400">
                    <span>تخفیف کد:</span>
                    <span>-{discountAmount.toLocaleString("fa-IR")} تومان</span>
                  </div>
                )}
                {shippingPrice > 0 && (
                  <div className="flex justify-between text-base sm:text-lg">
                    <span className="text-zinc-400">هزینه ارسال:</span>
                    <span>{shippingPrice.toLocaleString("fa-IR")} تومان</span>
                  </div>
                )}
                <div className="border-t border-white/10 pt-3 mt-2">
                  <div className="flex justify-between text-xl sm:text-2xl md:text-3xl font-bold">
                    <span>مجموع قابل پرداخت:</span>
                    <span>{finalTotal.toLocaleString("fa-IR")} تومان</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={loading || paying}
                className="mt-5 sm:mt-6 w-full px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-green-600 hover:bg-green-500 transition-colors disabled:opacity-50 text-sm sm:text-base font-medium"
              >
                {paying ? "در حال اتصال به درگاه..." : loading ? "در حال ثبت سفارش..." : "پرداخت و ثبت سفارش"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}