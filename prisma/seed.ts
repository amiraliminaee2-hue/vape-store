import "dotenv/config";
import bcrypt from "bcryptjs";
import { getPrisma } from "../lib/prisma";

async function main() {
  const prisma = await getPrisma();

  const ADMIN_PHONE = "09334839609";
  const ADMIN_PASSWORD = "Admin123";

  const existingAdmin = await prisma.user.findUnique({
    where: {
      phone: ADMIN_PHONE,
    },
    include: {
      profile: true,
    },
  });

  if (existingAdmin) {
    console.log("✅ Admin already exists.");

    if (!existingAdmin.profile) {
      await prisma.userProfile.create({
        data: {
          userId: existingAdmin.id,
          phone: ADMIN_PHONE,
          firstName: "Admin",
          lastName: "PadBushehr",
        },
      });

      console.log("✅ Admin profile created.");
    }

    return;
  }

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const admin = await prisma.user.create({
    data: {
      phone: ADMIN_PHONE,
      password: hashedPassword,
      name: "Administrator",

      profile: {
        create: {
          phone: ADMIN_PHONE,
          firstName: "Admin",
          lastName: "PadBushehr",
        },
      },
    },
  });

  console.log("✅ Admin created successfully.");
  console.log(`ID: ${admin.id}`);
  console.log(`Phone: ${ADMIN_PHONE}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    const prisma = await getPrisma();
    await prisma.$disconnect();
  });