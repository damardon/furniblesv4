// Seed data para productos de prueba
// prisma/seed-products.ts
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
    tags: ['mesa', 'comedor', 'escandinavo', 'moderno', 'madera'],
    estimatedTime: '8-12 horas',
    toolsRequired: ['sierra circular', 'taladro', 'lijadora orbital', 'router'],
    materials: ['tablero de roble', 'patas torneadas', 'tornillos', 'pegamento', 'barniz'],
    dimensions: '180cm x 90cm x 75cm',
    pdfUrl: 'placeholder-pdf-url',
    previewImages: ['mesa-comedor-1.jpg', 'mesa-comedor-2.jpg'],
  },
  {
    title: 'Silla de Oficina Ergonómica DIY',
    description: 'Diseño ergonómico para largas horas de trabajo. Respaldo ajustable y asiento acolchado. Planos incluyen variaciones para diferentes alturas y patrones para el tapizado.',
    price: 8.99,
    category: ProductCategory.CHAIRS,
    difficulty: Difficulty.ADVANCED,
    status: ProductStatus.APPROVED,
    tags: ['silla', 'oficina', 'ergonomica', 'tapizado'],
    estimatedTime: '6-8 horas',
    toolsRequired: ['sierra de calar', 'taladro', 'grapadora', 'destornillador'],
    materials: ['contrachapado', 'espuma', 'tela', 'tornillería', 'ruedas'],
    dimensions: '60cm x 55cm x 85-95cm',
    pdfUrl: 'placeholder-pdf-url',
    previewImages: ['silla-oficina-1.jpg'],
  },
  {
    title: 'Estantería Modular Minimalista',
    description: 'Sistema modular de estanterías que se puede expandir según necesidades. Diseño limpio y funcional ideal para cualquier espacio. Fácil montaje sin herramientas especiales.',
    price: 5.99,
    category: ProductCategory.STORAGE,
    difficulty: Difficulty.BEGINNER,
    status: ProductStatus.APPROVED,
    tags: ['estanteria', 'modular', 'minimalista', 'facil'],
    estimatedTime: '2-3 horas',
    toolsRequired: ['taladro', 'nivel', 'destornillador'],
    materials: ['tablero melamina', 'escuadras', 'tornillos'],
    dimensions: '80cm x 30cm x 200cm (por módulo)',
    pdfUrl: 'placeholder-pdf-url',
    previewImages: ['estanteria-1.jpg', 'estanteria-2.jpg', 'estanteria-3.jpg'],
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

// API Documentation Examples
// Para usar con herramientas como Postman o Insomnia

export const ProductsAPIExamples = {
  // POST /api/products
  createProduct: {
    method: 'POST',
    url: '/api/products',
    headers: {
      'Authorization': 'Bearer <jwt_token>',
      'Content-Type': 'application/json',
      'Accept-Language': 'es', // o 'en'
    },
    body: {
      title: 'Mesa de Centro Vintage',
      description: 'Hermosa mesa de centro con diseño vintage que combinará perfectamente con tu sala de estar. Los planos incluyen medidas detalladas y técnicas de envejecido de la madera.',
      price: 9.99,
      category: 'TABLES',
      difficulty: 'INTERMEDIATE',
      tags: ['mesa', 'centro', 'vintage', 'sala'],
      estimatedTime: '4-6 horas',
      toolsRequired: ['sierra', 'lijadora', 'taladro'],
      materials: ['madera de pino', 'tornillos', 'tinte'],
      dimensions: '100cm x 60cm x 45cm',
      specifications: {
        style: 'vintage',
        weight_capacity: '50kg',
        finish: 'natural'
      }
    }
  },

  // GET /api/products (público)
  listProducts: {
    method: 'GET',
    url: '/api/products?category=TABLES&difficulty=INTERMEDIATE&priceMin=5&priceMax=20&sortBy=popular&page=1&limit=12',
    headers: {
      'Accept-Language': 'es'
    }
  },

  // GET /api/products/search
  searchProducts: {
    method: 'GET',
    url: '/api/products/search?q=mesa%20comedor&tags=moderno,madera&sortBy=rating',
    headers: {
      'Accept-Language': 'es'
    }
  },

  // GET /api/products/my (seller)
  myProducts: {
    method: 'GET',
    url: '/api/products/my?status=APPROVED&page=1&limit=10',
    headers: {
      'Authorization': 'Bearer <jwt_token>',
      'Accept-Language': 'es'
    }
  },

  // PATCH /api/products/:id
  updateProduct: {
    method: 'PATCH',
    url: '/api/products/clrk123456789',
    headers: {
      'Authorization': 'Bearer <jwt_token>',
      'Content-Type': 'application/json'
    },
    body: {
      price: 14.99,
      tags: ['mesa', 'comedor', 'premium'],
      description: 'Descripción actualizada con más detalles...'
    }
  },

  // POST /api/products/:id/publish
  publishProduct: {
    method: 'POST',
    url: '/api/products/clrk123456789/publish',
    headers: {
      'Authorization': 'Bearer <jwt_token>'
    }
  },

  // POST /api/products/:id/approve (admin)
  approveProduct: {
    method: 'POST',
    url: '/api/products/clrk123456789/approve',
    headers: {
      'Authorization': 'Bearer <admin_jwt_token>'
    }
  },

  // POST /api/products/:id/reject (admin)
  rejectProduct: {
    method: 'POST',
    url: '/api/products/clrk123456789/reject',
    headers: {
      'Authorization': 'Bearer <admin_jwt_token>',
      'Content-Type': 'application/json'
    },
    body: {
      reason: 'Las imágenes no son claras suficientes. Por favor, suba imágenes de mejor calidad.'
    }
  }
};

// Estados de respuesta esperados
export const ExpectedResponses = {
  // Producto creado exitosamente
  created: {
    status: 201,
    body: {
      id: 'clrk123456789',
      title: 'Mesa de Centro Vintage',
      description: 'Hermosa mesa de centro...',
      slug: 'mesa-de-centro-vintage',
      price: 9.99,
      category: 'TABLES',
      difficulty: 'INTERMEDIATE',
      status: 'DRAFT',
      tags: ['mesa', 'centro', 'vintage', 'sala'],
      viewCount: 0,
      downloadCount: 0,
      favoriteCount: 0,
      rating: 0,
      reviewCount: 0,
      seller: {
        id: 'seller_id',
        name: 'Juan Pérez',
        avatar: null
      },
      createdAt: '2024-01-15T10:30:00.000Z',
      updatedAt: '2024-01-15T10:30:00.000Z'
    }
  },

  // Lista paginada de productos
  productsList: {
    status: 200,
    body: {
      data: [
        {
          id: 'clrk123456789',
          title: 'Mesa de Comedor Moderna',
          // ... otros campos
        }
      ],
      total: 45,
      page: 1,
      limit: 12,
      totalPages: 4,
      hasNext: true,
      hasPrev: false
    }
  },

  // Errores comunes
  errors: {
    notFound: {
      status: 404,
      body: {
        statusCode: 404,
        message: 'Producto no encontrado',
        error: 'Not Found'
      }
    },
    validation: {
      status: 400,
      body: {
        statusCode: 400,
        message: [
          'El título debe tener al menos 10 caracteres',
          'El precio debe ser un número válido'
        ],
        error: 'Bad Request'
      }
    },
    unauthorized: {
      status: 401,
      body: {
        statusCode: 401,
        message: 'Token inválido',
        error: 'Unauthorized'
      }
    },
    forbidden: {
      status: 403,
      body: {
        statusCode: 403,
        message: 'No tienes autorización para modificar este producto',
        error: 'Forbidden'
      }
    }
  }
};

// Comandos de testing
export const TestingCommands = {
  // Tests unitarios
  unit: 'npm run test -- products',
  
  // Tests de integración
  integration: 'npm run test:e2e -- products',
  
  // Coverage
  coverage: 'npm run test:cov -- products',
  
  // Watch mode
  watch: 'npm run test:watch -- products'
};

// Script de migración y seed
export const SetupCommands = {
  // Aplicar cambios de schema
  dbPush: 'npx prisma db push',
  
  // Generar cliente
  generate: 'npx prisma generate',
  
  // Ejecutar seeds
  seed: 'npx ts-node prisma/seed-products.ts',
  
  // Ver base de datos
  studio: 'npx prisma studio',
  
  // Reset completo (¡cuidado en producción!)
  reset: 'npx prisma migrate reset'
};