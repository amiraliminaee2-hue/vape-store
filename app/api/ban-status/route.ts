import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ isBanned: false });
    }

    const prisma = await getPrisma();

    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      select: { isBanned: true, banExpiry: true }
    });

    if (!profile) {
      return NextResponse.json({ isBanned: false });
    }

    let isBanned = profile.isBanned;
    if (profile.banExpiry && new Date(profile.banExpiry) <= new Date()) {
      await prisma.userProfile.update({
        where: { userId: session.user.id },
        data: { isBanned: false, banExpiry: null, bannedAt: null, banReason: null }
      });
      isBanned = false;
    }

    return NextResponse.json({ isBanned });
  } catch (error) {
    console.error("Ban status error:", error);
    return NextResponse.json({ isBanned: false });
  }
}