import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomBytes } from "crypto";
import { authOptions } from "@/lib/auth";

// ذخیره توکن‌ها در حافظه (برای Production از Redis استفاده کن)
const csrfTokens = new Map<string, { token: string; expiresAt: number }>();

// انقضای توکن (۱ ساعت)
const TOKEN_EXPIRY = 60 * 60 * 1000;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Generate random CSRF token
    const token = randomBytes(32).toString("hex");
    const expiresAt = Date.now() + TOKEN_EXPIRY;

    // Store token for this user
    csrfTokens.set(userId, { token, expiresAt });

    // Clean up expired tokens
    for (const [key, value] of csrfTokens.entries()) {
      if (value.expiresAt < Date.now()) {
        csrfTokens.delete(key);
      }
    }

    return NextResponse.json({ token });
  } catch (error) {
    console.error("CSRF token error:", error);
    return NextResponse.json(
      { error: "خطا در ایجاد توکن امنیتی" },
      { status: 500 }
    );
  }
}

// ✅ برای استفاده در سایر API‌ها، این تابع رو export نکن
// بلکه به صورت جداگانه در فایل lib/csrf.ts قرار بده