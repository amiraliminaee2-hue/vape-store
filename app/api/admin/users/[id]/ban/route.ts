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
    const { duration, reason } = body;

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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ban error:", error);
    return NextResponse.json({ error: "خطا در بن کردن کاربر" }, { status: 500 });
  }
}

export async function DELETE(
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

    await prisma.userProfile.update({
      where: { userId: id },
      data: {
        isBanned: false,
        banReason: null,
        bannedAt: null,
        banExpiry: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unban error:", error);
    return NextResponse.json({ error: "خطا در لغو بن" }, { status: 500 });
  }
}