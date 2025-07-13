// prisma/seed.ts - Seed corregido para Etapa 7
import { PrismaClient, UserRole, FeeType, ProductCategory, NotificationType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed for Stage 7: Orders System...');

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

async function createUsers() {
  console.log('👥 Creating users...');

  // Admin user
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
      sellerProfile: {
        create: {
          storeName: 'Furnibles Official Store',
          slug: 'furnibles-official',
          description: 'Tienda oficial de Furnibles con los mejores diseños',
          isVerified: true,
          totalSales: 50,
          rating: 4.9,
        },
      },
      buyerProfile: {
        create: {
          preferences: { 
            categories: ['TABLES', 'CHAIRS', 'BEDS'],
            notifications: { email: true, push: true }
          },
          totalOrders: 5,
          totalSpent: 89.95,
        },
      },
    },
  });

  // Seller user
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
          description: 'Especialista en muebles de madera rústicos y modernos con 15 años de experiencia',
          website: 'https://mueblesjuan.com',
          phone: '+1234567890',
          isVerified: true,
          totalSales: 127,
          rating: 4.7,
        },
      },
    },
  });

  // Buyer user
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
          preferences: { 
            categories: ['TABLES', 'CHAIRS', 'DECORATIVE'],
            budget: 'medium',
            style: 'modern'
          },
          totalOrders: 12,
          totalSpent: 234.85,
        },
      },
    },
  });

  // Hybrid user (buyer + seller)
  const hybridPassword = await bcrypt.hash('test123', 12);
  const hybrid = await prisma.user.upsert({
    where: { email: 'hybrid@furnibles.com' },
    update: {},
    create: {
      email: 'hybrid@furnibles.com',
      password: hybridPassword,
      firstName: 'Ana',
      lastName: 'Híbrida',
      role: UserRole.BUYER,
      isBoth: true,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      isActive: true,
      buyerProfile: {
        create: {
          preferences: { 
            categories: ['OUTDOOR', 'DECORATIVE', 'KITCHEN'],
            style: 'minimalist'
          },
          totalOrders: 8,
          totalSpent: 156.40,
        },
      },
      sellerProfile: {
        create: {
          storeName: 'Ana Designs',
          slug: 'ana-designs',
          description: 'Diseños únicos y personalizados con enfoque minimalista',
          isVerified: true,
          totalSales: 23,
          rating: 4.8,
        },
      },
    },
  });

  // Seller no verificado
  const unverifiedPassword = await bcrypt.hash('test123', 12);
  await prisma.user.upsert({
    where: { email: 'seller-unverified@furnibles.com' },
    update: {},
    create: {
      email: 'seller-unverified@furnibles.com',
      password: unverifiedPassword,
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
          totalSales: 0,
          rating: 0,
        },
      },
    },
  });

  console.log('✅ Users created successfully');
}

