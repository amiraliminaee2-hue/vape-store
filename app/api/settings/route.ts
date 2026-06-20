import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

// تعریف interface برای Setting
interface Setting {
  id: number;
  key: string;
  value: string;
  type: string;
  group: string;
  label: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(req: NextRequest) {
  try {
    const prisma = await getPrisma();
    const { searchParams } = new URL(req.url);
    const group = searchParams.get("group");

    const where = group ? { group } : {};

    const settings = await prisma.setting.findMany({
      where,
      orderBy: { key: "asc" },
    }) as Setting[];

    // تبدیل به فرمت key-value
    const settingsMap: Record<string, string> = {};
    settings.forEach((s: Setting) => {
      settingsMap[s.key] = s.value;
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

export async function PUT(req: NextRequest) {
  try {
    const prisma = await getPrisma();
    const body = await req.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json(
        { error: "کلید تنظیمات الزامی است" },
        { status: 400 }
      );
    }

    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value: value || "" },
      create: {
        key,
        value: value || "",
        type: "text",
        group: "general",
        label: key,
      },
    });

    return NextResponse.json(setting);
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json(
      { error: "خطا در بروزرسانی تنظیمات" },
      { status: 500 }
    );
  }
}