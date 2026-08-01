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

  const adminPhones = [
    process.env.ADMIN_PHONE,
    "09969061841",
  ];

  return adminPhones.includes(user.phone);
}