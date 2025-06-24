import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Setup de base de datos de test
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/furnibles_test';
});

afterAll(async () => {
  // Cleanup
  await prisma.$disconnect();
});