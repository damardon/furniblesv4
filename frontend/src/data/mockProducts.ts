import { Product, ProductCategory, Difficulty, ProductStatus, UserRole, UserStatus } from '@/types'

// ✅ DATOS COHERENTES con nuevas categorías por sectores de casa
export const mockProducts: Product[] = [
  // SELLER 1: Carlos Mendoza (Maderas Mendoza) - Especialista en muebles de madera maciza
  {
    id: 'clx1a2b3c4d5e6f7g8h9i0j1',
    title: 'Mesa de Comedor Moderna Roble',
    description: 'Elegante mesa de comedor con diseño minimalista para 6 personas. Construcción en madera de roble macizo con acabado natural.',
    slug: 'mesa-comedor-moderna-roble',
    price: 15.99,
    category: ProductCategory.LIVING_DINING,
    difficulty: Difficulty.INTERMEDIATE,
    status: ProductStatus.APPROVED,
    // ✅ CORREGIDO: Campos de archivos como JSON strings
    pdfFileId: 'file_pdf_001',
    imageFileIds: JSON.stringify(['img_001', 'img_002']),
    thumbnailFileIds: JSON.stringify(['thumb_001', 'thumb_002']),
    // ✅ CORREGIDO: Arrays como JSON strings
    tags: JSON.stringify(['moderna', 'comedor', 'roble', 'minimalista', '6-personas']),
    estimatedTime: '8-12 horas',
    toolsRequired: JSON.stringify(['Sierra circular', 'Taladro', 'Lijadora', 'Prensas']),
    materials: JSON.stringify(['Madera de roble', 'Tornillos', 'Cola de madera', 'Barniz']),
    dimensions: '180cm x 90cm x 75cm',
    specifications: {
      weight: '45kg',
      material: 'Roble macizo',
      finish: 'Natural'
    },
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
    // ✅ FIXED: seller es un User completo, no necesita userId
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
      stripeConnectId: 'acct_1234567890',
      onboardingComplete: true,
      payoutsEnabled: true,
      chargesEnabled: true,
      createdAt: '2024-10-01T08:00:00Z',
      updatedAt: '2024-11-01T10:00:00Z',
      sellerProfile: {
        id: 'seller_profile_001',
        userId: 'seller_001',
        storeName: 'Maderas Mendoza',
        slug: 'maderas-mendoza',
        description: 'Especialistas en muebles de madera maciza con más de 15 años de experiencia.',
        website: 'https://maderasmendoza.com',
        phone: '+56 9 8765 4321',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&h=150&fit=crop&crop=face',
        rating: 4.9,
        totalSales: 2,
        totalReviews: 124,
        isVerified: true,
        createdAt: '2024-10-01T08:00:00Z',
        updatedAt: '2024-11-01T10:00:00Z'
      }
    }
  },
  {
    id: 'clx1a2b3c4d5e6f7g8h9i0j2',
    title: 'Mesa Centro Roble Rustico',
    description: 'Mesa de centro con acabado rústico, perfecta para salas de estar modernas. Construcción sólida en roble macizo.',
    slug: 'mesa-centro-roble-rustico',
    price: 12.99,
    category: ProductCategory.LIVING_DINING,
    difficulty: Difficulty.BEGINNER,
    status: ProductStatus.APPROVED,
    pdfFileId: 'file_pdf_006',
    imageFileIds: JSON.stringify(['img_006']),
    thumbnailFileIds: JSON.stringify(['thumb_006']),
    tags: JSON.stringify(['rustica', 'centro', 'roble', 'sala', 'maciza']),
    estimatedTime: '6-8 horas',
    toolsRequired: JSON.stringify(['Sierra circular', 'Lijadora', 'Prensas']),
    materials: JSON.stringify(['Madera de roble', 'Tornillos', 'Barniz natural']),
    dimensions: '100cm x 60cm x 45cm',
    specifications: {
      weight: '25kg',
      material: 'Roble macizo',
      finish: 'Rústico natural'
    },
    sellerId: 'seller_001',
    viewCount: 892,
    downloadCount: 1432,
    favoriteCount: 234,
    featured: false,
    rating: 4.7,
    reviewCount: 67,
    moderatedBy: 'admin_001',
    moderatedAt: '2024-11-10T14:20:00Z',
    createdAt: '2024-11-09T10:15:00Z',
    publishedAt: '2024-11-10T15:00:00Z',
    updatedAt: '2024-11-12T09:30:00Z',
    // ✅ FIXED: seller es un User completo
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
      stripeConnectId: 'acct_1234567890',
      onboardingComplete: true,
      payoutsEnabled: true,
      chargesEnabled: true,
      createdAt: '2024-10-01T08:00:00Z',
      updatedAt: '2024-11-01T10:00:00Z',
      sellerProfile: {
        id: 'seller_profile_001',
        userId: 'seller_001',
        storeName: 'Maderas Mendoza',
        slug: 'maderas-mendoza',
        description: 'Especialistas en muebles de madera maciza con más de 15 años de experiencia.',
        website: 'https://maderasmendoza.com',
        phone: '+56 9 8765 4321',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&h=150&fit=crop&crop=face',
        rating: 4.9,
        totalSales: 2,
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
    description: 'Cómoda silla con respaldo ergonómico y acabado en madera natural. Diseño inspirado en el estilo nórdico con líneas limpias.',
    slug: 'silla-escandinava-premium',
    price: 12.50,
    category: ProductCategory.NORDIC,
    difficulty: Difficulty.BEGINNER,
    status: ProductStatus.APPROVED,
    pdfFileId: 'file_pdf_002',
    imageFileIds: JSON.stringify(['img_002a', 'img_002b']),
    thumbnailFileIds: JSON.stringify(['thumb_002a', 'thumb_002b']),
    tags: JSON.stringify(['escandinava', 'ergonomica', 'pino', 'nordico', 'comoda']),
    estimatedTime: '4-6 hours',
    toolsRequired: JSON.stringify(['Sierra de calar', 'Taladro', 'Lijadora']),
    materials: JSON.stringify(['Madera de pino', 'Tornillos', 'Barniz mate']),
    dimensions: '45cm x 45cm x 80cm',
    specifications: {
      weight: '6kg',
      material: 'Pino nórdico',
      finish: 'Barniz mate'
    },
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
    // ✅ FIXED: seller es un User completo
    seller: {
      id: 'seller_002',
      email: 'nordic@designco.com',
      firstName: 'Astrid',
      lastName: 'Nielsen',
      role: UserRole.SELLER,
      isBoth: false,
      emailVerified: true,
      isActive: true,
      status: UserStatus.ACTIVE,
      stripeConnectId: 'acct_2345678901',
      onboardingComplete: true,
      payoutsEnabled: true,
      chargesEnabled: true,
      createdAt: '2024-09-15T12:00:00Z',
      updatedAt: '2024-11-18T16:45:00Z',
      sellerProfile: {
        id: 'seller_profile_002',
        userId: 'seller_002',
        storeName: 'Nordic Design Co.',
        slug: 'nordic-design-co',
        description: 'Diseños escandinavos auténticos para el hogar moderno.',
        website: 'https://nordicdesign.com',
        phone: '+56 9 7654 3210',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5bb?q=80&w=150&h=150&fit=crop&crop=face',
        rating: 4.7,
        totalSales: 1,
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
    description: 'Estantería de estilo industrial con estructura metálica y repisas de madera maciza. Perfecta para espacios modernos.',
    slug: 'estanteria-industrial-hierro-madera',
    price: 22.00,
    category: ProductCategory.STORAGE,
    difficulty: Difficulty.ADVANCED,
    status: ProductStatus.APPROVED,
    pdfFileId: 'file_pdf_003',
    imageFileIds: JSON.stringify(['img_003a', 'img_003b']),
    thumbnailFileIds: JSON.stringify(['thumb_003a', 'thumb_003b']),
    tags: JSON.stringify(['industrial', 'metal', 'organizacion', 'urbano', 'moderno']),
    estimatedTime: '12-16 horas',
    toolsRequired: JSON.stringify(['Soldadora', 'Amoladora', 'Taladro', 'Sierra']),
    materials: JSON.stringify(['Perfil de hierro', 'Madera de nogal', 'Soldadura', 'Pintura anticorrosiva']),
    dimensions: '120cm x 40cm x 180cm',
    specifications: {
      weight: '35kg',
      material: 'Hierro y nogal',
      capacity: '80kg por repisa'
    },
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
    // ✅ FIXED: seller es un User completo
    seller: {
      id: 'seller_003',
      email: 'industrial@craft.com',
      firstName: 'Miguel',
      lastName: 'Torres',
      role: UserRole.SELLER,
      isBoth: false,
      emailVerified: true,
      isActive: true,
      status: UserStatus.ACTIVE,
      stripeConnectId: 'acct_3456789012',
      onboardingComplete: true,
      payoutsEnabled: true,
      chargesEnabled: true,
      createdAt: '2024-08-20T10:00:00Z',
      updatedAt: '2024-11-05T09:15:00Z',
      sellerProfile: {
        id: 'seller_profile_003',
        userId: 'seller_003',
        storeName: 'Industrial Craft',
        slug: 'industrial-craft',
        description: 'Especialistas en muebles de estilo industrial y diseño urbano.',
        website: 'https://industrialcraft.com',
        phone: '+56 9 6543 2109',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&h=150&fit=crop&crop=face',
        rating: 4.8,
        totalSales: 2,
        totalReviews: 156,
        isVerified: true,
        createdAt: '2024-08-20T10:00:00Z',
        updatedAt: '2024-11-05T09:15:00Z'
      }
    }
  },
  {
    id: 'clx5e6f7g8h9i0j1k2l3m4n5',
    title: 'Escritorio Ejecutivo con Cable Management',
    description: 'Escritorio profesional con múltiples compartimentos y sistema integrado de gestión de cables. Estilo industrial moderno.',
    slug: 'escritorio-ejecutivo-cable-management',
    price: 28.99,
    category: ProductCategory.OFFICE,
    difficulty: Difficulty.ADVANCED,
    status: ProductStatus.APPROVED,
    pdfFileId: 'file_pdf_005',
    imageFileIds: JSON.stringify(['img_005a', 'img_005b']),
    thumbnailFileIds: JSON.stringify(['thumb_005a', 'thumb_005b']),
    tags: JSON.stringify(['escritorio', 'oficina', 'profesional', 'cables', 'industrial']),
    estimatedTime: '14-18 horas',
    toolsRequired: JSON.stringify(['Fresadora', 'Sierra de mesa', 'Soldadora', 'Broca copa']),
    materials: JSON.stringify(['Perfil metálico', 'Melamina', 'Cantos de PVC', 'Rieles', 'Tornillos']),
    dimensions: '140cm x 70cm x 75cm',
    specifications: {
      weight: '42kg',
      material: 'Metal y melamina',
      features: 'Cable management integrado'
    },
    sellerId: 'seller_003',
    viewCount: 945,
    downloadCount: 1567,
    favoriteCount: 312,
    featured: true,
    rating: 4.8,
    reviewCount: 91,
    moderatedBy: 'admin_002',
    moderatedAt: '2024-10-15T09:30:00Z',
    createdAt: '2024-10-14T11:20:00Z',
    publishedAt: '2024-10-15T10:00:00Z',
    updatedAt: '2024-10-16T14:45:00Z',
    // ✅ FIXED: seller es un User completo
    seller: {
      id: 'seller_003',
      email: 'industrial@craft.com',
      firstName: 'Miguel',
      lastName: 'Torres',
      role: UserRole.SELLER,
      isBoth: false,
      emailVerified: true,
      isActive: true,
      status: UserStatus.ACTIVE,
      stripeConnectId: 'acct_3456789012',
      onboardingComplete: true,
      payoutsEnabled: true,
      chargesEnabled: true,
      createdAt: '2024-08-20T10:00:00Z',
      updatedAt: '2024-11-05T09:15:00Z',
      sellerProfile: {
        id: 'seller_profile_003',
        userId: 'seller_003',
        storeName: 'Industrial Craft',
        slug: 'industrial-craft',
        description: 'Especialistas en muebles de estilo industrial y diseño urbano.',
        website: 'https://industrialcraft.com',
        phone: '+56 9 6543 2109',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&h=150&fit=crop&crop=face',
        rating: 4.8,
        totalSales: 2,
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
    description: 'Diseño innovador de cama flotante con almacenamiento oculto integrado. Maximiza el espacio del dormitorio.',
    slug: 'cama-matrimonial-flotante-almacenamiento',
    price: 35.00,
    category: ProductCategory.BEDS,
    difficulty: Difficulty.ADVANCED,
    status: ProductStatus.APPROVED,
    pdfFileId: 'file_pdf_004',
    imageFileIds: JSON.stringify(['img_004']),
    thumbnailFileIds: JSON.stringify(['thumb_004']),
    tags: JSON.stringify(['cama', 'flotante', 'almacenamiento', 'matrimonial', 'moderno']),
    estimatedTime: '20-24 horas',
    toolsRequired: JSON.stringify(['Router', 'Sierra circular', 'Taladro', 'Prensas', 'Lijadora orbital']),
    materials: JSON.stringify(['MDF', 'Rieles telescópicos', 'Bisagras', 'Tornillos', 'Laca']),
    dimensions: '160cm x 200cm x 35cm',
    specifications: {
      weight: '65kg',
      material: 'MDF 18mm',
      storage: '200 litros'
    },
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
    // ✅ FIXED: seller es un User completo
    seller: {
      id: 'seller_004',
      email: 'dream@furniture.com',
      firstName: 'María',
      lastName: 'González',
      role: UserRole.SELLER,
      isBoth: false,
      emailVerified: true,
      isActive: true,
      status: UserStatus.ACTIVE,
      stripeConnectId: 'acct_4567890123',
      onboardingComplete: false,
      payoutsEnabled: false,
      chargesEnabled: true,
      createdAt: '2024-08-10T14:00:00Z',
      updatedAt: '2024-10-25T15:20:00Z',
      sellerProfile: {
        id: 'seller_profile_004',
        userId: 'seller_004',
        storeName: 'Dream Furniture',
        slug: 'dream-furniture',
        description: 'Diseños innovadores para dormitorios modernos.',
        website: '',
        phone: '+56 9 5432 1098',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&h=150&fit=crop&crop=face',
        rating: 4.6,
        totalSales: 1,
        totalReviews: 67,
        isVerified: false,
        createdAt: '2024-08-10T14:00:00Z',
        updatedAt: '2024-10-25T15:20:00Z'
      }
    }
  }
]

// ✅ EXPORTAR PRODUCTOS DESTACADOS
export const featuredProducts = mockProducts.filter(product => product.featured)

// ✅ FUNCIONES AUXILIARES CON NUEVAS CATEGORÍAS
export const getProductsByCategory = (category: ProductCategory) => 
  mockProducts.filter(product => product.category === category)

export const getProductsBySeller = (sellerId: string) =>
  mockProducts.filter(product => product.sellerId === sellerId)

export const getSellerById = (sellerId: string) => {
  const product = mockProducts.find(p => p.sellerId === sellerId)
  return product?.seller
}

export const getProductBySlug = (slug: string) => 
  mockProducts.find(product => product.slug === slug)

export const getProductById = (id: string) => 
  mockProducts.find(product => product.id === id)

// ✅ NUEVO: Resumen de categorías actualizadas
export const categorySummary = {
  'LIVING_DINING': {
    name: 'Living & Comedor',
    count: mockProducts.filter(p => p.category === ProductCategory.LIVING_DINING).length,
    products: mockProducts.filter(p => p.category === ProductCategory.LIVING_DINING).map(p => p.title)
  },
  'NORDIC': {
    name: 'Nórdicos',
    count: mockProducts.filter(p => p.category === ProductCategory.NORDIC).length,
    products: mockProducts.filter(p => p.category === ProductCategory.NORDIC).map(p => p.title)
  },
  'STORAGE': {
    name: 'Almacenamiento',
    count: mockProducts.filter(p => p.category === ProductCategory.STORAGE).length,
    products: mockProducts.filter(p => p.category === ProductCategory.STORAGE).map(p => p.title)
  },
  'OFFICE': {
    name: 'Oficina',
    count: mockProducts.filter(p => p.category === ProductCategory.OFFICE).length,
    products: mockProducts.filter(p => p.category === ProductCategory.OFFICE).map(p => p.title)
  },
  'BEDS': {
    name: 'Camas',
    count: mockProducts.filter(p => p.category === ProductCategory.BEDS).length,
    products: mockProducts.filter(p => p.category === ProductCategory.BEDS).map(p => p.title)
  }
}