import { getPrisma } from "@/lib/prisma";

export async function isAdmin(userId: string): Promise<boolean> {
  const prisma = await getPrisma();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      phone: true,
    },
  });

  if (!user?.phone) return false;

  return user.phone === process.env.ADMIN_PHONE;
}