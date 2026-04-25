import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStatus, ProductStatus, ReviewStatus, UserRole } from '@prisma/client';
import { ProductMetric, RecentOrderMetric, RecentReviewMetric } from '../interfaces/analytics.interface';
import { AnalyticsCalculationService } from './analytics-calculation.service';

type TimeRange = { start: Date; end: Date };

@Injectable()
export class AnalyticsQueryService {
  private readonly logger = new Logger(AnalyticsQueryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly calc: AnalyticsCalculationService
  ) {}

  // ─── Seller Queries ───────────────────────────────────────────────────────

  async getSellerRevenue(sellerId: string, timeRange: TimeRange): Promise<any> {
    const [orders, prevOrders, monthOrders] = await Promise.all([
      this.fetchSellerCompletedOrders(sellerId, timeRange),
      this.fetchSellerCompletedOrders(sellerId, this.calc.getPreviousPeriod(timeRange)),
      this.fetchSellerCompletedOrders(sellerId, {
        start: this.calc.getCurrentMonthStart(),
        end: new Date()
      })
    ]);

    const totalRevenue = this.sumSellerRevenue(orders);
    const prevRevenue = this.sumSellerRevenue(prevOrders);
    const monthlyRevenue = this.sumSellerRevenue(monthOrders);
    const totalItems = orders.reduce((s, o) => s + o.items.length, 0);

    return {
      total: this.calc.buildMetricValue(totalRevenue, prevRevenue),
      monthly: this.calc.buildMetricValue(monthlyRevenue),
      averageOrderValue: this.calc.buildMetricValue(this.calc.calculateAOV(totalRevenue, totalItems))
    };
  }

  async getSellerOrders(sellerId: string, timeRange: TimeRange): Promise<any> {
    const [orders, monthlyCount] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          createdAt: { gte: timeRange.start, lte: timeRange.end },
          items: { some: { sellerId } }
        },
        select: { status: true }
      }),
      this.prisma.order.count({
        where: {
          createdAt: { gte: this.calc.getCurrentMonthStart() },
          items: { some: { sellerId } }
        }
      })
    ]);

    const total = orders.length;
    const completed = orders.filter(o => o.status === OrderStatus.COMPLETED).length;

    return {
      total: this.calc.buildMetricValue(total),
      monthly: this.calc.buildMetricValue(monthlyCount),
      completionRate: this.calc.buildMetricValue(this.calc.calculateConversionRate(completed, total))
    };
  }

  async getSellerProducts(sellerId: string, timeRange: TimeRange): Promise<any> {
    const products = await this.prisma.product.findMany({
      where: { sellerId },
      select: {
        id: true,
        title: true,
        status: true,
        orderItems: {
          where: {
            order: {
              status: OrderStatus.COMPLETED,
              createdAt: { gte: timeRange.start, lte: timeRange.end }
            }
          },
          select: { price: true }
        },
        productRating: { select: { averageRating: true, totalReviews: true } }
      }
    });

    const topPerforming: ProductMetric[] = products
      .map(p => ({
        id: p.id,
        title: p.title,
        revenue: p.orderItems.reduce((s, i) => s + i.price, 0),
        orders: p.orderItems.length,
        averageRating: Number(p.productRating?.averageRating ?? 0),
        reviewCount: p.productRating?.totalReviews ?? 0,
        conversionRate: 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      total: { value: products.length },
      active: { value: products.filter(p => p.status === ProductStatus.APPROVED).length },
      topPerforming
    };
  }

  async getSellerReviews(sellerId: string, timeRange: TimeRange): Promise<any> {
    const [sellerRating, reviews] = await Promise.all([
      this.prisma.sellerRating.findUnique({ where: { sellerId } }),
      this.prisma.review.findMany({
        where: { sellerId, createdAt: { gte: timeRange.start, lte: timeRange.end } },
        select: { id: true, rating: true, response: { select: { id: true } } }
      })
    ]);

    const total = reviews.length;
    const responded = reviews.filter(r => r.response).length;

    return {
      averageRating: this.calc.buildMetricValue(Number(sellerRating?.averageRating ?? 0)),
      total: this.calc.buildMetricValue(sellerRating?.totalReviews ?? 0),
      responseRate: this.calc.buildMetricValue(this.calc.calculateConversionRate(responded, total))
    };
  }

  async getSellerRecentOrders(sellerId: string, limit: number): Promise<RecentOrderMetric[]> {
    const orders = await this.prisma.order.findMany({
      where: { items: { some: { sellerId } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        buyer: { select: { firstName: true, lastName: true } },
        items: {
          where: { sellerId },
          include: { product: { select: { title: true } } }
        }
      }
    });

    return orders.map(o => ({
      id: o.id,
      buyerName: `${o.buyer.firstName} ${o.buyer.lastName}`,
      productTitle: o.items.length > 1
        ? 'Multiple Items'
        : o.items[0]?.product?.title ?? 'Multiple Items',
      amount: o.items.reduce((s, i) => s + i.price, 0),
      status: o.status,
      createdAt: o.createdAt.toISOString()
    }));
  }

  async getSellerRecentReviews(sellerId: string, limit: number): Promise<RecentReviewMetric[]> {
    const reviews = await this.prisma.review.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        buyer: { select: { firstName: true, lastName: true } },
        product: { select: { title: true } },
        response: { select: { id: true } }
      }
    });

    return reviews.map(r => ({
      id: r.id,
      buyerName: `${r.buyer.firstName} ${r.buyer.lastName}`,
      productTitle: r.product.title,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
      hasResponse: !!r.response
    }));
  }

  async getSellerRevenueByProduct(sellerId: string, timeRange: TimeRange): Promise<any[]> {
    const products = await this.prisma.product.findMany({
      where: { sellerId },
      select: {
        id: true,
        title: true,
        orderItems: {
          where: {
            order: {
              status: OrderStatus.COMPLETED,
              createdAt: { gte: timeRange.start, lte: timeRange.end }
            }
          },
          select: { price: true }
        }
      }
    });

    return products
      .map(p => ({
        productId: p.id,
        productTitle: p.title,
        revenue: p.orderItems.reduce((s, i) => s + i.price, 0),
        orders: p.orderItems.length
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  async getSellerFeesBreakdown(sellerId: string, timeRange: TimeRange): Promise<any> {
    const transactions = await this.prisma.transaction.findMany({
      where: { sellerId, createdAt: { gte: timeRange.start, lte: timeRange.end } },
      select: { type: true, amount: true }
    });

    const platformFees = transactions
      .filter(t => t.type === 'PLATFORM_FEE')
      .reduce((s, t) => s + Number(t.amount), 0);
    const stripeFees = transactions
      .filter(t => t.type === 'STRIPE_FEE')
      .reduce((s, t) => s + Number(t.amount), 0);

    return { platformFees, stripeFees, totalFees: platformFees + stripeFees };
  }

  async getSellerRevenueTrends(
    sellerId: string,
    timeRange: TimeRange,
    groupBy: string = 'month'
  ): Promise<any[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.COMPLETED,
        createdAt: { gte: timeRange.start, lte: timeRange.end },
        items: { some: { sellerId } }
      },
      select: {
        createdAt: true,
        items: { where: { sellerId }, select: { price: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    const mapped = orders.map(o => ({
      createdAt: o.createdAt,
      sellerRevenue: o.items.reduce((s, i) => s + i.price, 0)
    }));

    return this.calc.groupRevenueByPeriod(mapped, groupBy as 'day' | 'week' | 'month');
  }

  // ─── Platform Queries ─────────────────────────────────────────────────────

  async getPlatformUsers(timeRange: TimeRange): Promise<any> {
    const [total, sellers, buyers, active] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: UserRole.SELLER } }),
      this.prisma.user.count({ where: { role: UserRole.BUYER } }),
      this.prisma.user.count({
        where: { lastLoginAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
      })
    ]);

    return {
      totalUsers: this.calc.buildMetricValue(total),
      totalSellers: this.calc.buildMetricValue(sellers),
      totalBuyers: this.calc.buildMetricValue(buyers),
      activeUsers: this.calc.buildMetricValue(active)
    };
  }

  async getPlatformRevenue(timeRange: TimeRange): Promise<any> {
    const [orders, monthOrders] = await Promise.all([
      this.prisma.order.findMany({
        where: { status: OrderStatus.COMPLETED, createdAt: { gte: timeRange.start, lte: timeRange.end } },
        select: { totalAmount: true, platformFeeRate: true }
      }),
      this.prisma.order.findMany({
        where: { status: OrderStatus.COMPLETED, createdAt: { gte: this.calc.getCurrentMonthStart() } },
        select: { totalAmount: true, platformFeeRate: true }
      })
    ]);

    const platformRevenue = orders.reduce((s, o) => s + o.totalAmount * o.platformFeeRate, 0);
    const monthlyPlatformRevenue = monthOrders.reduce((s, o) => s + o.totalAmount * o.platformFeeRate, 0);

    return {
      totalPlatformRevenue: this.calc.buildMetricValue(platformRevenue),
      monthlyPlatformRevenue: this.calc.buildMetricValue(monthlyPlatformRevenue),
      averagePlatformFee: this.calc.buildMetricValue(
        this.calc.calculateAOV(platformRevenue, orders.length)
      )
    };
  }

  async getPlatformOrders(timeRange: TimeRange): Promise<any> {
    const [total, monthly, avgResult] = await Promise.all([
      this.prisma.order.count({
        where: { createdAt: { gte: timeRange.start, lte: timeRange.end } }
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: this.calc.getCurrentMonthStart() } }
      }),
      this.prisma.order.aggregate({
        where: { status: OrderStatus.COMPLETED, createdAt: { gte: timeRange.start, lte: timeRange.end } },
        _avg: { totalAmount: true }
      })
    ]);

    return {
      totalOrders: this.calc.buildMetricValue(total),
      monthlyOrders: this.calc.buildMetricValue(monthly),
      averageOrderValue: this.calc.buildMetricValue(Number(avgResult._avg.totalAmount) || 0)
    };
  }

  async getPlatformProducts(_timeRange: TimeRange): Promise<any> {
    const [total, active, pending] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.product.count({ where: { status: ProductStatus.APPROVED } }),
      this.prisma.product.count({ where: { status: ProductStatus.PENDING } })
    ]);

    return {
      totalProducts: this.calc.buildMetricValue(total),
      activeProducts: this.calc.buildMetricValue(active),
      pendingModeration: this.calc.buildMetricValue(pending)
    };
  }

  async getPlatformReviews(timeRange: TimeRange): Promise<any> {
    const [total, avgResult, pending] = await Promise.all([
      this.prisma.review.count({ where: { createdAt: { gte: timeRange.start, lte: timeRange.end } } }),
      this.prisma.review.aggregate({
        _avg: { rating: true },
        where: { status: ReviewStatus.PUBLISHED }
      }),
      this.prisma.review.count({ where: { status: ReviewStatus.PENDING_MODERATION } })
    ]);

    return {
      totalReviews: this.calc.buildMetricValue(total),
      averagePlatformRating: this.calc.buildMetricValue(Number(avgResult._avg.rating) || 0),
      pendingModeration: this.calc.buildMetricValue(pending)
    };
  }

  // ─── Health Checks ────────────────────────────────────────────────────────

  async checkDatabaseHealth(): Promise<{ status: string; responseTime?: number }> {
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'healthy', responseTime: Date.now() - start };
    } catch {
      return { status: 'unhealthy' };
    }
  }

  async checkAnalyticsHealth(): Promise<{ status: string; lastCalculation?: string }> {
    try {
      await this.prisma.user.count();
      return { status: 'healthy', lastCalculation: new Date().toISOString() };
    } catch {
      return { status: 'unhealthy' };
    }
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private fetchSellerCompletedOrders(sellerId: string, timeRange: TimeRange) {
    return this.prisma.order.findMany({
      where: {
        status: OrderStatus.COMPLETED,
        createdAt: { gte: timeRange.start, lte: timeRange.end },
        items: { some: { sellerId } }
      },
      select: { items: { where: { sellerId }, select: { price: true } } }
    });
  }

  private sumSellerRevenue(orders: Array<{ items: Array<{ price: number }> }>): number {
    return orders.reduce((s, o) => s + o.items.reduce((is, i) => is + i.price, 0), 0);
  }
}
