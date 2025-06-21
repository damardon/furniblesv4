import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@furnibles.com' },
    update: {},
    create: {
      email: 'admin@furnibles.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'Furnibles',
      role: UserRole.ADMIN,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      isActive: true,
      // Admin tiene ambos perfiles
      sellerProfile: {
        create: {
          storeName: 'Furnibles Official Store',
          slug: 'furnibles-official',
          description: 'Tienda oficial de Furnibles con los mejores diseños',
          isVerified: true,
        },
      },
      buyerProfile: {
        create: {
          preferences: { categories: ['TABLES', 'CHAIRS', 'BEDS'] },
        },
      },
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Create test seller
  const sellerPassword = await bcrypt.hash('seller123', 12);
  const seller = await prisma.user.upsert({
    where: { email: 'seller@furnibles.com' },
    update: {},
    create: {
      email: 'seller@furnibles.com',
      password: sellerPassword,
      firstName: 'Juan',
      lastName: 'Carpintero',
      role: UserRole.SELLER,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      isActive: true,
      sellerProfile: {
        create: {
          storeName: 'Muebles Juan',
          slug: 'muebles-juan',
          description: 'Especialista en muebles de madera rústicos y modernos',
          isVerified: true,
        },
      },
    },
  });

  console.log('✅ Seller user created:', seller.email);

  // Create test buyer
  const buyerPassword = await bcrypt.hash('buyer123', 12);
  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@furnibles.com' },
    update: {},
    create: {
      email: 'buyer@furnibles.com',
      password: buyerPassword,
      firstName: 'Maria',
      lastName: 'Compradora',
      role: UserRole.BUYER,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      isActive: true,
      buyerProfile: {
        create: {
          preferences: { categories: ['TABLES', 'CHAIRS'] },
        },
      },
    },
  });

  console.log('✅ Buyer user created:', buyer.email);

  // Create test users for different scenarios
  const testUserPassword = await bcrypt.hash('test123', 12);
  
  // Seller no verificado
  const unverifiedSeller = await prisma.user.upsert({
    where: { email: 'seller-unverified@furnibles.com' },
    update: {},
    create: {
      email: 'seller-unverified@furnibles.com',
      password: testUserPassword,
      firstName: 'Pedro',
      lastName: 'Nuevo',
      role: UserRole.SELLER,
      emailVerified: false,
      isActive: false,
      sellerProfile: {
        create: {
          storeName: 'Muebles Pedro',
          slug: 'muebles-pedro',
          description: 'Nuevo vendedor esperando verificación',
          isVerified: false,
        },
      },
    },
  });

  console.log('✅ Unverified seller created:', unverifiedSeller.email);

  // Buyer con ambos roles (isBoth: true)
  const hybridUser = await prisma.user.upsert({
    where: { email: 'hybrid@furnibles.com' },
    update: {},
    create: {
      email: 'hybrid@furnibles.com',
      password: testUserPassword,
      firstName: 'Ana',
      lastName: 'Híbrida',
      role: UserRole.BUYER,
      isBoth: true,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      isActive: true,
      buyerProfile: {
        create: {
          preferences: { categories: ['OUTDOOR', 'DECORATIVE'] },
        },
      },
      sellerProfile: {
        create: {
          storeName: 'Ana Designs',
          slug: 'ana-designs',
          description: 'Diseños únicos y personalizados',
          isVerified: true,
        },
      },
    },
  });

  console.log('✅ Hybrid user created:', hybridUser.email);

  console.log('🎉 Seed completed successfully!');
  console.log('📝 Test credentials:');
  console.log('   Admin: admin@furnibles.com / admin123');
  console.log('   Seller: seller@furnibles.com / seller123');
  console.log('   Buyer: buyer@furnibles.com / buyer123');
  console.log('   Hybrid: hybrid@furnibles.com / test123');
  console.log('   Unverified: seller-unverified@furnibles.com / test123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });