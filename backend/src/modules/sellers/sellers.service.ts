import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SellersService {
  constructor(private prisma: PrismaService) {}

  /**
   * ✅ Crear un nuevo vendedor
   */
  async create(createSellerDto: any) {
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
  async findAll(query: any = {}) {
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

    // Ejecutar consultas en paralelo
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

    // Calcular estadísticas para cada vendedor
    const sellersWithStats = await Promise.all(
      sellers.map(async (seller) => {
        const [productCount, avgRating, totalSales, totalReviews] = await Promise.all([
          this.prisma.product.count({
            where: { sellerId: seller.userId, status: 'APPROVED' },
          }),
          this.prisma.product.aggregate({
            where: { sellerId: seller.userId, status: 'APPROVED' },
            _avg: { rating: true },
          }),
          this.prisma.order.count({
            where: {
              items: {
                some: {
                  product: { sellerId: seller.userId },
                },
              },
              status: 'COMPLETED',
            },
          }),
          this.prisma.review.count({
            where: {
              product: { sellerId: seller.userId },
            },
          }),
        ]);

        return {
          ...seller,
          stats: {
            totalProducts: productCount,
            avgRating: avgRating._avg.rating || 0,
            totalSales,
            totalReviews,
          },
        };
      })
    );

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

    // Obtener estadísticas del vendedor
    const [productCount, avgRating, totalSales, totalReviews] = await Promise.all([
      this.prisma.product.count({
        where: { sellerId: seller.userId, status: 'APPROVED' },
      }),
      this.prisma.product.aggregate({
        where: { sellerId: seller.userId, status: 'APPROVED' },
        _avg: { rating: true },
      }),
      this.prisma.order.count({
        where: {
          items: {
            some: {
              product: { sellerId: seller.userId },
            },
          },
          status: 'COMPLETED',
        },
      }),
      this.prisma.review.count({
        where: {
          product: { sellerId: seller.userId },
        },
      }),
    ]);

    return {
      ...seller,
      stats: {
        totalProducts: productCount,
        avgRating: avgRating._avg.rating || 0,
        totalSales,
        totalReviews,
      },
    };
  }

  /**
   * ✅ Buscar vendedor por slug
   */
  async findBySlug(slug: string) {
    console.log('🔍 [SERVICE] Finding seller by slug:', slug);

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
      console.log('❌ [SERVICE] Seller not found with slug:', slug);
      return null;
    }

    console.log('✅ [SERVICE] Found seller:', seller.storeName);

    // Obtener estadísticas del vendedor
    const [productCount, avgRating, totalSales, totalReviews] = await Promise.all([
      this.prisma.product.count({
        where: { sellerId: seller.userId, status: 'APPROVED' },
      }),
      this.prisma.product.aggregate({
        where: { sellerId: seller.userId, status: 'APPROVED' },
        _avg: { rating: true },
      }),
      this.prisma.order.count({
        where: {
          items: {
            some: {
              product: { sellerId: seller.userId },
            },
          },
          status: 'COMPLETED',
        },
      }),
      this.prisma.review.count({
        where: {
          product: { sellerId: seller.userId },
        },
      }),
    ]);

    return {
      ...seller,
      stats: {
        totalProducts: productCount,
        avgRating: avgRating._avg.rating || 0,
        totalSales,
        totalReviews,
      },
    };
  }

  /**
   * ✅ Obtener productos de un vendedor específico
   */
  async getSellerProducts(sellerId: string, filters: any) {
    console.log('🔍 [SERVICE] Getting products for seller:', sellerId, 'with filters:', filters);

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
          { tags: { contains: search } },
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

    console.log('✅ [SERVICE] Found products:', products.length, 'of', total);

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
  async update(id: string, updateSellerDto: any) {
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