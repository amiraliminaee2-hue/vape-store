import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

// تعریف interface برای UserProfile
interface UserProfile {
  id: number;
  userId: string;
  isBanned: boolean;
  banExpiry: Date | null;
  bannedAt: Date | null;
  banReason: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  address: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    console.log("Session user:", session?.user?.id);

    if (!session?.user?.id) {
      return NextResponse.json({ isBanned: false });
    }

    const prisma = await getPrisma();

    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      select: { 
        isBanned: true, 
        banExpiry: true 
      },
    }) as Pick<UserProfile, 'isBanned' | 'banExpiry'> | null;
    
    console.log("Profile found:", profile);

    if (!profile) {
      return NextResponse.json({ isBanned: false });
    }

    let isBanned = profile.isBanned;
    if (profile.banExpiry && new Date(profile.banExpiry) <= new Date()) {
      await prisma.userProfile.update({
        where: { userId: session.user.id },
        data: { 
          isBanned: false, 
          banExpiry: null, 
          bannedAt: null, 
          banReason: null 
        },
      });
      isBanned = false;
    }

    console.log("Returning isBanned:", isBanned);
    return NextResponse.json({ isBanned });
  } catch (error) {
    console.error("Ban status error:", error);
    return NextResponse.json({ isBanned: false });
  }
}