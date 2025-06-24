import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminAnalyticsFiltersDto } from './dto/admin-analytics.dto';
import { 
  OrderAnalyticsDto, 
  ProductAnalyticsDto, 
  UserAnalyticsDto, 
  FinancialAnalyticsDto,
  AdminDashboardDto 
} from './dto/analytics-response.dto';

@Injectable()
export class AdminAnalyticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Obtener dashboard completo de analytics
   */
  async getDashboard(filters: AdminAnalyticsFiltersDto): Promise<AdminDashboardDto> {
    const [orders, products, users, financial] = await Promise.all([
      this.getOrderAnalytics(filters),
      this.getProductAnalytics(filters),
      this.getUserAnalytics(filters),
      this.getFinancialAnalytics(filters)
    ]);

    return {
      orders,
      products,
      users,
      financial,
      generatedAt: new Date()
    };
  }

  /**
   * Analytics de órdenes
   */
  async getOrderAnalytics(filters: AdminAnalyticsFiltersDto): Promise<OrderAnalyticsDto> {
    const whereClause = this.buildWhereClause(filters);

    // Total de órdenes y revenue
    const orderStats = await this.prisma.order.aggregate({
      where: whereClause,
      _count: { id: true },
      _sum: { totalAmount: true, platformFee: true },
      _avg: { totalAmount: true }
    });

    // Órdenes por estado
    const ordersByStatus = await this.prisma.order.groupBy({
      by: ['status'],
      where: whereClause,
      _count: { status: true }
    });

    // Revenue por período
    const revenueByPeriod = await this.getRevenueByPeriod(filters);

    // Calcular conversion rate (órdenes completadas / órdenes totales)
    const completedOrders = await this.prisma.order.count({
      where: { ...whereClause, status: 'COMPLETED' }
    });

    return {
      totalOrders: orderStats._count.id || 0,
      totalRevenue: orderStats._sum.totalAmount || 0,
      totalPlatformFees: orderStats._sum.platformFee || 0,
      avgOrderValue: orderStats._avg.totalAmount || 0,
      conversionRate: orderStats._count.id ? (completedOrders / orderStats._count.id) * 100 : 0,
      ordersByStatus: Object.fromEntries(
        ordersByStatus.map(item => [item.status, item._count.status])
      ),
      revenueByPeriod
    };
  }

  /**
   * Analytics de productos
   */
  async getProductAnalytics(filters: AdminAnalyticsFiltersDto): Promise<ProductAnalyticsDto> {
    // Total de productos
    const totalProducts = await this.prisma.product.count({
      where: { status: 'APPROVED' }
    });

    // Total de descargas
    const downloadStats = await this.prisma.downloadToken.aggregate({
      _sum: { downloadCount: true }
    });

    // Rating promedio
    const ratingStats = await this.prisma.product.aggregate({
      where: { status: 'APPROVED', reviewCount: { gt: 0 } },
      _avg: { rating: true }
    });

    // Top productos más vendidos
    const topSellingProducts = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _count: { productId: true },
      _sum: { price: true },
      orderBy: { _count: { productId: 'desc' } },
      take: 10
    });

    // Obtener detalles de productos top
    const topProducts = await Promise.all(
      topSellingProducts.map(async (item) => {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
          select: { id: true, title: true }
        });
        return {
          id: item.productId,
          title: product?.title || 'Unknown',
          sales: item._count.productId,
          revenue: item._sum.price || 0
        };
      })
    );

    // Productos por categoría
    const productsByCategory = await this.prisma.product.groupBy({
      by: ['category'],
      where: { status: 'APPROVED' },
      _count: { category: true }
    });

    // Productos por dificultad
    const productsByDifficulty = await this.prisma.product.groupBy({
      by: ['difficulty'],
      where: { status: 'APPROVED' },
      _count: { difficulty: true }
    });

    return {
      totalProducts,
      totalDownloads: downloadStats._sum.downloadCount || 0,
      avgRating: ratingStats._avg.rating || 0,
      topSellingProducts: topProducts,
      productsByCategory: Object.fromEntries(
        productsByCategory.map(item => [item.category, item._count.category])
      ),
      productsByDifficulty: Object.fromEntries(
        productsByDifficulty.map(item => [item.difficulty, item._count.difficulty])
      )
    };
  }

  /**
   * Analytics de usuarios
   */
  async getUserAnalytics(filters: AdminAnalyticsFiltersDto): Promise<UserAnalyticsDto> {
    const totalUsers = await this.prisma.user.count();
    const totalBuyers = await this.prisma.user.count({ where: { role: 'BUYER' } });
    const totalSellers = await this.prisma.user.count({ where: { role: 'SELLER' } });

    // Usuarios activos (login en últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeUsers = await this.prisma.user.count({
      where: { lastLoginAt: { gte: thirtyDaysAgo } }
    });

    // Nuevos usuarios en el período
    const whereClause = this.buildWhereClause(filters);
    const newUsers = await this.prisma.user.count({
      where: {
        createdAt: {
          gte: filters.fromDate ? new Date(filters.fromDate) : undefined,
          lte: filters.toDate ? new Date(filters.toDate) : undefined
        }
      }
    });

    // Top sellers
    const topSellers = await this.prisma.sellerProfile.findMany({
      take: 10,
      orderBy: { totalSales: 'desc' },
      include: { user: true }
    });

    return {
      totalUsers,
      totalBuyers,
      totalSellers,
      activeUsers,
      newUsersThisPeriod: newUsers,
      topSellers: topSellers.map(seller => ({
        id: seller.userId,
        name: `${seller.user.firstName} ${seller.user.lastName}`,
        storeName: seller.storeName,
        sales: seller.totalSales,
        revenue: 0 // TODO: Calcular revenue real
      })),
      usersByCountry: {} // TODO: Implementar cuando tengamos info de país
    };
  }

  /**
   * Analytics financieros
   */
  async getFinancialAnalytics(filters: AdminAnalyticsFiltersDto): Promise<FinancialAnalyticsDto> {
    const whereClause = this.buildWhereClause(filters);

    const financialStats = await this.prisma.order.aggregate({
      where: { ...whereClause, status: 'COMPLETED' },
      _sum: { totalAmount: true, platformFee: true, sellerAmount: true }
    });

    // Revenue por país (cuando implementemos geo-data)
    const revenueByCountry = {}; // TODO: Implementar

    // Fees por tipo
    const feesByType = await this.prisma.order.findMany({
      where: { ...whereClause, status: 'COMPLETED' },
      select: { feeBreakdown: true }
    });

    // Growth mensual
    const monthlyGrowth = await this.getMonthlyGrowth(filters);

    return {
      totalRevenue: financialStats._sum.totalAmount || 0,
      totalPlatformFees: financialStats._sum.platformFee || 0,
      totalSellerPayouts: financialStats._sum.sellerAmount || 0,
      pendingPayouts: 0, // TODO: Implementar cuando tengamos payouts
      revenueByCountry,
      feesByType: {}, // TODO: Procesar feeBreakdown
      monthlyGrowth
    };
  }

  /**
   * Helper: Construir where clause basado en filtros
   */
  private buildWhereClause(filters: AdminAnalyticsFiltersDto) {
    const where: any = {};

    if (filters.fromDate || filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = new Date(filters.fromDate);
      if (filters.toDate) where.createdAt.lte = new Date(filters.toDate);
    }

    return where;
  }

  /**
   * Helper: Revenue por período
   */
  private async getRevenueByPeriod(filters: AdminAnalyticsFiltersDto) {
    // Implementación básica, se puede mejorar con SQL más complejo
    const whereClause = this.buildWhereClause(filters);
    
    const orders = await this.prisma.order.findMany({
      where: { ...whereClause, status: 'COMPLETED' },
      select: { totalAmount: true, createdAt: true },
      orderBy: { createdAt: 'asc' }
    });

    // Agrupar por mes (simplificado)
    const monthlyData = new Map();
    
    orders.forEach(order => {
      const monthKey = order.createdAt.toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { revenue: 0, orders: 0 });
      }
      
      const data = monthlyData.get(monthKey);
      data.revenue += order.totalAmount;
      data.orders += 1;
    });

    return Array.from(monthlyData.entries()).map(([period, data]) => ({
      period,
      revenue: data.revenue,
      orders: data.orders
    }));
  }

  /**
   * Helper: Growth mensual
   */
  private async getMonthlyGrowth(filters: AdminAnalyticsFiltersDto) {
    // Implementación simplificada
    return [
      { month: '2025-01', revenue: 1000, growth: 0 },
      { month: '2025-02', revenue: 1200, growth: 20 },
      { month: '2025-03', revenue: 1440, growth: 20 }
    ];
  }
}
