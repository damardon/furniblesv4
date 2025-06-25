import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_TEST || 'postgresql://test:test@localhost:5432/furnibles_test'
    }
  }
});

export async function setupTestDb() {
  // Clean database
  await prisma.downloadToken.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.product.deleteMany();
  await prisma.sellerProfile.deleteMany();
  await prisma.user.deleteMany();
  
  // Create test users
  const buyer = await prisma.user.create({
    data: {
      email: 'buyer@test.com',
      password: 'hashedpassword',
      firstName: 'Test',
      lastName: 'Buyer',
      role: 'BUYER',
      isVerified: true
    }
  });
  
  const seller = await prisma.user.create({
    data: {
      email: 'seller@test.com',
      password: 'hashedpassword',
      firstName: 'Test',
      lastName: 'Seller',
      role: 'SELLER',
      isVerified: true,
      sellerProfile: {
        create: {
          storeName: 'Test Store',
          storeDescription: 'Test Description',
          isVerified: true
        }
      }
    }
  });
  
  // Create test product
  const product = await prisma.product.create({
    data: {
      title: 'Test Product',
      description: 'Test Description',
      price: 100,
      category: 'TABLES',
      sellerId: seller.id,
      status: 'PUBLISHED',
      files: {
        create: {
          filename: 'test-file.pdf',
          originalName: 'test-file.pdf',
          size: 1024,
          mimetype: 'application/pdf',
          path: '/test/path'
        }
      }
    }
  });
  
  return { buyer, seller, product };
}

export async function cleanupTestDb() {
  await prisma.$disconnect();
}

export { prisma };
