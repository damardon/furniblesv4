import { Difficulty, PrismaClient } from '@prisma/client';

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
    }
  });
  
  const seller = await prisma.user.create({
    data: {
      email: 'seller@test.com',
      password: 'hashedpassword',
      firstName: 'Test',
      lastName: 'Seller',
      role: 'SELLER',
      sellerProfile: {
        
        }
      }
    })
  
  
  // Create test product
  const product = await prisma.product.create({
    data: {
      id: '100',
      title: 'Test Product',
      description: 'Test Description',
      slug: 'test-product',
      price: 5,
      category: 'TABLES',
      difficulty: "BEGINNER",
      status: 'DRAFT',
      seller: {
        connect: { id: seller.id }
    }
    }
  });
  
  return { buyer, seller, product };
}

export async function cleanupTestDb() {
  await prisma.$disconnect();
}
