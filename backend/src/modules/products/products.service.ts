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
            email: true,
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
    } = filters;

    // Construir where clause
    const where: Prisma.ProductWhereInput = {
      status: status || ProductStatus.APPROVED,
      publishedAt: { not: null },
    };

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
    const orderBy = this.buildOrderBy(sortBy);

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
              avatar: true,
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
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
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
            email: true,
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
  private buildOrderBy(sortBy: string): Prisma.ProductOrderByWithRelationInput[] {
    switch (sortBy) {
      case 'oldest':
        return [{ createdAt: 'asc' }];
      case 'popular':
        return [{ viewCount: 'desc' }, { createdAt: 'desc' }];
      case 'rating':
        return [{ rating: 'desc' }, { reviewCount: 'desc' }];
      case 'price_asc':
        return [{ price: 'asc' }, { createdAt: 'desc' }];
      case 'price_desc':
        return [{ price: 'desc' }, { createdAt: 'desc' }];
      case 'newest':
      default:
        return [{ createdAt: 'desc' }];
    }
  }
}