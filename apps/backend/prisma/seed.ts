import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function seed() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (email && password) {
    const existing = await prisma.admin.findUnique({ where: { email } });
    if (!existing) {
      const passwordHash = await bcrypt.hash(password, 10);
      await prisma.admin.create({
        data: { email, passwordHash },
      });
    }
  }

  const config = await prisma.globalConfig.findFirst();
  if (!config) {
    await prisma.globalConfig.create({
      data: {
        id: "global",
        schoolStartTime: "08:00",
        lectureDurationMinutes: 60,
        lecturesPerDay: 6,
      },
    });
  }
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
