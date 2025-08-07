// src/modules/products/products.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateProductWithFilesDto } from './dto/create-product-with-files.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductFiltersDto } from './dto/product-filters.dto';
import { PaginatedProductsDto } from './dto/paginated-products.dto';
import { ProductStatus, UserRole, Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    // I18nService removido temporalmente
  ) {}

  /**
   * Convierte arrays a JSON strings para SQLite
   */
  private prepareArrayFields(data: any) {
    return {
      imageFileIds: data.imageFileIds ? JSON.stringify(data.imageFileIds) : "[]",
      thumbnailFileIds: data.thumbnailFileIds ? JSON.stringify(data.thumbnailFileIds) : "[]",
      tags: data.tags ? JSON.stringify(data.tags) : "[]",
      toolsRequired: data.toolsRequired ? JSON.stringify(data.toolsRequired) : "[]",
      materials: data.materials ? JSON.stringify(data.materials) : "[]",
    };
  }

  

  // Crear producto
    async create(sellerId: string, createProductDto: CreateProductDto) {
      // Verificar límite de productos por seller (50)
      const sellerProductCount = await this.prisma.product.count({
        where: { sellerId, status: { not: 'REJECTED' } },
      });

      if (sellerProductCount >= 50) {
        throw new BadRequestException('Maximum products limit reached (50)');
      }

      // Generar slug único
      const slug = await this.generateUniqueSlug(createProductDto.title);

      // Crear producto con datos seguros para SQLite
      const product = await this.prisma.product.create({
        data: {
          title: createProductDto.title,
          description: createProductDto.description,
          slug,
          price: createProductDto.price,
          category: createProductDto.category,
          difficulty: createProductDto.difficulty,
          status: ProductStatus.DRAFT,
          sellerId,
          // Campos opcionales del DTO
          estimatedTime: createProductDto.estimatedTime || null,
          dimensions: createProductDto.dimensions || null,
          specifications: createProductDto.specifications || null,
          ...this.prepareArrayFields(createProductDto),
        },
        include: {
          seller: {
            select: {
              id: true,
              avatar: true,
              createdAt: true,
            },
          },
        },
      });

      return product;
    }

  // Listar productos públicos (solo APPROVED)
  async findAll(filters: ProductFiltersDto): Promise<PaginatedProductsDto> {
    const {
      q,
      category,
      difficulty,
      priceMin,
      priceMax,
      tags,
      sortBy,
      page = 1,
      limit = 12,
      status,
      featured,
    } = filters;

    // Construir where clause
    const where: Prisma.ProductWhereInput = {
      status: status || ProductStatus.APPROVED,
      publishedAt: { not: null },
    };

    // ✅ AGREGAR filtro de featured
    if (featured === true) {
      where.featured = true;
    }

    // Filtros de búsqueda (corregido para SQLite)
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { tags: { contains: q } }, // Búsqueda simple en JSON string
      ];
    }

    if (category) where.category = category;
    if (difficulty) where.difficulty = difficulty;
    
    if (priceMin !== undefined || priceMax !== undefined) {
      where.price = {};
      if (priceMin !== undefined) where.price.gte = priceMin;
      if (priceMax !== undefined) where.price.lte = priceMax;
    }

    if (tags && tags.length > 0) {
      where.tags = { contains: tags.join('|') };
    }

    // Ordenamiento
    const orderBy = this.buildOrderBy(filters.sortBy, filters.sortOrder);

    // Paginación
    const skip = (page - 1) * limit;

    // Ejecutar consultas
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              sellerProfile: {  // <- Ahora accedemos al SellerProfile
                select: {
                  id: true,
                  storeName: true,
                  slug: true,
                  description: true,
                  avatar: true,
                  createdAt: true,
                },
              },
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: products,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }
  
  // Obtener producto por ID
  async findOne(id: string, userId?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
          id: true,
          avatar: true,
          createdAt: true,
          firstName: true,
          lastName: true,
          email: true,
          sellerProfile: {
            select: {
              id: true,
              storeName: true,
              slug: true,
              description: true,
              avatar: true,
              isVerified: true,
              createdAt: true,
            },
          },
        },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Solo mostrar productos aprobados a usuarios no propietarios
    if (
      product.status !== ProductStatus.APPROVED &&
      product.sellerId !== userId
    ) {
      throw new NotFoundException('Product not found');
    }

    // Incrementar contador de vistas (solo si no es el propietario)
    if (userId !== product.sellerId) {
      await this.prisma.product.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });
      product.viewCount += 1;
    }

    return product;
  }

  // Obtener productos del usuario (seller)
  async findMyProducts(
    sellerId: string,
    filters: ProductFiltersDto,
  ): Promise<PaginatedProductsDto> {
    const { page = 1, limit = 12, status } = filters;

    const where: Prisma.ProductWhereInput = {
      sellerId,
    };

    if (status) where.status = status;

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              sellerProfile: {
                select: {
                  id: true,
                  storeName: true,
                  slug: true,
                  description: true,
                  avatar: true,
                },
              },
            },
          },
        },
        orderBy: this.buildOrderBy(filters.sortBy, filters.sortOrder),
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: products,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  // Obtener producto por slug
  async findBySlug(slug: string, userId?: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug: slug },
      include: {
        seller: {
          select: {
            id: true,
            avatar: true,
            createdAt: true,
            firstName: true,
            lastName: true,
            email: true,
            sellerProfile: {
              select: {
                id: true,
                storeName: true,
                slug: true,
                description: true,
                avatar: true,
                isVerified: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Solo mostrar productos aprobados a usuarios no propietarios
    if (
      product.status !== ProductStatus.APPROVED &&
      product.sellerId !== userId
    ) {
      throw new NotFoundException('Product not found');
    }

    // Incrementar contador de vistas (solo si no es el propietario)
    if (userId !== product.sellerId) {
      await this.prisma.product.update({
        where: { id: product.id },
        data: { viewCount: { increment: 1 } },
      });
      product.viewCount += 1;
    }

    return product;
  }

  // Actualizar producto
  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    userId: string,
    userRole: UserRole,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Solo el propietario o admin pueden editar
    if (product.sellerId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You are not the owner of this product');
    }

    // Si se cambia el título, regenerar slug
    let slug = product.slug;
    if (updateProductDto.title && updateProductDto.title !== product.title) {
      slug = await this.generateUniqueSlug(updateProductDto.title, id);
    }

    // Si el producto estaba aprobado y se modifica contenido crítico,
    // volver a estado PENDING
    let status = product.status;
    const criticalFields = ['title', 'description', 'category', 'price'];
    const hasCriticalChanges = criticalFields.some(
      field => updateProductDto[field] !== undefined,
    );

    if (
      product.status === ProductStatus.APPROVED &&
      hasCriticalChanges &&
      userRole !== UserRole.ADMIN
    ) {
      status = ProductStatus.PENDING;
    }

    // Actualización con datos seguros para SQLite
    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        // Solo actualizar campos que están en el DTO
        ...(updateProductDto.title && { title: updateProductDto.title }),
        ...(updateProductDto.description && { description: updateProductDto.description }),
        ...(updateProductDto.price !== undefined && { price: updateProductDto.price }),
        ...(updateProductDto.category && { category: updateProductDto.category }),
        ...(updateProductDto.difficulty && { difficulty: updateProductDto.difficulty }),
        ...(updateProductDto.estimatedTime !== undefined && { estimatedTime: updateProductDto.estimatedTime }),
        ...(updateProductDto.dimensions !== undefined && { dimensions: updateProductDto.dimensions }),
        ...(updateProductDto.specifications !== undefined && { specifications: updateProductDto.specifications }),
        slug,
        status,
        ...this.prepareArrayFields(updateProductDto),
      },
      include: {
        seller: {
          select: {
            id: true,
            avatar: true,
          },
        },
      },
    });

    return updatedProduct;
  }

  // Eliminar producto
  async remove(id: string, userId: string, userRole: UserRole) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        orderItems: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Solo el propietario o admin pueden eliminar
    if (product.sellerId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You are not the owner of this product');
    }

    // No permitir eliminación si hay órdenes asociadas
    if (product.orderItems.length > 0) {
      throw new ConflictException('Cannot delete product with associated orders');
    }

    await this.prisma.product.delete({
      where: { id },
    });

    return { message: 'Product deleted successfully' };
  }

  // Aprobar producto (solo admin)
  async approve(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.status !== ProductStatus.PENDING) {
      throw new BadRequestException('Product cannot be approved');
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        status: ProductStatus.APPROVED,
        publishedAt: new Date(),
      },
      include: {
        seller: {
          select: {
            id: true,
          },
        },
      },
    });
   
    return updatedProduct;
  }

  // Rechazar producto (solo admin)
  async reject(id: string, reason?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.status !== ProductStatus.PENDING) {
      throw new BadRequestException('Product cannot be rejected');
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        status: ProductStatus.REJECTED,
        // Guardar razón en specifications si se proporciona
        specifications: reason
          ? {
             ...(product.specifications as Record<string, any> || {}),
          rejectionReason: reason
            }
        : product.specifications,
      },
      include: {
        seller: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  
    return updatedProduct;
  }

    // Obtener estadísticas del producto
  async getProductStats(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return {
      viewCount: product.viewCount,
      downloadCount: product.downloadCount,
      favoriteCount: product.favoriteCount,
      rating: product.rating,
      reviewCount: product.reviewCount,
    };
  }

  // Publicar producto (cambiar de DRAFT a PENDING)
  async publish(id: string, userId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.sellerId !== userId) {
      throw new ForbiddenException('You are not the owner of this product');
    }

    if (product.status !== ProductStatus.DRAFT) {
      throw new BadRequestException('Product cannot be published');
    }

    // Validar que tenga archivos necesarios (corregido para SQLite)
    const imageFileIds = JSON.parse(product.imageFileIds || "[]");
    if (!imageFileIds || imageFileIds.length === 0) {
      throw new BadRequestException('Product must have at least one image');
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        status: ProductStatus.PENDING,
      },
    });

    return updatedProduct;
  }

  // Generar slug único
  private async generateUniqueSlug(
    title: string,
    excludeId?: string,
  ): Promise<string> {
    let baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Limitar longitud
    if (baseSlug.length > 100) {
      baseSlug = baseSlug.substring(0, 100);
    }

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.product.findFirst({
        where: { slug },
      });

      if (!existing || existing.id === excludeId) {
        break;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  // Construir orderBy según el tipo de ordenamiento
  private buildOrderBy(sortBy?: string, sortOrder?: string): Prisma.ProductOrderByWithRelationInput {
  const order = (sortOrder === 'asc') ? 'asc' as const : 'desc' as const;
  
  switch (sortBy) {
    // ✅ Campos que SÍ existen en el modelo Product
    case 'createdAt':
      return { createdAt: order };
    case 'updatedAt':
      return { updatedAt: order };
    case 'price':
      return { price: order };
    case 'rating':
      return { rating: order };
    case 'viewCount':
      return { viewCount: order };
    case 'downloadCount':  // ✅ CAMBIAR salesCount por downloadCount
      return { downloadCount: order };
    case 'favoriteCount':
      return { favoriteCount: order };
    case 'reviewCount':
      return { reviewCount: order };
    case 'title':
      return { title: order };
    
    // ✅ Mantener compatibilidad con valores anteriores
    case 'newest':
      return { createdAt: 'desc' };
    case 'oldest':
      return { createdAt: 'asc' };
    case 'popular':
      return { viewCount: 'desc' };
    case 'rating':
      return { rating: 'desc' };
    case 'price_asc':
      return { price: 'asc' };
    case 'price_desc':
      return { price: 'desc' };
    
    // ✅ Default
    default:
      return { createdAt: 'desc' };
  }
}
// backend/src/modules/products/products.service.ts
// ✅ AGREGAR AL FINAL DE TU CLASE, antes del último }

  /**
   * 🆕 CRÍTICO: Obtener estadísticas generales para homepage
   */
  async getGeneralStats() {
    try {
      const [totalProducts, totalSellers, totalDownloads, featuredProducts] = await Promise.all([
        this.prisma.product.count({
          where: { status: ProductStatus.APPROVED }
        }),
        this.prisma.user.count({
          where: { role: 'SELLER' }
        }),
        this.prisma.download.count(),
        this.prisma.product.count({
          where: { 
            status: ProductStatus.APPROVED,
            featured: true 
          }
        }),
      ]);

      return {
        totalProducts,
        totalSellers,
        totalDownloads,
        featuredProducts,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      // Si hay error con downloads (tabla puede no existir), devolver stats básicos
      const [totalProducts, totalSellers, featuredProducts] = await Promise.all([
        this.prisma.product.count({
          where: { status: ProductStatus.APPROVED }
        }),
        this.prisma.user.count({
          where: { role: 'SELLER' }
        }),
        this.prisma.product.count({
          where: { 
            status: ProductStatus.APPROVED,
            featured: true 
          }
        }),
      ]);

      return {
        totalProducts,
        totalSellers,
        totalDownloads: 0,
        featuredProducts,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 🆕 CRÍTICO: Obtener categorías con conteo para homepage
   */
  async getCategories() {
    try {
      const categories = await this.prisma.product.groupBy({
        by: ['category'],
        where: {
          status: ProductStatus.APPROVED
        },
        _count: {
          category: true
        },
        orderBy: {
          _count: {
            category: 'desc'
          }
        }
      });

      return categories.map(cat => ({
        category: cat.category,
        count: cat._count.category,
        displayName: this.getCategoryDisplayName(cat.category),
      }));
    } catch (error) {
      // Si hay error, devolver categorías por defecto
      return [
        { category: 'FURNITURE', count: 0, displayName: 'Muebles' },
        { category: 'DECORATION', count: 0, displayName: 'Decoración' },
        { category: 'STORAGE', count: 0, displayName: 'Almacenamiento' },
        { category: 'OUTDOOR', count: 0, displayName: 'Exterior' },
      ];
    }
  }

  /**
   * 🆕 Helper: Obtener nombre de categoría para mostrar
   */
  private getCategoryDisplayName(category: string): string {
    const categoryNames = {
      'FURNITURE': 'Muebles',
      'DECORATION': 'Decoración', 
      'STORAGE': 'Almacenamiento',
      'OUTDOOR': 'Exterior',
      'KITCHEN': 'Cocina',
      'BEDROOM': 'Dormitorio',
      'LIVING_ROOM': 'Sala de estar',
      'BATHROOM': 'Baño',
      'OFFICE': 'Oficina',
      'KIDS': 'Infantil',
    };

    return categoryNames[category] || category;
  }

  /**
   * 🆕 CRÍTICO: Buscar productos por múltiples criterios (para homepage)
   */
  async findProductsForHomepage() {
    try {
      const [featured, latest, popular, topRated] = await Promise.all([
        // Productos destacados (máximo 8)
        this.prisma.product.findMany({
          where: {
            status: ProductStatus.APPROVED,
            featured: true,
          },
          include: {
            seller: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                sellerProfile: {
                  select: {
                    storeName: true,
                    slug: true,
                    avatar: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 8,
        }),

        // Productos más recientes (máximo 12)
        this.prisma.product.findMany({
          where: {
            status: ProductStatus.APPROVED,
          },
          include: {
            seller: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                sellerProfile: {
                  select: {
                    storeName: true,
                    slug: true,
                    avatar: true,
                  },
                },
              },
            },
          },
          orderBy: { publishedAt: 'desc' },
          take: 12,
        }),

        // Productos populares (por vistas)
        this.prisma.product.findMany({
          where: {
            status: ProductStatus.APPROVED,
            viewCount: { gt: 0 },
          },
          include: {
            seller: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                sellerProfile: {
                  select: {
                    storeName: true,
                    slug: true,
                    avatar: true,
                  },
                },
              },
            },
          },
          orderBy: { viewCount: 'desc' },
          take: 8,
        }),

        // Productos mejor valorados
        this.prisma.product.findMany({
          where: {
            status: ProductStatus.APPROVED,
            rating: { gt: 4.0 },
          },
          include: {
            seller: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                sellerProfile: {
                  select: {
                    storeName: true,
                    slug: true,
                    avatar: true,
                  },
                },
              },
            },
          },
          orderBy: { rating: 'desc' },
          take: 8,
        }),
      ]);

      return {
        featured,
        latest,
        popular,
        topRated,
      };
    } catch (error) {
      // Si hay error, devolver arrays vacíos
      return {
        featured: [],
        latest: [],
        popular: [],
        topRated: [],
      };
    }
  }


}
