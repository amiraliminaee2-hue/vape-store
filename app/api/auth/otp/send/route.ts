import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

// تابع تولید کد تصادفی ۶ رقمی
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// تابع ارسال پیامک (با استفاده از سرویس پیامکی - فعلاً شبیه‌سازی)
async function sendSMS(phone: string, code: string): Promise<boolean> {
  // در محیط توسعه، فقط در کنسول لاگ کن
  if (process.env.NODE_ENV === "development") {
    console.log(`📱 SMS to ${phone}: کد تأیید شما: ${code}`);
    return true;
  }

  // برای محیط تولید، از سرویس پیامکی واقعی استفاده کن
  // می‌توانی از Kavenegar، FarazSMS یا هر سرویس دیگری استفاده کنی
  
  // مثال با Kavenegar (نیاز به نصب پکیج و تنظیم API Key)
  /*
  try {
    const Kavenegar = require('kavenegar');
    const api = Kavenegar.KavenegarApi({ apikey: process.env.KAVENEGAR_API_KEY });
    
    return new Promise((resolve) => {
      api.Send({
        message: `کد تأیید شما: ${code}`,
        sender: process.env.SMS_SENDER_NUMBER,
        receptor: phone,
      }, function(response: any, status: any) {
        if (status === 200) {
          console.log("SMS sent successfully:", response);
          resolve(true);
        } else {
          console.error("SMS sending failed:", response);
          resolve(false);
        }
      });
    });
  } catch (error) {
    console.error("SMS service error:", error);
    return false;
  }
  */

  // موقتاً true برگردان (برای تست)
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const prisma = await getPrisma();
    const body = await request.json();
    const { phone } = body;

    // اعتبارسنجی شماره تلفن
    const phoneRegex = /^09[0-9]{9}$/;
    if (!phone || !phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: "شماره تلفن نامعتبر است" },
        { status: 400 }
      );
    }

    // حذف کدهای قبلی منقضی شده برای این شماره
    await prisma.otp.deleteMany({
      where: {
        phone,
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    // بررسی وجود کد فعال قبلی برای این شماره
    const existingOtp = await prisma.otp.findFirst({
      where: {
        phone,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (existingOtp) {
      // اگر کد فعال وجود دارد، زمان انقضای آن را بگو
      const remainingSeconds = Math.ceil((existingOtp.expiresAt.getTime() - Date.now()) / 1000);
      return NextResponse.json(
        { 
          error: `کد فعال قبلی仍有 ${remainingSeconds} ثانیه اعتبار دارد. لطفاً پس از انقضا مجدداً تلاش کنید`,
          remainingSeconds 
        },
        { status: 429 }
      );
    }

    // تولید کد جدید
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 دقیقه اعتبار

    // ذخیره در دیتابیس
    await prisma.otp.create({
      data: {
        phone,
        code: otpCode,
        expiresAt,
      },
    });

    // ارسال پیامک
    const smsSent = await sendSMS(phone, otpCode);

    if (!smsSent && process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        { error: "خطا در ارسال پیامک. لطفاً مجدداً تلاش کنید" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "کد تأیید با موفقیت ارسال شد",
      // در محیط توسعه، کد رو برگردون (برای تست)
      ...(process.env.NODE_ENV === "development" && { devCode: otpCode }),
    });
  } catch (error) {
    console.error("OTP send error:", error);
    return NextResponse.json(
      { error: "خطا در ارسال کد تأیید" },
      { status: 500 }
    );
  }
}