// prisma/seed.ts - Seed completo corregido para SQLite
import { PrismaClient, UserRole, UserStatus, ProductCategory, Difficulty, ProductStatus, FeeType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting complete database seed...');

  // Limpiar datos existentes (opcional)
  await cleanDatabase();
  
  // Crear usuarios base
  await createUsers();
  
  // Crear configuraciones de fees
  await createFeeConfigs();
  
  // Crear productos de ejemplo
  await createSampleProducts();
  
  // Crear datos de prueba para órdenes
  await createSampleOrderData();

  console.log('🎉 Seed completed successfully!');
  console.log('📝 Test credentials:');
  console.log('   Admin: admin@furnibles.com / admin123');
  console.log('   Seller: seller@furnibles.com / seller123');
  console.log('   Buyer: buyer@furnibles.com / buyer123');
  console.log('   Hybrid: hybrid@furnibles.com / test123');
}

async function cleanDatabase() {
  console.log('🧹 Cleaning existing data...');
  
  // Limpiar en orden para evitar errores de FK
  await prisma.orderItem.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.downloadToken.deleteMany();
  await prisma.download.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.feeConfig.deleteMany();
  await prisma.sellerProfile.deleteMany();
  await prisma.buyerProfile.deleteMany();
  await prisma.user.deleteMany();
  
  console.log('✅ Database cleaned');
}

