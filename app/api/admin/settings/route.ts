import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

const prisma = await getPrisma();
const data = await prisma.user.findMany();
import { getServerSession } from "next-auth";
import { isAdmin } from "@/lib/isAdmin";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json(
        { error: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    const settings = await prisma.setting.findMany();
    
    // Convert to key-value object
    const settingsMap: Record<string, string> = {};
    settings.forEach((setting) => {
      settingsMap[setting.key] = setting.value;
    });

    return NextResponse.json(settingsMap);
  } catch (error) {
    console.error("Settings API error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت تنظیمات" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json(
        { error: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Update each setting
    for (const [key, value] of Object.entries(body)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: String(value), updatedAt: new Date() },
        create: {
          key,
          value: String(value),
          type: "text",
          group: "general",
          label: key,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json(
      { error: "خطا در بروزرسانی تنظیمات" },
      { status: 500 }
    );
  }
}