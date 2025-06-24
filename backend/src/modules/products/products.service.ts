// src/modules/products/products.service.ts
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
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private i18n: I18nService,
  ) {}

  // Crear producto
  async create(sellerId: string, createProductDto: CreateProductDto) {
    // Verificar límite de productos por seller (50)
    const sellerProductCount = await this.prisma.product.count({
      where: { sellerId, status: { not: 'REJECTED' } },
    });

    if (sellerProductCount >= 50) {
      throw new BadRequestException(
        this.i18n.t('products.errors.max_products_reached'),
      );
    }

    // Generar slug único
    const slug = await this.generateUniqueSlug(createProductDto.title);

    // Crear producto
    const product = await this.prisma.product.create({
      data: {
        ...createProductDto,
        slug,
        sellerId,
        status: ProductStatus.DRAFT,
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
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

    // Filtros de búsqueda
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { tags: { hasSome: q.split(' ') } },
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
      where.tags = { hasSome: tags };
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
              name: true,
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
            name: true,
            avatar: true,
            createdAt: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(this.i18n.t('products.errors.not_found'));
    }

    // Solo mostrar productos aprobados a usuarios no propietarios
    if (
      product.status !== ProductStatus.APPROVED &&
      product.sellerId !== userId
    ) {
      throw new NotFoundException(this.i18n.t('products.errors.not_found'));
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
              name: true,
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
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            avatar: true,
            createdAt: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(this.i18n.t('products.errors.not_found'));
    }

    // Solo mostrar productos aprobados a usuarios no propietarios
    if (
      product.status !== ProductStatus.APPROVED &&
      product.sellerId !== userId
    ) {
      throw new NotFoundException(this.i18n.t('products.errors.not_found'));
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
      throw new NotFoundException(this.i18n.t('products.errors.not_found'));
    }

    // Solo el propietario o admin pueden editar
    if (product.sellerId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(this.i18n.t('products.errors.not_owner'));
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

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        ...updateProductDto,
        slug,
        status,
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
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
      throw new NotFoundException(this.i18n.t('products.errors.not_found'));
    }

    // Solo el propietario o admin pueden eliminar
    if (product.sellerId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(this.i18n.t('products.errors.not_owner'));
    }

    // No permitir eliminación si hay órdenes asociadas
    if (product.orderItems.length > 0) {
      throw new ConflictException(
        this.i18n.t('products.errors.has_orders'),
      );
    }

    await this.prisma.product.delete({
      where: { id },
    });

    return { message: this.i18n.t('products.messages.deleted') };
  }

  // Aprobar producto (solo admin)
  async approve(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(this.i18n.t('products.errors.not_found'));
    }

    if (product.status !== ProductStatus.PENDING) {
      throw new BadRequestException(
        this.i18n.t('products.errors.cannot_approve'),
      );
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
            name: true,
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
      throw new NotFoundException(this.i18n.t('products.errors.not_found'));
    }

    if (product.status !== ProductStatus.PENDING) {
      throw new BadRequestException(
        this.i18n.t('products.errors.cannot_reject'),
      );
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
            name: true,
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
      throw new NotFoundException(this.i18n.t('products.errors.not_found'));
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
      throw new NotFoundException(this.i18n.t('products.errors.not_found'));
    }

    if (product.sellerId !== userId) {
      throw new ForbiddenException(this.i18n.t('products.errors.not_owner'));
    }

    if (product.status !== ProductStatus.DRAFT) {
      throw new BadRequestException(
        this.i18n.t('products.errors.cannot_publish'),
      );
    }

    // Validar que tenga archivos necesarios
    if (!product.imageFileIds || product.imageFileIds.length === 0) {
      throw new BadRequestException(
        this.i18n.t('products.errors.no_images'),
      );
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
      const existing = await this.prisma.product.findUnique({
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