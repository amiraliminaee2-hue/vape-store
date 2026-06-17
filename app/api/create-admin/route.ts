import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const prisma = await getPrisma();
    const hashedPassword = await bcrypt.hash("Amirali13871387", 10);
    
    await prisma.user.update({
      where: { email: "amiraliminaee555@gmail.com" },
      data: { password: hashedPassword },
    });
    
    return NextResponse.json({ success: true, message: "Admin created successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
}