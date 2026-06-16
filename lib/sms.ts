// lib/sms.ts

interface SMSParams {
  to: string;
  message: string;
}

// تنظیمات سرویس پیامکی (ملی پیامک)
const MELI_PAYAMAK_USERNAME = process.env.MELI_PAYAMAK_USERNAME;
const MELI_PAYAMAK_PASSWORD = process.env.MELI_PAYAMAK_PASSWORD;
const MELI_PAYAMAK_FROM = process.env.MELI_PAYAMAK_FROM; // شماره خط اختصاصی

// تنظیمات کاوه‌نگار
const KAVENEGAR_API_KEY = process.env.KAVENEGAR_API_KEY;
const KAVENEGAR_FROM = process.env.KAVENEGAR_FROM;

export async function sendSMS(params: SMSParams): Promise<boolean> {
  const { to, message } = params;
  
  // انتخاب سرویس بر اساس متغیر محیطی
  const provider = process.env.SMS_PROVIDER || "melipayamak";
  
  try {
    if (provider === "melipayamak") {
      // ملی پیامک
      const response = await fetch("https://rest.payamak-panel.com/api/SendSMS/SendSMS", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: MELI_PAYAMAK_USERNAME,
          password: MELI_PAYAMAK_PASSWORD,
          to: to,
          from: MELI_PAYAMAK_FROM,
          text: message,
        }),
      });
      
      const data = await response.json();
      return data.retStatus === "OK" || data.retStatus === 1;
      
    } else if (provider === "kavenegar") {
      // کاوه‌نگار
      const response = await fetch(
        `https://api.kavenegar.com/v1/${KAVENEGAR_API_KEY}/sms/send.json`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            receptor: to,
            message: message,
            sender: KAVENEGAR_FROM || "",
          }),
        }
      );
      
      const data = await response.json();
      return data.return.status === 200;
    }
    
    return false;
  } catch (error) {
    console.error("SMS sending error:", error);
    return false;
  }
}

// تابع کمکی برای ارسال پیامک خوشامد/ثبت سفارش
export async function sendOrderConfirmationSMS(phone: string, orderId: number, totalPrice: number) {
  const message = `✅ سفارش شما با شماره ${orderId} به مبلغ ${totalPrice.toLocaleString("fa-IR")} تومان با موفقیت ثبت شد. برای پیگیری، وارد پنل کاربری شوید.\nفروشگاه ویپ`;
  return sendSMS({ to: phone, message });
}

// تابع کمکی برای ارسال پیامک تغییر وضعیت سفارش
export async function sendOrderStatusSMS(phone: string, orderId: number, status: string) {
  const statusMessages: Record<string, string> = {
    REGISTERED: "ثبت شد و در انتظار پرداخت است",
    PAYED: "پرداخت شد و در حال پردازش است",
    PROCESSING: "در حال پردازش است",
    SHIPPING: "در مرحله ارسال است",
    SHIPPED: "ارسال شد و به زودی به دست شما می‌رسد",
    CANCELLED: "لغو شد",
    ERROR: "با خطا مواجه شد. لطفاً با پشتیبانی تماس بگیرید",
  };
  
  const statusText = statusMessages[status] || status;
  const message = `🔄 وضعیت سفارش شماره ${orderId} به "${statusText}" تغییر کرد.\nفروشگاه ویپ`;
  
  return sendSMS({ to: phone, message });
}

// تابع کمکی برای ارسال پیامک به ادمین
export async function sendAdminNotificationSMS(orderId: number, totalPrice: number, userName: string) {
  const adminPhone = process.env.ADMIN_PHONE;
  if (!adminPhone) return false;
  
  const message = `🆕 سفارش جدید! \nشماره: ${orderId}\nمشتری: ${userName}\nمبلغ: ${totalPrice.toLocaleString("fa-IR")} تومان\nلطفاً برای بررسی وارد پنل ادمین شوید.`;
  
  return sendSMS({ to: adminPhone, message });
}