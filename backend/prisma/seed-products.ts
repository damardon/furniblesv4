// prisma/seed-products.ts - Corregido para SQLite
import { PrismaClient, ProductCategory, Difficulty, ProductStatus } from '@prisma/client';

const prisma = new PrismaClient();

const sampleProducts = [
  {
    title: 'Mesa de Comedor Moderna Escandinava',
    description: 'Diseño elegante y minimalista inspirado en el estilo escandinavo. Perfecta para comedores modernos con capacidad para 6 personas. Incluye planos detallados con medidas exactas y lista completa de materiales.',
    price: 12.99,
    category: ProductCategory.TABLES,
    difficulty: Difficulty.INTERMEDIATE,
    status: ProductStatus.APPROVED,
    // Arrays convertidos a JSON strings
    tags: JSON.stringify(['mesa', 'comedor', 'escandinavo', 'moderno', 'madera']),
    estimatedTime: '8-12 horas',
    toolsRequired: JSON.stringify(['sierra circular', 'taladro', 'lijadora orbital', 'router']),
    materials: JSON.stringify(['tablero de roble', 'patas torneadas', 'tornillos', 'pegamento', 'barniz']),
    dimensions: '180cm x 90cm x 75cm',
    // Archivos como JSON strings (IDs de archivos)
    imageFileIds: JSON.stringify(['mesa-comedor-1.jpg', 'mesa-comedor-2.jpg']),
    thumbnailFileIds: JSON.stringify(['mesa-comedor-thumb.jpg']),
  },
  {
    title: 'Silla de Oficina Ergonómica DIY',
    description: 'Diseño ergonómico para largas horas de trabajo. Respaldo ajustable y asiento acolchado. Planos incluyen variaciones para diferentes alturas y patrones para el tapizado.',
    price: 8.99,
    category: ProductCategory.CHAIRS,
    difficulty: Difficulty.ADVANCED,
    status: ProductStatus.APPROVED,
    tags: JSON.stringify(['silla', 'oficina', 'ergonomica', 'tapizado']),
    estimatedTime: '6-8 horas',
    toolsRequired: JSON.stringify(['sierra de calar', 'taladro', 'grapadora', 'destornillador']),
    materials: JSON.stringify(['contrachapado', 'espuma', 'tela', 'tornillería', 'ruedas']),
    dimensions: '60cm x 55cm x 85-95cm',
    imageFileIds: JSON.stringify(['silla-oficina-1.jpg']),
    thumbnailFileIds: JSON.stringify(['silla-oficina-thumb.jpg']),
  },
  {
    title: 'Estantería Modular Minimalista',
    description: 'Sistema modular de estanterías que se puede expandir según necesidades. Diseño limpio y funcional ideal para cualquier espacio. Fácil montaje sin herramientas especiales.',
    price: 5.99,
    category: ProductCategory.STORAGE,
    difficulty: Difficulty.BEGINNER,
    status: ProductStatus.APPROVED,
    tags: JSON.stringify(['estanteria', 'modular', 'minimalista', 'facil']),
    estimatedTime: '2-3 horas',
    toolsRequired: JSON.stringify(['taladro', 'nivel', 'destornillador']),
    materials: JSON.stringify(['tablero melamina', 'escuadras', 'tornillos']),
    dimensions: '80cm x 30cm x 200cm (por módulo)',
    imageFileIds: JSON.stringify(['estanteria-1.jpg', 'estanteria-2.jpg', 'estanteria-3.jpg']),
    thumbnailFileIds: JSON.stringify(['estanteria-thumb.jpg']),
  },
];

export async function seedProducts() {
  console.log('🌱 Seeding products...');
  
  // Buscar un seller existente
  const seller = await prisma.user.findFirst({
    where: { role: 'SELLER' },
  });

  if (!seller) {
    console.log('❌ No seller found. Please run main seed first.');
    return;
  }

  for (const productData of sampleProducts) {
    // Generar slug único
    const slug = productData.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    try {
      const product = await prisma.product.create({
        data: {
          ...productData,
          slug,
          sellerId: seller.id,
          publishedAt: new Date(),
          specifications: {
            featured: true,
            difficulty_level: productData.difficulty,
            style: 'modern',
          },
        },
      });

      console.log(`✅ Created product: ${product.title}`);
    } catch (error) {
      console.error(`❌ Error creating product ${productData.title}:`, error);
    }
  }

  console.log('🎉 Products seeded successfully!');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  seedProducts()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

// Función helper para crear un usuario seller si no existe
export async function createSellerIfNotExists() {
  const bcrypt = require('bcryptjs');
  
  const existingSeller = await prisma.user.findFirst({
    where: { role: 'SELLER' },
  });

  if (existingSeller) {
    console.log('✅ Seller already exists');
    return existingSeller;
  }

  console.log('🆕 Creating seller...');
  
  const hashedPassword = await bcrypt.hash('seller123', 12);
  
  const seller = await prisma.user.create({
    data: {
      email: 'seller@furnibles.com',
      password: hashedPassword,
      firstName: 'Vendedor',
      lastName: 'Prueba',
      role: 'SELLER',
      emailVerified: true,
      isActive: true,
      status: 'ACTIVE',
    },
  });

  // Crear perfil de seller
  await prisma.sellerProfile.create({
    data: {
      userId: seller.id,
      storeName: 'Muebles Artesanales',
      slug: 'muebles-artesanales',
      description: 'Especialistas en muebles de madera artesanales',
      isVerified: true,
    },
  });

  console.log('✅ Seller created with profile');
  return seller;
}

// Script completo de seed
export async function fullSeed() {
  console.log('🚀 Starting full seed...');
  
  // 1. Crear seller si no existe
  await createSellerIfNotExists();
  
  // 2. Crear productos
  await seedProducts();
  
  console.log('🎉 Full seed completed!');
}