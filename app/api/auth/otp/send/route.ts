import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

// تولید کد ۶ رقمی
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ارسال پیامک با ملی پیامک
async function sendSMS(phone: string, code: string): Promise<boolean> {
  try {
    const response = await fetch(
      "https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: process.env.SMS_USERNAME,
          // این مقدار باید API Key باشد
          password: process.env.SMS_PASSWORD,
          text: code,
          to: phone,
          bodyId: Number(process.env.SMS_BODY_ID),
        }),
      }
    );

    const raw = await response.text();

    console.log("========== SMS RESPONSE ==========");
    console.log(raw);
    console.log("==================================");

    // اگر پاسخ JSON بود
    try {
      const result = JSON.parse(raw);

      if (result.RetStatus === 1) {
        return true;
      }

      console.error("Payamak Error:", result);
      return false;
    } catch {
      // اگر پاسخ XML بود
      if (raw.includes(">15<")) return false;

      if (raw.includes("-110")) {
        console.error("خطا: API Key به درستی ارسال نشده است.");
      } else if (raw.includes("-109")) {
        console.error("خطا: IP مجاز تنظیم نشده است.");
      } else if (raw.includes("-4")) {
        console.error("خطا: BodyId صحیح نیست یا تایید نشده است.");
      } else if (raw.includes("-1")) {
        console.error("خطا: دسترسی وب سرویس غیرفعال است.");
      } else {
        console.error("Unknown Response:", raw);
      }

      return false;
    }
  } catch (error) {
    console.error("SMS Error:", error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const prisma = await getPrisma();

    const body = await request.json();
    const { phone } = body;

    const phoneRegex = /^09\d{9}$/;

    if (!phone || !phoneRegex.test(phone)) {
      return NextResponse.json(
        {
          error: "شماره تلفن نامعتبر است",
        },
        {
          status: 400,
        }
      );
    }

    // حذف OTP های منقضی شده
    await prisma.otp.deleteMany({
      where: {
        phone,
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    // بررسی OTP فعال
    const existingOtp = await prisma.otp.findFirst({
      where: {
        phone,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (existingOtp) {
      const remainingSeconds = Math.ceil(
        (existingOtp.expiresAt.getTime() - Date.now()) / 1000
      );

      return NextResponse.json(
        {
          error: `کد قبلی هنوز معتبر است. ${remainingSeconds} ثانیه دیگر تلاش کنید.`,
          remainingSeconds,
        },
        {
          status: 429,
        }
      );
    }

    // تولید کد
    const otpCode = generateOTP();

    const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

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

    if (!smsSent) {
      return NextResponse.json(
        {
          error: "ارسال پیامک با خطا مواجه شد.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: "کد تایید با موفقیت ارسال شد.",
      ...(process.env.NODE_ENV === "development" && {
        devCode: otpCode,
      }),
    });
  } catch (error) {
    console.error("OTP Error:", error);

    return NextResponse.json(
      {
        error: "خطا در ارسال کد تایید",
      },
      {
        status: 500,
      }
    );
  }
}