async function createFeeConfigs() {
  console.log('💰 Creating fee configurations...');

  // Fee global de plataforma (10%)
  await prisma.feeConfig.upsert({
    where: { id: 'platform-fee-global' },
    update: {},
    create: {
      id: 'platform-fee-global',
      name: 'Platform Fee Global',
      type: FeeType.PLATFORM_FEE,
      isPercentage: true,
      value: 0.10, // 10%
      priority: 100,
      description: 'Fee estándar de la plataforma aplicado a todas las transacciones',
      isActive: true,
    },
  });

  // Fee específico para Argentina (8%)
  await prisma.feeConfig.upsert({
    where: { id: 'platform-fee-argentina' },
    update: {},
    create: {
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
  });

  // Fee de procesamiento de pago Stripe (2.9% + $0.30)
  await prisma.feeConfig.upsert({
    where: { id: 'stripe-processing-fee' },
    update: {},
    create: {
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
  });

  // Fee especial para categoría PREMIUM (12%)
  await prisma.feeConfig.upsert({
    where: { id: 'premium-category-fee' },
    update: {},
    create: {
      id: 'premium-category-fee',
      name: 'Premium Category Fee',
      type: FeeType.PLATFORM_FEE,
      category: ProductCategory.BEDS,
      isPercentage: true,
      value: 0.12, // 12%
      priority: 150,
      description: 'Fee premium para productos de alta gama',
      isActive: true,
    },
  });

  // Fee regional para LATAM (9%)
  await prisma.feeConfig.upsert({
    where: { id: 'latam-regional-fee' },
    update: {},
    create: {
      id: 'latam-regional-fee',
      name: 'LATAM Regional Fee',
      type: FeeType.REGIONAL_FEE,
      region: 'LATAM',
      isPercentage: true,
      value: 0.09, // 9%
      priority: 120,
      description: 'Fee regional para países de Latinoamérica',
      isActive: true,
    },
  });

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
      description: 'Diseño elegante y minimalista inspirado en el estilo escandinavo. Perfecta para comedores modernos con capacidad para 6 personas. Incluye planos detallados con medidas exactas y lista completa de materiales. Diseño probado por más de 500 personas.',
      price: 12.99,
      category: ProductCategory.TABLES,
      difficulty: 'INTERMEDIATE' as any,
      tags: ['mesa', 'comedor', 'escandinavo', 'moderno', 'madera', 'roble'],
      estimatedTime: '8-12 horas',
      toolsRequired: ['sierra circular', 'taladro', 'lijadora orbital', 'router', 'escuadra'],
      materials: ['tablero de roble 40mm', 'patas torneadas', 'tornillos', 'pegamento', 'barniz', 'lija'],
      dimensions: '180cm x 90cm x 75cm',
      specifications: {
        weight: '45kg',
        capacity: '6 personas',
        style: 'escandinavo',
        difficulty_level: 'intermediate',
        wood_type: 'roble'
      },
      featured: true,
      sellerId: seller.id,
    },
    {
      title: 'Silla de Oficina Ergonómica DIY',
      description: 'Diseño ergonómico profesional para largas horas de trabajo. Respaldo ajustable y asiento acolchado con soporte lumbar. Planos incluyen variaciones para diferentes alturas y patrones para el tapizado personalizado.',
      price: 8.99,
      category: ProductCategory.CHAIRS,
      difficulty: 'ADVANCED' as any,
      tags: ['silla', 'oficina', 'ergonomica', 'tapizado', 'ajustable'],
      estimatedTime: '6-8 horas',
      toolsRequired: ['sierra de calar', 'taladro', 'grapadora', 'destornillador', 'máquina de coser'],
      materials: ['contrachapado 18mm', 'espuma alta densidad', 'tela', 'tornillería', 'ruedas', 'gas lift'],
      dimensions: '60cm x 55cm x 85-95cm',
      specifications: {
        adjustable_height: '85-95cm',
        weight_capacity: '120kg',
        style: 'ergonómico',
        difficulty_level: 'advanced'
      },
      featured: false,
      sellerId: seller.id,
    },
    {
      title: 'Estantería Modular Minimalista',
      description: 'Sistema modular de estanterías que se puede expandir según necesidades. Diseño limpio y funcional ideal para cualquier espacio. Fácil montaje sin herramientas especiales. Perfecta para principiantes.',
      price: 5.99,
      category: ProductCategory.STORAGE,
      difficulty: 'BEGINNER' as any,
      tags: ['estanteria', 'modular', 'minimalista', 'facil', 'principiantes'],
      estimatedTime: '2-3 horas',
      toolsRequired: ['taladro', 'nivel', 'destornillador'],
      materials: ['tablero melamina', 'escuadras metálicas', 'tornillos', 'tacos'],
      dimensions: '80cm x 30cm x 200cm (por módulo)',
      specifications: {
        modules: 'expandible',
        load_capacity: '25kg por estante',
        style: 'minimalista',
        difficulty_level: 'beginner'
      },
      featured: true,
      sellerId: admin.id,
    },
    {
      title: 'Cama King Size con Cabecero Acolchado',
      description: 'Elegante cama tamaño King con cabecero acolchado personalizable. Incluye diseños para base con almacenamiento opcional. Perfecta para dormitorios principales con estilo contemporáneo.',
      price: 24.99,
      category: ProductCategory.BEDS,
      difficulty: 'EXPERT' as any,
      tags: ['cama', 'king', 'cabecero', 'acolchado', 'almacenamiento'],
      estimatedTime: '15-20 horas',
      toolsRequired: ['sierra circular', 'router', 'taladro', 'grapadora tapicera', 'lijadora'],
      materials: ['tablero MDF', 'espuma', 'tela tapicería', 'botones', 'tornillería', 'patas'],
      dimensions: '200cm x 180cm x 120cm',
      specifications: {
        size: 'King (180x200cm)',
        headboard_height: '120cm',
        storage: 'opcional',
        style: 'contemporáneo',
        difficulty_level: 'expert'
      },
      featured: true,
      sellerId: admin.id,
    },
    {
      title: 'Mesa de Centro Industrial Vintage',
      description: 'Mesa de centro con diseño industrial vintage que combina madera reciclada y metal. Perfecta para salas modernas. Incluye técnicas de envejecido y acabados especiales.',
      price: 9.99,
      category: ProductCategory.TABLES,
      difficulty: 'INTERMEDIATE' as any,
      tags: ['mesa', 'centro', 'industrial', 'vintage', 'metal', 'reciclada'],
      estimatedTime: '6-8 horas',
      toolsRequired: ['soldadora', 'amoladora', 'taladro', 'lijadora', 'compresor'],
      materials: ['madera reciclada', 'tubo de metal', 'ruedas industriales', 'tornillos', 'barniz'],
      dimensions: '120cm x 60cm x 45cm',
      specifications: {
        weight: '35kg',
        style: 'industrial vintage',
        wheels: 'con freno',
        difficulty_level: 'intermediate'
      },
      featured: false,
      sellerId: seller.id,
    }
  ];

  for (const productData of sampleProducts) {
    const slug = productData.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    await prisma.product.create({
      data: {
        title: productData.title,
        description: productData.description,
        slug: `${slug}-${Date.now()}`, // Asegurar unicidad
        price: productData.price,
        category: productData.category,
        difficulty: productData.difficulty as any, // Force cast for enum
        tags: productData.tags,
        estimatedTime: productData.estimatedTime,
        toolsRequired: productData.toolsRequired,
        materials: productData.materials,
        dimensions: productData.dimensions,
        specifications: productData.specifications,
        featured: productData.featured,
        sellerId: productData.sellerId,
        status: 'APPROVED',
        publishedAt: new Date(),
        moderatedBy: admin.id,
        moderatedAt: new Date(),
        viewCount: Math.floor(Math.random() * 500) + 50,
        favoriteCount: Math.floor(Math.random() * 50) + 5,
        rating: parseFloat((Math.random() * 2 + 3).toFixed(1)), // Entre 3.0 y 5.0
        reviewCount: Math.floor(Math.random() * 20) + 3,
      },
    });
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
    where: { status: 'APPROVED' },
    take: 3
  });

  if (!buyer || !seller || products.length === 0) {
    console.log('❌ Required data not found for sample orders');
    return;
  }

  // Crear algunos items en el carrito del buyer
  for (let i = 0; i < 2; i++) {
    const product = products[i];
    if (product) {
      await prisma.cartItem.upsert({
        where: {
          userId_productId: {
            userId: buyer.id,
            productId: product.id
          }
        },
        update: {},
        create: {
          userId: buyer.id,
          productId: product.id,
          priceSnapshot: product.price,
          quantity: 1,
          addedAt: new Date(),
        },
      });
    }
  }

  // Crear una orden de ejemplo completada
  const completedOrder = await prisma.order.create({
    data: {
      orderNumber: 'ORD-20250623-001',
      buyerId: buyer.id,
      subtotal: 21.98,
      platformFeeRate: 0.10,
      platformFee: 2.20,
      totalAmount: 24.18,
      sellerAmount: 19.78,
      status: 'COMPLETED',
      buyerEmail: buyer.email,
      subtotalAmount: 120,
      paymentIntentId: 'pi_test_1234567890',
      paymentStatus: 'succeeded',
      paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 días atrás
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // 30 min después
      feeBreakdown: [
        {
          type: 'PLATFORM_FEE',
          description: 'Fee de plataforma (10%)',
          amount: 2.20,
          rate: 0.10
        }
      ],
      items: {
        create: [
          {
            productId: products[0].id,
            sellerId: seller.id,
            productTitle: products[0].title,
            productSlug: products[0].slug,
            price: products[0].price,
            quantity: 1,
            sellerName: `${seller.firstName} ${seller.lastName}`,
            storeName: 'Muebles Juan'
          },
          {
            productId: products[1].id,
            sellerId: seller.id,
            productTitle: products[1].title,
            productSlug: products[1].slug,
            price: products[1].price,
            quantity: 1,
            sellerName: `${seller.firstName} ${seller.lastName}`,
            storeName: 'Muebles Juan'
          }
        ]
      }
    }
  });

  // Crear tokens de descarga para la orden completada
  for (const product of products.slice(0, 2)) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 días

    await prisma.downloadToken.create({
      data: {
        orderId: completedOrder.id,
        productId: product.id,
        buyerId: buyer.id,
        downloadLimit: 5,
        downloadCount: 1, // Ya descargado una vez
        expiresAt,
        lastDownloadAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Ayer
        lastIpAddress: '192.168.1.100',
        lastUserAgent: 'Mozilla/5.0 (Test Browser)',
      }
    });
  }

  // Crear algunas notificaciones de ejemplo
  await prisma.notification.createMany({
    data: [
      {
        userId: buyer.id,
        type: NotificationType.ORDER_COMPLETED,
        title: '¡Archivos listos para descarga!',
        message: `Tu orden ${completedOrder.orderNumber} está completa. Ya puedes descargar tus archivos.`,
        data: {
          orderId: completedOrder.id,
          orderNumber: completedOrder.orderNumber,
          downloadUrl: `${process.env.FRONTEND_URL}/orders/${completedOrder.id}/downloads`
        },
        orderId: completedOrder.id,
        isRead: false,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        userId: seller.id,
        type: NotificationType.PRODUCT_SOLD,
        title: '¡Nueva venta!',
        message: `Has vendido 2 producto(s) por un total de $19.78.`,
        data: {
          orderId: completedOrder.id,
          orderNumber: completedOrder.orderNumber,
          sellerAmount: 19.78,
          itemCount: 2,
        },
        orderId: completedOrder.id,
        isRead: true,
        readAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000),
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      }
    ]
  });

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