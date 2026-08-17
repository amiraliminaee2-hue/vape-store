import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ADMIN_PHONE = "09939061841";

async function main() {
  console.log("🌱 Starting database seed...");

  const user = await prisma.user.upsert({
    where: {
      phone: ADMIN_PHONE,
    },
    update: {
      name: "مدیر سایت",
    },
    create: {
      phone: ADMIN_PHONE,
      name: "مدیر سایت",
    },
  });

  console.log("✅ Admin user created/updated:");
  console.log({
    id: user.id,
    phone: user.phone,
    name: user.name,
  });

  const profile = await prisma.userProfile.upsert({
    where: {
      userId: user.id,
    },
    update: {
      phone: ADMIN_PHONE,
    },
    create: {
      userId: user.id,
      phone: ADMIN_PHONE,
      firstName: "مدیر",
      lastName: "سایت",
    },
  });

  console.log("✅ Admin profile created/updated:");
  console.log({
    id: profile.id,
    userId: profile.userId,
    phone: profile.phone,
  });

  console.log("🎉 Seed completed successfully.");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });