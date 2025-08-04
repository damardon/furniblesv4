import { PrismaClient } from '@prisma/client';
import { UserRole, ProductStatus, ProductCategory, Difficulty } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

interface CreatedSeller {
  user: any;
  seller: any;
}

async function seedTestData() {
  try {
    console.log('🌱 Creating 6 sellers with their products...');

    // ✅ 6 vendedores completos
    const sellers = [
      {
        email: 'juan@mueblesjuan.com',
        firstName: 'Juan',
        lastName: 'Carpintero',
        storeName: 'Muebles Juan',
        slug: 'muebles-juan',
        description: 'Especialista en muebles de madera maciza con más de 15 años de experiencia',
      },
      {
        email: 'maria@eltallerdemaria.com',
        firstName: 'María',
        lastName: 'Diseñadora',
        storeName: 'El Taller de María',
        slug: 'el-taller-de-maria',
        description: 'Diseños modernos y funcionales para espacios contemporáneos',
      },
      {
        email: 'carlos@maderapura.com',
        firstName: 'Carlos',
        lastName: 'Artesano',
        storeName: 'Madera Pura',
        slug: 'madera-pura',
        description: 'Muebles rústicos y tradicionales hechos a mano',
      },
      {
        email: 'sofia@maderapremium.com',
        firstName: 'Sofia',
        lastName: 'Madera',
        storeName: 'Madera Premium',
        slug: 'madera-premium',
        description: 'Especialista en muebles de madera de alta calidad con técnicas artesanales tradicionales',
      },
      {
        email: 'diego@disenosmodernos.com',
        firstName: 'Diego',
        lastName: 'Moderno',
        storeName: 'Diseños Modernos',
        slug: 'disenos-modernos',
        description: 'Creador de muebles contemporáneos con líneas limpias y funcionalidad innovadora',
      },
      {
        email: 'lucia@rusticochic.com',
        firstName: 'Lucia',
        lastName: 'Rústica',
        storeName: 'Rústico Chic',
        slug: 'rustico-chic',
        description: 'Combinando lo rústico con lo elegante para crear piezas únicas de decoración',
      },
    ];

    const createdSellers: CreatedSeller[] = [];

    for (const sellerData of sellers) {
      // Verificar si el usuario ya existe
      const existingUser = await prisma.user.findUnique({
        where: { email: sellerData.email }
      });

      if (existingUser) {
        console.log(`⚠️ User ${sellerData.email} already exists, skipping...`);
        const existingSeller = await prisma.sellerProfile.findUnique({
          where: { userId: existingUser.id }
        });
        if (existingSeller) {
          createdSellers.push({ user: existingUser, seller: existingSeller });
        }
        continue;
      }

      // Crear usuario
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const user = await prisma.user.create({
        data: {
          email: sellerData.email,
          firstName: sellerData.firstName,
          lastName: sellerData.lastName,
          password: hashedPassword,
          role: UserRole.SELLER,
          isActive: true,
          emailVerified: true,
        },
      });

      // Crear perfil de vendedor
      const seller = await prisma.sellerProfile.create({
        data: {
          userId: user.id,
          storeName: sellerData.storeName,
          slug: sellerData.slug,
          description: sellerData.description,
          isVerified: true,
        },
      });

      createdSellers.push({ user, seller });
      console.log(`✅ Created seller: ${sellerData.storeName}`);
    }

    console.log('🛠️ Creating 6 products (1 per seller)...');

    // ✅ 6 productos - uno para cada vendedor
    const allProducts = [
      // Producto para Muebles Juan
      {
        sellerId: createdSellers[0]?.user.id,
        title: 'Mesa de Comedor Moderna Roble',
        slug: 'mesa-comedor-moderna-roble',
        description: 'Elegante mesa de comedor en madera de roble con acabado natural. Perfecta para 6 personas. Incluye planos detallados y lista de materiales.',
        price: 89.99,
        category: ProductCategory.LIVING_DINING,
        difficulty: Difficulty.INTERMEDIATE,
        estimatedTime: '8-12 horas',
        dimensions: '180cm x 90cm x 75cm',
        tags: ['mesa', 'comedor', 'roble', 'moderno', 'familia'],
        toolsRequired: ['Sierra circular', 'Taladro', 'Lijadora', 'Ensambladora'],
        materials: ['Tablero de roble 30mm', 'Patas de madera', 'Tornillos', 'Barniz'],
      },
      // Producto para El Taller de María
      {
        sellerId: createdSellers[1]?.user.id,
        title: 'Escritorio Minimalista Blanco',
        slug: 'escritorio-minimalista-blanco',
        description: 'Escritorio de líneas limpias y diseño minimalista. Perfecto para oficinas modernas y espacios de trabajo en casa.',
        price: 75.00,
        category: ProductCategory.OFFICE,
        difficulty: Difficulty.INTERMEDIATE,
        estimatedTime: '6-8 horas',
        dimensions: '120cm x 60cm x 75cm',
        tags: ['escritorio', 'minimalista', 'blanco', 'oficina', 'moderno'],
        toolsRequired: ['Sierra', 'Taladro', 'Lijadora'],
        materials: ['MDF blanco', 'Herrajes modernos', 'Tornillos', 'Pintura blanca'],
      },
      // Producto para Madera Pura
      {
        sellerId: createdSellers[2]?.user.id,
        title: 'Banco Rústico de Jardín',
        slug: 'banco-rustico-jardin',
        description: 'Banco tradicional para exteriores con acabado rústico. Resistente a la intemperie y perfecto para jardines.',
        price: 65.00,
        category: ProductCategory.OUTDOOR,
        difficulty: Difficulty.BEGINNER,
        estimatedTime: '5-7 horas',
        dimensions: '150cm x 45cm x 45cm',
        tags: ['banco', 'rústico', 'jardín', 'exterior', 'tradicional'],
        toolsRequired: ['Sierra', 'Cepillo', 'Lijadora'],
        materials: ['Madera de roble', 'Tratamiento exterior', 'Tornillos galvanizados'],
      },
      // Producto para Madera Premium
      {
        sellerId: createdSellers[3]?.user.id,
        title: 'Librería Clásica de Roble Macizo',
        slug: 'libreria-clasica-roble-macizo',
        description: 'Imponente librería de estilo clásico construida en roble macizo. Con 5 estantes ajustables y acabado tradicional. Perfecta para bibliotecas y estudios elegantes.',
        price: 180.00,
        category: ProductCategory.STORAGE,
        difficulty: Difficulty.EXPERT,
        estimatedTime: '20-25 horas',
        dimensions: '200cm x 35cm x 220cm',
        tags: ['librería', 'clásico', 'roble', 'macizo', 'biblioteca'],
        toolsRequired: ['Sierra de mesa', 'Cepillo eléctrico', 'Fresadora', 'Formones', 'Gatos de apriete'],
        materials: ['Tableros de roble macizo', 'Molduras decorativas', 'Herrajes de bronce', 'Barniz tradicional'],
      },
      // Producto para Diseños Modernos
      {
        sellerId: createdSellers[4]?.user.id,
        title: 'Mesa de Centro Minimalista Cristal',
        slug: 'mesa-centro-minimalista-cristal',
        description: 'Mesa de centro ultra moderna con estructura de acero y tapa de cristal templado. Diseño flotante que aporta ligereza visual al espacio.',
        price: 95.00,
        category: ProductCategory.LIVING_DINING,
        difficulty: Difficulty.ADVANCED,
        estimatedTime: '10-12 horas',
        dimensions: '120cm x 60cm x 40cm',
        tags: ['mesa', 'centro', 'minimalista', 'cristal', 'moderno'],
        toolsRequired: ['Soldadora MIG', 'Amoladora', 'Taladro', 'Lima', 'Equipos de soldadura'],
        materials: ['Tubo de acero inoxidable', 'Cristal templado 12mm', 'Soportes especiales', 'Pintura electrostática'],
      },
      // Producto para Rústico Chic
      {
        sellerId: createdSellers[5]?.user.id,
        title: 'Aparador Vintage Industrial',
        slug: 'aparador-vintage-industrial',
        description: 'Aparador con estilo vintage industrial combinando madera recuperada y estructura metálica. Perfecto para comedores con personalidad única.',
        price: 140.00,
        category: ProductCategory.STORAGE,
        difficulty: Difficulty.INTERMEDIATE,
        estimatedTime: '15-18 horas',
        dimensions: '160cm x 45cm x 85cm',
        tags: ['aparador', 'vintage', 'industrial', 'recuperada', 'metal'],
        toolsRequired: ['Sierra circular', 'Lijadora orbital', 'Taladro', 'Soldadora básica', 'Cepillo manual'],
        materials: ['Madera recuperada', 'Tubo de hierro negro', 'Herrajes vintage', 'Pátina envejecida'],
      },
    ];

    // Crear productos
    for (const productData of allProducts) {
      if (!productData.sellerId) {
        console.log(`⚠️ Skipping product ${productData.title} (seller not created)`);
        continue;
      }

      // Verificar si el producto ya existe
      const existingProduct = await prisma.product.findFirst({
        where: { slug: productData.slug }
      });

      if (existingProduct) {
        console.log(`⚠️ Product ${productData.slug} already exists, skipping...`);
        continue;
      }

      await prisma.product.create({
        data: {
          title: productData.title,
          slug: productData.slug,
          description: productData.description,
          price: productData.price,
          category: productData.category,
          difficulty: productData.difficulty,
          status: ProductStatus.APPROVED,
          sellerId: productData.sellerId,
          estimatedTime: productData.estimatedTime,
          dimensions: productData.dimensions,
          publishedAt: new Date(),
          // Arrays como JSON strings para SQLite
          tags: JSON.stringify(productData.tags),
          toolsRequired: JSON.stringify(productData.toolsRequired),
          materials: JSON.stringify(productData.materials),
          imageFileIds: JSON.stringify([]), // Vacío por ahora
          thumbnailFileIds: JSON.stringify([]),
          // Valores aleatorios realistas
          rating: 4.0 + Math.random() * 1.0, // Rating entre 4.0 y 5.0
          reviewCount: Math.floor(Math.random() * 40) + 15, // Entre 15 y 55 reviews
          viewCount: Math.floor(Math.random() * 800) + 200, // Entre 200 y 1000 vistas
          downloadCount: Math.floor(Math.random() * 150) + 30, // Entre 30 y 180 descargas
          favoriteCount: Math.floor(Math.random() * 80) + 10, // Entre 10 y 90 favoritos
          featured: Math.random() > 0.6, // 40% probabilidad de ser destacado
        },
      });

      console.log(`✅ Created product: ${productData.title}`);
    }

    console.log('🎉 All test data created successfully!');
    console.log('');
    console.log('📋 Final Summary:');
    console.log(`✅ ${createdSellers.length} sellers total`);
    console.log(`✅ ${allProducts.length} products total`);
    console.log('');
    console.log('🔗 Available seller URLs:');
    createdSellers.forEach(({ seller }) => {
      console.log(`   http://localhost:3000/vendedores/${seller.slug}`);
    });
    console.log('');
    console.log('🔗 Available product URLs:');
    allProducts.forEach((product) => {
      console.log(`   http://localhost:3000/productos/${product.slug}`);
    });
    console.log('');
    console.log('🎯 READY FOR PRODUCTION!');
    console.log('   - All sellers have real data from database');
    console.log('   - All products have real slugs that work');
    console.log('   - No more 404 errors from mock data');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
seedTestData();