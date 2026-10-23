import { PrismaClient } from '@prisma/client';
import { seedBe1 } from './seeds/be1.seed';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('Starting database seeding...');
  await seedBe1(prisma);
  console.log('BE1 seeding completed.');
}

main()
  .catch(() => {
    console.error(
      'Seeding failed; check demo environment, password configuration and database migrations.',
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
