// app/api/admin/users/[id]/ban/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/isAdmin";
import { getPrisma } from "@/lib/prisma";

type DurationKey = "8h" | "12h" | "24h" | "1w" | "1m";

const durationHours: Record<DurationKey, number> = {
  "8h": 8,
  "12h": 12,
  "24h": 24,
  "1w": 168,
  "1m": 720,
};

// ✅ فقط یک POST که همه عملیات‌ها را مدیریت می‌کند
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdminUser = await isAdmin(session.user.id);
    if (!isAdminUser) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const prisma = await getPrisma();
    const { id } = await params;
    const body = await req.json();
    const { action, ...data } = body;

    // ============================================
    // 1️⃣ بن کردن کاربر (BAN)
    // ============================================
    if (action === "ban") {
      const { duration, reason } = data;

      let banExpiry: Date | null = null;

      if (duration !== "permanent") {
        const now = new Date();
        const hours = durationHours[duration as DurationKey];
        if (hours) {
          banExpiry = new Date(now.getTime() + hours * 60 * 60 * 1000);
        } else {
          banExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000); // default 24h
        }
      }

      await prisma.userProfile.upsert({
        where: { userId: id },
        update: {
          isBanned: true,
          banReason: reason || "توسط ادمین",
          bannedAt: new Date(),
          banExpiry,
        },
        create: {
          userId: id,
          isBanned: true,
          banReason: reason || "توسط ادمین",
          bannedAt: new Date(),
          banExpiry,
        },
      });

      return NextResponse.json({ 
        success: true, 
        message: "کاربر با موفقیت بن شد",
        banExpiry 
      });
    }

    // ============================================
    // 2️⃣ لغو بن کاربر (UNBAN)
    // ============================================
    if (action === "unban") {
      await prisma.userProfile.update({
        where: { userId: id },
        data: {
          isBanned: false,
          banReason: null,
          bannedAt: null,
          banExpiry: null,
        },
      });

      return NextResponse.json({ 
        success: true, 
        message: "بن کاربر با موفقیت لغو شد" 
      });
    }

    // ============================================
    // اگر action معتبر نبود
    // ============================================
    return NextResponse.json(
      { error: "اکشن نامعتبر. گزینه‌های مجاز: ban, unban" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Ban/Unban error:", error);
    return NextResponse.json(
      { error: "خطا در عملیات بن" },
      { status: 500 }
    );
  }
}