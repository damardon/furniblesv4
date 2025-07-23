import { Product, ProductCategory, Difficulty, ProductStatus, UserRole, UserStatus } from '@/types'

// Mock data coherente con tu esquema real
export const mockProducts: Product[] = [
  {
    id: 'clx1a2b3c4d5e6f7g8h9i0j1',
    title: 'Mesa de Comedor Moderna Roble',
    description: 'Elegante mesa de comedor con diseño minimalista para 6 personas. Construcción en madera de roble macizo con acabado natural. Incluye sistema de ensamblaje con tornillería oculta.',
    slug: 'mesa-comedor-moderna-roble',
    price: 15.99,
    category: ProductCategory.TABLES,
    difficulty: Difficulty.INTERMEDIATE,
    pdfUrl: '/downloads/mesa-comedor-moderna.pdf',
    pdfFileId: 'file_pdf_001',
    previewImages: [
      'https://picsum.photos/400/300?random=1',
      'https://picsum.photos/400/300?random=2'
    ],
    thumbnails: [
      'https://picsum.photos/200/150?random=1',
      'https://picsum.photos/200/150?random=2'
    ],
    tags: ['moderna', 'comedor', 'roble', 'minimalista', '6-personas'],
    estimatedTime: '8-12 horas',
    toolsRequired: ['Sierra circular', 'Taladro', 'Lijadora', 'Prensas'],
    materials: ['Madera de roble', 'Tornillos', 'Cola de madera', 'Barniz'],
    dimensions: '180cm x 90cm x 75cm',
    specifications: {
      weight: '45kg',
      material: 'Roble macizo',
      finish: 'Natural'
    },
    status: ProductStatus.APPROVED,
    sellerId: 'seller_001',
    viewCount: 1247,
    downloadCount: 2847,
    favoriteCount: 456,
    featured: true,
    rating: 4.8,
    reviewCount: 124,
    moderatedBy: 'admin_001',
    moderatedAt: '2024-11-16T08:45:00Z',
    createdAt: '2024-11-15T08:30:00Z',
    publishedAt: '2024-11-16T09:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
    seller: {
      id: 'seller_001',
      email: 'carlos@maderasmendoza.com',
      firstName: 'Carlos',
      lastName: 'Mendoza',
      role: UserRole.SELLER,
      isBoth: false,
      emailVerified: true,
      isActive: true,
      status: UserStatus.ACTIVE,
      // ✅ Propiedades Stripe requeridas
      stripeConnectId: 'acct_seller_001_maderas',
      onboardingComplete: true,
      payoutsEnabled: true,
      chargesEnabled: true,
      // ✅ Timestamps requeridos
      createdAt: '2024-10-01T08:00:00Z',
      updatedAt: '2024-11-01T10:00:00Z',
      lastLoginAt: '2024-12-01T08:00:00Z',
      sellerProfile: {
        id: 'seller_profile_001',
        storeName: 'Maderas Mendoza',
        slug: 'maderas-mendoza',
        description: 'Especialistas en muebles de madera maciza con más de 15 años de experiencia.',
        website: 'https://maderasmendoza.com',
        phone: '+56 9 8765 4321',
        avatar: 'https://picsum.photos/60/60?random=10',
        rating: 4.9,
        totalSales: 156,
        totalReviews: 124,
        isVerified: true,
        createdAt: '2024-10-01T08:00:00Z',
        updatedAt: '2024-11-01T10:00:00Z'
      }
    }
  },
  {
    id: 'clx2b3c4d5e6f7g8h9i0j1k2',
    title: 'Silla Escandinava Premium',
    description: 'Cómoda silla con respaldo ergonómico y acabado en madera natural. Diseño inspirado en el estilo nórdico con líneas limpias y funcionalidad superior.',
    slug: 'silla-escandinava-premium',
    price: 12.50,
    category: ProductCategory.CHAIRS,
    difficulty: Difficulty.BEGINNER,
    pdfUrl: '/downloads/silla-escandinava.pdf',
    pdfFileId: 'file_pdf_002',
    previewImages: [
      'https://picsum.photos/400/300?random=3',
      'https://picsum.photos/400/300?random=4'
    ],
    thumbnails: [
      'https://picsum.photos/200/150?random=3',
      'https://picsum.photos/200/150?random=4'
    ],
    tags: ['escandinava', 'ergonomica', 'roble', 'nordico', 'comoda'],
    estimatedTime: '4-6 horas',
    toolsRequired: ['Sierra de calar', 'Taladro', 'Lijadora'],
    materials: ['Madera de pino', 'Tornillos', 'Barniz mate'],
    dimensions: '45cm x 45cm x 80cm',
    specifications: {
      weight: '6kg',
      material: 'Pino nórdico',
      finish: 'Barniz mate'
    },
    status: ProductStatus.APPROVED,
    sellerId: 'seller_002',
    viewCount: 892,
    downloadCount: 1823,
    favoriteCount: 234,
    featured: false,
    rating: 4.6,
    reviewCount: 89,
    moderatedBy: 'admin_001',
    moderatedAt: '2024-11-19T10:15:00Z',
    createdAt: '2024-11-18T16:45:00Z',
    publishedAt: '2024-11-19T10:30:00Z',
    updatedAt: '2024-11-20T14:15:00Z',
    seller: {
      id: 'seller_002',
      email: 'ana@nordicdesign.com',
      firstName: 'Ana',
      lastName: 'García',
      role: UserRole.SELLER,
      isBoth: false,
      emailVerified: true,
      isActive: true,
      status: UserStatus.ACTIVE,
      stripeConnectId: 'acct_seller_002_nordic',
      onboardingComplete: true,
      payoutsEnabled: true,
      chargesEnabled: true,
      createdAt: '2024-09-15T12:00:00Z',
      updatedAt: '2024-11-18T16:45:00Z',
      lastLoginAt: '2024-11-20T09:30:00Z',
      sellerProfile: {
        id: 'seller_profile_002',
        storeName: 'Nordic Design Co.',
        slug: 'nordic-design-co',
        description: 'Diseños escandinavos auténticos para el hogar moderno.',
        website: 'https://nordicdesign.com',
        phone: '+56 9 7654 3210',
        avatar: 'https://picsum.photos/60/60?random=11',
        rating: 4.7,
        totalSales: 89,
        totalReviews: 89,
        isVerified: true,
        createdAt: '2024-09-15T12:00:00Z',
        updatedAt: '2024-11-18T16:45:00Z'
      }
    }
  },
  {
    id: 'clx3c4d5e6f7g8h9i0j1k2l3',
    title: 'Estantería Industrial Hierro y Madera',
    description: 'Estantería de estilo industrial con estructura metálica y repisas de madera maciza. Perfecta para espacios modernos que buscan un toque urbano e industrial.',
    slug: 'estanteria-industrial-hierro-madera',
    price: 22.00,
    category: ProductCategory.STORAGE,
    difficulty: Difficulty.ADVANCED,
    pdfUrl: '/downloads/estanteria-industrial.pdf',
    pdfFileId: 'file_pdf_003',
    previewImages: [
      'https://picsum.photos/400/300?random=5',
      'https://picsum.photos/400/300?random=6'
    ],
    thumbnails: [
      'https://picsum.photos/200/150?random=5',
      'https://picsum.photos/200/150?random=6'
    ],
    tags: ['industrial', 'metal', 'organizacion', 'urbano', 'moderno'],
    estimatedTime: '12-16 horas',
    toolsRequired: ['Soldadora', 'Amoladora', 'Taladro', 'Sierra'],
    materials: ['Perfil de hierro', 'Madera de nogal', 'Soldadura', 'Pintura anticorrosiva'],
    dimensions: '120cm x 40cm x 180cm',
    specifications: {
      weight: '35kg',
      material: 'Hierro y nogal',
      capacity: '80kg por repisa'
    },
    status: ProductStatus.APPROVED,
    sellerId: 'seller_003',
    viewCount: 2156,
    downloadCount: 3421,
    favoriteCount: 678,
    featured: true,
    rating: 4.9,
    reviewCount: 156,
    moderatedBy: 'admin_002',
    moderatedAt: '2024-11-06T07:30:00Z',
    createdAt: '2024-11-05T09:15:00Z',
    publishedAt: '2024-11-06T08:00:00Z',
    updatedAt: '2024-11-10T11:20:00Z',
    seller: {
      id: 'seller_003',
      email: 'miguel@industrialcraft.com',
      firstName: 'Miguel',
      lastName: 'Torres',
      role: UserRole.SELLER,
      isBoth: false,
      emailVerified: true,
      isActive: true,
      status: UserStatus.ACTIVE,
      stripeConnectId: 'acct_seller_003_industrial',
      onboardingComplete: true,
      payoutsEnabled: true,
      chargesEnabled: true,
      createdAt: '2024-08-20T10:00:00Z',
      updatedAt: '2024-11-05T09:15:00Z',
      lastLoginAt: '2024-11-10T14:20:00Z',
      sellerProfile: {
        id: 'seller_profile_003',
        storeName: 'Industrial Craft',
        slug: 'industrial-craft',
        description: 'Especialistas en muebles de estilo industrial y diseño urbano.',
        website: 'https://industrialcraft.com',
        phone: '+56 9 6543 2109',
        avatar: 'https://picsum.photos/60/60?random=12',
        rating: 4.8,
        totalSales: 203,
        totalReviews: 156,
        isVerified: true,
        createdAt: '2024-08-20T10:00:00Z',
        updatedAt: '2024-11-05T09:15:00Z'
      }
    }
  },
  {
    id: 'clx4d5e6f7g8h9i0j1k2l3m4',
    title: 'Cama Matrimonial Flotante con Almacenamiento',
    description: 'Diseño innovador de cama flotante con almacenamiento oculto integrado. Maximiza el espacio del dormitorio con un estilo contemporáneo y minimalista.',
    slug: 'cama-matrimonial-flotante-almacenamiento',
    price: 35.00,
    category: ProductCategory.BEDS,
    difficulty: Difficulty.ADVANCED,
    pdfUrl: '/downloads/cama-flotante.pdf',
    pdfFileId: 'file_pdf_004',
    previewImages: [
      'https://picsum.photos/400/300?random=7'
    ],
    thumbnails: [
      'https://picsum.photos/200/150?random=7'
    ],
    tags: ['cama', 'flotante', 'almacenamiento', 'matrimonial', 'moderno'],
    estimatedTime: '20-24 horas',
    toolsRequired: ['Router', 'Sierra circular', 'Taladro', 'Prensas', 'Lijadora orbital'],
    materials: ['MDF', 'Rieles telescópicos', 'Bisagras', 'Tornillos', 'Laca'],
    dimensions: '160cm x 200cm x 35cm',
    specifications: {
      weight: '65kg',
      material: 'MDF 18mm',
      storage: '200 litros'
    },
    status: ProductStatus.APPROVED,
    sellerId: 'seller_004',
    viewCount: 756,
    downloadCount: 1245,
    favoriteCount: 189,
    featured: false,
    rating: 4.7,
    reviewCount: 67,
    moderatedBy: 'admin_001',
    moderatedAt: '2024-10-26T11:45:00Z',
    createdAt: '2024-10-25T15:20:00Z',
    publishedAt: '2024-10-26T12:15:00Z',
    updatedAt: '2024-10-28T13:40:00Z',
    seller: {
      id: 'seller_004',
      email: 'laura@dreamfurniture.com',
      firstName: 'Laura',
      lastName: 'Ruiz',
      role: UserRole.SELLER,
      isBoth: false,
      emailVerified: true,
      isActive: true,
      status: UserStatus.ACTIVE,
      stripeConnectId: 'acct_seller_004_dream',
      onboardingComplete: false, // ← Este seller aún no completó onboarding
      payoutsEnabled: false,
      chargesEnabled: false,
      createdAt: '2024-08-10T14:00:00Z',
      updatedAt: '2024-10-25T15:20:00Z',
      lastLoginAt: '2024-10-28T10:15:00Z',
      sellerProfile: {
        id: 'seller_profile_004',
        storeName: 'Dream Furniture',
        slug: 'dream-furniture',
        description: 'Diseños innovadores para dormitorios modernos.',
        website: '',
        phone: '+56 9 5432 1098',
        avatar: 'https://picsum.photos/60/60?random=13',
        banner: '',
        rating: 4.6,
        totalSales: 45,
        totalReviews: 67,
        isVerified: false,
        createdAt: '2024-08-10T14:00:00Z',
        updatedAt: '2024-10-25T15:20:00Z'
      }
    }
  },
  {
    id: 'clx5e6f7g8h9i0j1k2l3m4n5',
    title: 'Escritorio Ejecutivo con Cable Management',
    description: 'Escritorio profesional con múltiples compartimentos y sistema integrado de gestión de cables. Ideal para oficinas modernas y trabajo desde casa.',
    slug: 'escritorio-ejecutivo-cable-management',
    price: 28.99,
    category: ProductCategory.OFFICE,
    difficulty: Difficulty.ADVANCED,
    pdfUrl: '/downloads/escritorio-ejecutivo.pdf',
    pdfFileId: 'file_pdf_005',
    previewImages: [
      'https://picsum.photos/400/300?random=8',
      'https://picsum.photos/400/300?random=9'
    ],
    thumbnails: [
      'https://picsum.photos/200/150?random=8',
      'https://picsum.photos/200/150?random=9'
    ],
    tags: ['escritorio', 'oficina', 'profesional', 'cables', 'ejecutivo'],
    estimatedTime: '14-18 horas',
    toolsRequired: ['Fresadora', 'Sierra de mesa', 'Taladro', 'Broca copa'],
    materials: ['Melamina', 'Cantos de PVC', 'Rieles', 'Manijas', 'Tornillos'],
    dimensions: '140cm x 70cm x 75cm',
    specifications: {
      weight: '42kg',
      material: 'Melamina 18mm',
      features: 'Cable management integrado'
    },
    status: ProductStatus.APPROVED,
    sellerId: 'seller_005',
    viewCount: 945,
    downloadCount: 1567,
    favoriteCount: 312,
    featured: true,
    rating: 4.8,
    reviewCount: 91,
    moderatedBy: 'admin_002',
    moderatedAt: '2024-11-21T09:15:00Z',
    createdAt: '2024-11-20T14:45:00Z',
    publishedAt: '2024-11-21T09:30:00Z',
    updatedAt: '2024-11-22T10:30:00Z',
    seller: {
      id: 'seller_005',
      email: 'patricia@officepro.com',
      firstName: 'Patricia',
      lastName: 'Vega',
      role: UserRole.SELLER,
      isBoth: false,
      emailVerified: true,
      isActive: true,
      status: UserStatus.ACTIVE,
      stripeConnectId: 'acct_seller_005_office',
      onboardingComplete: true,
      payoutsEnabled: true,
      chargesEnabled: true,
      createdAt: '2024-09-01T08:30:00Z',
      updatedAt: '2024-11-20T14:45:00Z',
      lastLoginAt: '2024-11-22T08:45:00Z',
      sellerProfile: {
        id: 'seller_profile_005',
        storeName: 'Office Pro Designs',
        slug: 'office-pro-designs',
        description: 'Soluciones profesionales para oficinas modernas.',
        website: 'https://officepro.com',
        phone: '+56 9 4321 0987',
        avatar: 'https://picsum.photos/60/60?random=15',
        banner: '',
        rating: 4.9,
        totalSales: 127,
        totalReviews: 91,
        isVerified: true,
        createdAt: '2024-09-01T08:30:00Z',
        updatedAt: '2024-11-20T14:45:00Z'
      }
    }
  }
]

// Productos para homepage (featured)
export const featuredProducts = mockProducts.filter(product => product.featured).slice(0, 3)

// Función para obtener productos por categoría
export const getProductsByCategory = (category: ProductCategory): Product[] => {
  return mockProducts.filter(product => product.category === category)
}

// Función para buscar productos
export const searchProducts = (query: string): Product[] => {
  const lowercaseQuery = query.toLowerCase()
  return mockProducts.filter(product => 
    product.title.toLowerCase().includes(lowercaseQuery) ||
    product.description.toLowerCase().includes(lowercaseQuery) ||
    product.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
    product.seller.sellerProfile?.storeName.toLowerCase().includes(lowercaseQuery)
  )
}

// Función para obtener producto por ID
export const getProductById = (id: string): Product | undefined => {
  return mockProducts.find(product => product.id === id)
}

// Función para obtener producto por slug
export const getProductBySlug = (slug: string): Product | undefined => {
  return mockProducts.find(product => product.slug === slug)
}