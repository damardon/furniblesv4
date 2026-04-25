import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, ProductCategory, Difficulty } from '@prisma/client';

interface FindAllSellersQuery {
  page?: number;
  limit?: number;
  search?: string;
}

interface GetSellerProductsQuery {
  page?: number;
  limit?: number;
  category?: ProductCategory;
  difficulty?: Difficulty;
  priceMin?: number;
  priceMax?: number;
  sortBy?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'rating' | 'popular';
  search?: string;
}

@Injectable()
export class SellersService {
  constructor(private prisma: PrismaService) {}

  /**
   * ✅ Crear un nuevo vendedor
   */
  async create(createSellerDto: Prisma.SellerProfileCreateInput) {
    const seller = await this.prisma.sellerProfile.create({
      data: createSellerDto,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    return seller;
  }

  /**
   * ✅ Obtener todos los vendedores con paginación y estadísticas
   */
  async findAll(query: FindAllSellersQuery = {}) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    // Construir condiciones de búsqueda
    const whereConditions: Prisma.SellerProfileWhereInput = {
      ...(search && {
        OR: [
          { storeName: { contains: search } },
          { description: { contains: search } },
          {
            user: {
              OR: [
                { firstName: { contains: search } },
                { lastName: { contains: search } },
              ],
            },
          },
        ],
      }),
    };

    // Ejecutar consultas en paralelo con _count inline para evitar N+1
    const [sellers, total] = await Promise.all([
      this.prisma.sellerProfile.findMany({
        where: whereConditions,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              isActive: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.sellerProfile.count({
        where: whereConditions,
      }),
    ]);

    // Use denormalized fields + single product count query per page (not per seller)
    const sellerUserIds = sellers.map((s) => s.userId);
    const productCounts = await this.prisma.product.groupBy({
      by: ['sellerId'],
      where: { sellerId: { in: sellerUserIds }, status: 'APPROVED' },
      _count: { id: true },
    });
    const productCountMap = new Map(productCounts.map((p) => [p.sellerId, p._count.id]));

    const sellersWithStats = sellers.map((seller) => ({
      ...seller,
      stats: {
        totalProducts: productCountMap.get(seller.userId) ?? 0,
        avgRating: seller.rating,
        totalSales: seller.totalSales,
        totalReviews: seller.totalReviews,
      },
    }));

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      data: sellersWithStats,
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrev,
    };
  }

  /**
   * ✅ Buscar vendedor por ID
   */
  async findOne(id: string) {
    const seller = await this.prisma.sellerProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    if (!seller) {
      throw new NotFoundException(`Seller with ID "${id}" not found`);
    }

    return this.attachStats(seller);
  }

  /**
   * ✅ Buscar vendedor por slug
   */
  async findBySlug(slug: string) {
    const seller = await this.prisma.sellerProfile.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    if (!seller) {
      return null;
    }

    return this.attachStats(seller);
  }

  private async attachStats<T extends { userId: string; rating: number; totalSales: number; totalReviews: number }>(seller: T) {
    const totalProducts = await this.prisma.product.count({
      where: { sellerId: seller.userId, status: 'APPROVED' },
    });

    return {
      ...seller,
      stats: {
        totalProducts,
        avgRating: seller.rating,
        totalSales: seller.totalSales,
        totalReviews: seller.totalReviews,
      },
    };
  }

  /**
   * ✅ Obtener productos de un vendedor específico
   */
  async getSellerProducts(sellerId: string, filters: GetSellerProductsQuery) {
    const {
      page = 1,
      limit = 12,
      category,
      difficulty,
      priceMin,
      priceMax,
      sortBy = 'newest',
      search,
    } = filters;

    // ✅ Construir condiciones WHERE para SQLite
    const whereConditions: Prisma.ProductWhereInput = {
      sellerId: sellerId, // ✅ Filtrar por vendedor (userId)
      status: 'APPROVED', // ✅ Solo productos aprobados
      // ✅ Filtros adicionales
      ...(category && { category }),
      ...(difficulty && { difficulty }),
      ...(priceMin && { price: { gte: priceMin } }),
      ...(priceMax && { 
        price: priceMin 
          ? { gte: priceMin, lte: priceMax }
          : { lte: priceMax }
      }),
      // ✅ Búsqueda compatible con SQLite
      ...(search && {
        OR: [
          { title: { contains: search } },
          { description: { contains: search } },
          { tags: { hasSome: [search] } },
        ],
      }),
    };

    // ✅ Configurar ordenamiento
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    
    switch (sortBy) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'rating':
        orderBy = { rating: 'desc' };
        break;
      case 'popular':
        orderBy = { viewCount: 'desc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const skip = (page - 1) * limit;

    // ✅ Ejecutar queries
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: whereConditions,
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
      this.prisma.product.count({
        where: whereConditions,
      }),
    ]);

    // ✅ Calcular metadata de paginación
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      data: products,
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrev,
    };
  }

  /**
   * ✅ Actualizar vendedor
   */
  async update(id: string, updateSellerDto: Prisma.SellerProfileUpdateInput) {
    const seller = await this.prisma.sellerProfile.findUnique({
      where: { id },
    });

    if (!seller) {
      throw new NotFoundException(`Seller with ID "${id}" not found`);
    }

    return this.prisma.sellerProfile.update({
      where: { id },
      data: updateSellerDto,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });
  }

  /**
   * ✅ Eliminar vendedor
   */
  async remove(id: string) {
    const seller = await this.prisma.sellerProfile.findUnique({
      where: { id },
    });

    if (!seller) {
      throw new NotFoundException(`Seller with ID "${id}" not found`);
    }

    return this.prisma.sellerProfile.delete({
      where: { id },
    });
  }
}