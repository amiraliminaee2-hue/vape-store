import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const prisma = await getPrisma();
    const body = await request.json();
    const { phone, code } = body;

    // اعتبارسنجی شماره تلفن
    const phoneRegex = /^09[0-9]{9}$/;
    if (!phone || !phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: "شماره تلفن نامعتبر است" },
        { status: 400 }
      );
    }

    // اعتبارسنجی کد
    if (!code || code.length !== 6) {
      return NextResponse.json(
        { error: "کد تأیید معتبر نیست" },
        { status: 400 }
      );
    }

    // جستجوی کد در دیتابیس
    const otpRecord = await prisma.otp.findFirst({
      where: {
        phone,
        code,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: "کد تأیید نامعتبر یا منقضی شده است" },
        { status: 400 }
      );
    }

    // حذف کد مصرف شده
    await prisma.otp.delete({
      where: { id: otpRecord.id },
    });

    // پیدا کردن یا ایجاد کاربر
    let user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      // ایجاد کاربر جدید (بدون ایمیل)
      user = await prisma.user.create({
        data: {
          phone,
          name: `کاربر ${phone.slice(-4)}`,
        },
      });
      
      // همچنین پروفایل خالی برای کاربر بساز
      await prisma.userProfile.create({
        data: {
          userId: user.id,
        },
      });
    }

    // برگرداندن اطلاعات کاربر برای ورود
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("OTP verify error:", error);
    return NextResponse.json(
      { error: "خطا در تأیید کد" },
      { status: 500 }
    );
  }
}