async function createUsers() {
  console.log('👥 Creating users...');

  // Admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@furnibles.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'Furnibles',
      role: UserRole.ADMIN,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      isActive: true,
      status: UserStatus.ACTIVE,
      isBoth: true, // Admin puede ser buyer y seller
    },
  });

  // Crear perfiles para admin
  await prisma.sellerProfile.create({
    data: {
      userId: admin.id,
      storeName: 'Furnibles Official Store',
      slug: 'furnibles-official',
      description: 'Tienda oficial de Furnibles con los mejores diseños',
      isVerified: true,
      totalSales: 50,
      rating: 4.9,
    },
  });

  await prisma.buyerProfile.create({
    data: {
      userId: admin.id,
      preferences: { 
        categories: ['TABLES', 'CHAIRS', 'BEDS'],
        notifications: { email: true, push: true }
      },
      totalOrders: 5,
      totalSpent: 89.95,
    },
  });

  // Seller user
  const sellerPassword = await bcrypt.hash('seller123', 12);
  const seller = await prisma.user.create({
    data: {
      email: 'seller@furnibles.com',
      password: sellerPassword,
      firstName: 'Juan',
      lastName: 'Carpintero',
      role: UserRole.SELLER,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      isActive: true,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.sellerProfile.create({
    data: {
      userId: seller.id,
      storeName: 'Muebles Juan',
      slug: 'muebles-juan',
      description: 'Especialista en muebles de madera rústicos y modernos con 15 años de experiencia',
      website: 'https://mueblesjuan.com',
      phone: '+1234567890',
      isVerified: true,
      totalSales: 127,
      rating: 4.7,
    },
  });

  // Buyer user
  const buyerPassword = await bcrypt.hash('buyer123', 12);
  const buyer = await prisma.user.create({
    data: {
      email: 'buyer@furnibles.com',
      password: buyerPassword,
      firstName: 'Maria',
      lastName: 'Compradora',
      role: UserRole.BUYER,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      isActive: true,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.buyerProfile.create({
    data: {
      userId: buyer.id,
      preferences: { 
        categories: ['TABLES', 'CHAIRS', 'DECORATIVE'],
        budget: 'medium',
        style: 'modern'
      },
      totalOrders: 12,
      totalSpent: 234.85,
    },
  });

  // Hybrid user (buyer + seller)
  const hybridPassword = await bcrypt.hash('test123', 12);
  const hybrid = await prisma.user.create({
    data: {
      email: 'hybrid@furnibles.com',
      password: hybridPassword,
      firstName: 'Ana',
      lastName: 'Híbrida',
      role: UserRole.BUYER,
      isBoth: true,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      isActive: true,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.buyerProfile.create({
    data: {
      userId: hybrid.id,
      preferences: { 
        categories: ['OUTDOOR', 'DECORATIVE', 'KITCHEN'],
        style: 'minimalist'
      },
      totalOrders: 8,
      totalSpent: 156.40,
    },
  });

  await prisma.sellerProfile.create({
    data: {
      userId: hybrid.id,
      storeName: 'Ana Designs',
      slug: 'ana-designs',
      description: 'Diseños únicos y personalizados con enfoque minimalista',
      isVerified: true,
      totalSales: 23,
      rating: 4.8,
    },
  });

  console.log('✅ Users created successfully');
}

async function createFeeConfigs() {
  console.log('💰 Creating fee configurations...');

  const feeConfigs = [
    {
      id: 'platform-fee-global',
      name: 'Platform Fee Global',
      type: FeeType.PLATFORM_FEE,
      isPercentage: true,
      value: 0.10, // 10%
      priority: 100,
      description: 'Fee estándar de la plataforma aplicado a todas las transacciones',
      isActive: true,
    },
    {
      id: 'platform-fee-argentina',
      name: 'Platform Fee Argentina',
      type: FeeType.PLATFORM_FEE,
      country: 'AR',
      isPercentage: true,
      value: 0.08, // 8%
      priority: 200,
      description: 'Fee reducido para el mercado argentino',
      isActive: true,
    },
    {
      id: 'stripe-processing-fee',
      name: 'Stripe Processing Fee',
      type: FeeType.PAYMENT_PROCESSING,
      paymentMethod: 'stripe',
      isPercentage: true,
      value: 0.029, // 2.9%
      minAmount: 0.30, // + $0.30 fijo
      priority: 50,
      description: 'Fee de procesamiento de Stripe',
      isActive: true,
    },
  ];

  for (const config of feeConfigs) {
    await prisma.feeConfig.create({ data: config });
  }

  console.log('✅ Fee configurations created successfully');
}

async function createSampleProducts() {
  console.log('🛋️ Creating sample products...');

  const seller = await prisma.user.findUnique({
    where: { email: 'seller@furnibles.com' }
  });

  const admin = await prisma.user.findUnique({
    where: { email: 'admin@furnibles.com' }
  });

  if (!seller || !admin) {
    console.log('❌ Seller or admin not found');
    return;
  }

  const sampleProducts = [
    {
      title: 'Mesa de Comedor Moderna Escandinava',
      description: 'Diseño elegante y minimalista inspirado en el estilo escandinavo. Perfecta para comedores modernos con capacidad para 6 personas. Incluye planos detallados con medidas exactas y lista completa de materiales.',
      price: 12.99,
      category: ProductCategory.TABLES,
      difficulty: Difficulty.INTERMEDIATE,
      // Arrays convertidos a JSON strings para SQLite
      tags: JSON.stringify(['mesa', 'comedor', 'escandinavo', 'moderno', 'madera']),
      estimatedTime: '8-12 horas',
      toolsRequired: JSON.stringify(['sierra circular', 'taladro', 'lijadora orbital', 'router']),
      materials: JSON.stringify(['tablero de roble', 'patas torneadas', 'tornillos', 'pegamento', 'barniz']),
      dimensions: '180cm x 90cm x 75cm',
      imageFileIds: JSON.stringify(['mesa-comedor-1.jpg', 'mesa-comedor-2.jpg']),
      thumbnailFileIds: JSON.stringify(['mesa-comedor-thumb.jpg']),
      specifications: {
        weight: '45kg',
        capacity: '6 personas',
        style: 'escandinavo',
        difficulty_level: 'intermediate',
        wood_type: 'roble'
      },
      featured: true,
      sellerId: seller.id,
      status: ProductStatus.APPROVED,
      publishedAt: new Date(),
      moderatedBy: admin.id,
      moderatedAt: new Date(),
    },
    {
      title: 'Silla de Oficina Ergonómica DIY',
      description: 'Diseño ergonómico para largas horas de trabajo. Respaldo ajustable y asiento acolchado. Planos incluyen variaciones para diferentes alturas y patrones para el tapizado.',
      price: 8.99,
      category: ProductCategory.CHAIRS,
      difficulty: Difficulty.ADVANCED,
      tags: JSON.stringify(['silla', 'oficina', 'ergonomica', 'tapizado']),
      estimatedTime: '6-8 horas',
      toolsRequired: JSON.stringify(['sierra de calar', 'taladro', 'grapadora', 'destornillador']),
      materials: JSON.stringify(['contrachapado', 'espuma', 'tela', 'tornillería', 'ruedas']),
      dimensions: '60cm x 55cm x 85-95cm',
      imageFileIds: JSON.stringify(['silla-oficina-1.jpg']),
      thumbnailFileIds: JSON.stringify(['silla-oficina-thumb.jpg']),
      specifications: {
        adjustable_height: '85-95cm',
        weight_capacity: '120kg',
        style: 'ergonómico',
        difficulty_level: 'advanced'
      },
      featured: false,
      sellerId: seller.id,
      status: ProductStatus.APPROVED,
      publishedAt: new Date(),
      moderatedBy: admin.id,
      moderatedAt: new Date(),
    },
    {
      title: 'Estantería Modular Minimalista',
      description: 'Sistema modular de estanterías que se puede expandir según necesidades. Diseño limpio y funcional ideal para cualquier espacio. Fácil montaje sin herramientas especiales.',
      price: 5.99,
      category: ProductCategory.STORAGE,
      difficulty: Difficulty.BEGINNER,
      tags: JSON.stringify(['estanteria', 'modular', 'minimalista', 'facil']),
      estimatedTime: '2-3 horas',
      toolsRequired: JSON.stringify(['taladro', 'nivel', 'destornillador']),
      materials: JSON.stringify(['tablero melamina', 'escuadras', 'tornillos']),
      dimensions: '80cm x 30cm x 200cm (por módulo)',
      imageFileIds: JSON.stringify(['estanteria-1.jpg', 'estanteria-2.jpg', 'estanteria-3.jpg']),
      thumbnailFileIds: JSON.stringify(['estanteria-thumb.jpg']),
      specifications: {
        modules: 'expandible',
        load_capacity: '25kg por estante',
        style: 'minimalista',
        difficulty_level: 'beginner'
      },
      featured: true,
      sellerId: admin.id,
      status: ProductStatus.APPROVED,
      publishedAt: new Date(),
      moderatedBy: admin.id,
      moderatedAt: new Date(),
    },
  ];

  for (const [index, productData] of sampleProducts.entries()) {
    // Generar slug único con timestamp
    const baseSlug = productData.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    const uniqueSlug = `${baseSlug}-${Date.now()}-${index}`;

    try {
      const product = await prisma.product.create({
        data: {
          ...productData,
          slug: uniqueSlug,
          viewCount: Math.floor(Math.random() * 500) + 50,
          favoriteCount: Math.floor(Math.random() * 50) + 5,
          rating: parseFloat((Math.random() * 2 + 3).toFixed(1)), // Entre 3.0 y 5.0
          reviewCount: Math.floor(Math.random() * 20) + 3,
        },
      });

      console.log(`✅ Created product: ${product.title}`);
    } catch (error) {
      console.error(`❌ Error creating product ${productData.title}:`, error);
    }
  }

  console.log('✅ Sample products created successfully');
}

async function createSampleOrderData() {
  console.log('🛒 Creating sample order data...');

  const buyer = await prisma.user.findUnique({
    where: { email: 'buyer@furnibles.com' }
  });

  const seller = await prisma.user.findUnique({
    where: { email: 'seller@furnibles.com' }
  });

  const products = await prisma.product.findMany({
    where: { status: ProductStatus.APPROVED },
    take: 2
  });

  if (!buyer || !seller || products.length === 0) {
    console.log('❌ Required data not found for sample orders');
    return;
  }

  // Crear algunos items en el carrito del buyer
  for (let i = 0; i < Math.min(2, products.length); i++) {
    const product = products[i];
    await prisma.cartItem.create({
      data: {
        userId: buyer.id,
        productId: product.id,
        priceSnapshot: product.price,
        quantity: 1,
        addedAt: new Date(),
      },
    });
  }

  // Crear una orden de ejemplo completada
  const orderNumber = `ORD-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Date.now().toString().slice(-6)}`;

  const totalAmount = products.slice(0, 2).reduce((sum, p) => sum + p.price, 0);
  const platformFee = totalAmount * 0.10;
  const sellerAmount = totalAmount - platformFee;

  const completedOrder = await prisma.order.create({
    data: {
      orderNumber,
      buyerId: buyer.id,
      subtotal: totalAmount,
      platformFeeRate: 0.10,
      platformFee: platformFee,
      totalAmount: totalAmount + platformFee,
      sellerAmount: sellerAmount,
      subtotalAmount: totalAmount,
      status: 'COMPLETED',
      buyerEmail: buyer.email,
      paymentIntentId: `pi_test_${Date.now()}`,
      paymentStatus: 'succeeded',
      paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
      feeBreakdown: {
        platform_fee: {
          type: 'PLATFORM_FEE',
          description: 'Fee de plataforma (10%)',
          amount: platformFee,
          percentage: 10
        }
      },
    }
  });

  // Crear items de la orden
  for (let i = 0; i < Math.min(2, products.length); i++) {
    const product = products[i];
    await prisma.orderItem.create({
      data: {
        orderId: completedOrder.id,
        productId: product.id,
        sellerId: seller.id,
        productTitle: product.title,
        productSlug: product.slug,
        price: product.price,
        quantity: 1,
        sellerName: `${seller.firstName} ${seller.lastName}`,
        storeName: 'Muebles Juan'
      }
    });

    // Crear token de descarga
    await prisma.downloadToken.create({
      data: {
        token: `dl_${Date.now()}_${i}`,
        orderId: completedOrder.id,
        productId: product.id,
        buyerId: buyer.id,
        downloadLimit: 5,
        downloadCount: 0,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
        isActive: true,
      }
    });
  }

  console.log('✅ Sample order data created successfully');
}

// Ejecutar seed
main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });