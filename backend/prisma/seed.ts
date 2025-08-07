// backend/prisma/seed.ts - SEED MÍNIMO para APIs
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creating minimal data for API testing...');

  const hashedPassword = await bcrypt.hash('admin123', 12);

  // 👤 ADMIN (para probar APIs de administración)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@furnibles.com' },
    update: {},
    create: {
      email: 'admin@furnibles.com',
      password: hashedPassword,
      role: 'ADMIN',
      firstName: 'Admin',
      lastName: 'System',
      emailVerified: true,
      isActive: true,
      status: 'ACTIVE',
      onboardingComplete: true,
      payoutsEnabled: false,
      chargesEnabled: false,
    },
  });

  // 🏪 SELLER (para probar APIs de productos)
  const seller = await prisma.user.upsert({
    where: { email: 'seller@test.com' },
    update: {},
    create: {
      email: 'seller@test.com',
      password: hashedPassword,
      role: 'SELLER',
      firstName: 'Test',
      lastName: 'Seller',
      emailVerified: true,
      isActive: true,
      status: 'ACTIVE',
      onboardingComplete: true,
      payoutsEnabled: true,
      chargesEnabled: true,
    },
  });

  // Perfil de vendedor
  await prisma.sellerProfile.upsert({
    where: { userId: seller.id },
    update: {},
    create: {
      userId: seller.id,
      storeName: 'Test Store',
      slug: 'test-store',
      description: 'Test store for API testing',
      rating: 4.5,
      totalSales: 10,
      totalReviews: 5,
      isVerified: true,
    },
  });

  // 📦 PRODUCTOS MÍNIMOS (para probar API de moderación)
  await prisma.product.create({
    data: {
      title: 'Test Product for API',
      description: 'This is a test product for API development',
      slug: 'test-product-api',
      price: 50.00,
      category: 'FURNITURE',
      difficulty: 'BEGINNER',
      status: 'PENDING',
      sellerId: seller.id,
      tags: JSON.stringify(['test', 'api']),
      toolsRequired: JSON.stringify(['Basic tools']),
      materials: JSON.stringify(['Wood', 'Screws']),
      estimatedTime: '2 hours',
      dimensions: '50x50x50cm',
      specifications: { test: true },
      imageFileIds: JSON.stringify(['test-img-1']),
      thumbnailFileIds: JSON.stringify(['test-thumb-1']),
      pdfFileId: 'test-pdf-1',
    },
  });

  console.log('✅ Minimal seed completed!');
  console.log('🔑 Admin login: admin@furnibles.com / admin123');
  console.log('📦 1 test product created for API testing');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });