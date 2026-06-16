import { getPrisma } from "@/lib/prisma";

export async function isAdmin(userId: string): Promise<boolean> {
  // ✅ دریافت prisma از getPrisma
  const prisma = await getPrisma();
  
  // First, get user email from database
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  
  if (!user?.email) return false;
  
  // Get admin emails from environment variable
  const adminEmails = process.env.ADMIN_EMAILS?.split(",").map(e => e.trim().toLowerCase()) || [];
  
  // Also check single ADMIN_EMAIL for backward compatibility
  const singleAdminEmail = process.env.ADMIN_EMAIL;
  if (singleAdminEmail) {
    adminEmails.push(singleAdminEmail.toLowerCase());
  }
  
  // Compare case-insensitive
  const isAdminUser = adminEmails.includes(user.email.toLowerCase());
  
  return isAdminUser;
}