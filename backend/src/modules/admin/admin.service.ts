import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, ProductStatus, UserStatus } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { ProductsService } from '../products/products.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => ProductsService))
    private readonly productsService: ProductsService,
  ) {}

  // 📊 DASHBOARD BÁSICO
  async getDashboardOverview() {
    try {
      this.logger.log('Getting admin dashboard overview');

      const [
        totalUsers,
        totalSellers,
        totalBuyers,
        totalProducts,
        pendingProducts,
        totalOrders,
        platformRevenue
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { role: UserRole.SELLER } }),
        this.prisma.user.count({ where: { role: UserRole.BUYER } }),
        this.prisma.product.count(),
        this.prisma.product.count({ where: { status: ProductStatus.PENDING } }),
        this.prisma.order.count(),
        this.calculatePlatformRevenue()
      ]);

      return {
        success: true,
        data: {
          users: {
            total: totalUsers,
            sellers: totalSellers,
            buyers: totalBuyers
          },
          products: {
            total: totalProducts,
            pending: pendingProducts
          },
          orders: {
            total: totalOrders
          },
          revenue: {
            platform: platformRevenue
          }
        }
      };
    } catch (error) {
      this.logger.error(`Error getting dashboard overview: ${error.message}`, error.stack);
      throw error;
    }
  }

  // 👥 GESTIÓN DE USUARIOS
  async getAllUsers(page = 1, limit = 20, role?: UserRole) {
    try {
      this.logger.log(`Getting all users - page: ${page}, limit: ${limit}, role: ${role}`);

      const skip = (page - 1) * limit;
      const where = role ? { role } : {};

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          skip,
          take: limit,
          include: {
            sellerProfile: true,
            _count: {
              select: {
                orders: true,
                products: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        this.prisma.user.count({ where })
      ]);

      return {
        success: true,
        data: users,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      this.logger.error(`Error getting users: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateUserStatus(userId: string, status: UserStatus) {
    try {
      this.logger.log(`Updating user status: ${userId} to ${status}`);

      const user = await this.prisma.user.update({
        where: { id: userId },
        data: { status },
        include: {
          sellerProfile: true
        }
      });

      return {
        success: true,
        data: user,
        message: `User status updated to ${status}`
      };
    } catch (error) {
      this.logger.error(`Error updating user status: ${error.message}`, error.stack);
      throw error;
    }
  }

  // 📦 MODERACIÓN DE PRODUCTOS
  async getPendingProducts(page = 1, limit = 20) {
    try {
      this.logger.log(`Getting pending products - page: ${page}, limit: ${limit}`);

      const skip = (page - 1) * limit;

      const [products, total] = await Promise.all([
        this.prisma.product.findMany({
          where: { status: ProductStatus.PENDING },
          skip,
          take: limit,
          include: {
            seller: {
              select: {
                id: true,
                email: true,
                sellerProfile: {
                  select: {
                    storeName: true
                  }
                }
              }
            },
            pdfFile: true, // Archivo PDF principal
            imageFiles: true, // Archivos de imágenes
            thumbnailFiles: true, // Archivos de thumbnails
            _count: {
              select: {
                reviews: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }),
        this.prisma.product.count({ where: { status: ProductStatus.PENDING } })
      ]);

      return {
        success: true,
        data: products,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      this.logger.error(`Error getting pending products: ${error.message}`, error.stack);
      throw error;
    }
  }

  async moderateProduct(productId: string, status: ProductStatus, reason?: string) {
    try {
      this.logger.log(`Moderating product: ${productId} to ${status}`);

      const product = await this.prisma.product.update({
        where: { id: productId },
        data: { 
          status,
          rejectionReason: reason, // Campo correcto según schema
          moderatedAt: new Date()
        },
        include: {
          seller: {
            select: {
              id: true,
              email: true,
              sellerProfile: {
                select: {
                  storeName: true
                }
              }
            }
          }
        }
      });

      return {
        success: true,
        data: product,
        message: `Product ${status.toLowerCase()} successfully`
      };
    } catch (error) {
      this.logger.error(`Error moderating product: ${error.message}`, error.stack);
      throw error;
    }
  }

  // 📈 MÉTRICAS BÁSICAS
  async getSystemHealth() {
    try {
      this.logger.log('Getting system health metrics');

      const [
        dbConnectionTest,
        totalUsers,
        totalProducts,
        totalOrders,
        errorLogs
      ] = await Promise.all([
        this.testDatabaseConnection(),
        this.prisma.user.count(),
        this.prisma.product.count(),
        this.prisma.order.count(),
        this.getRecentErrorLogs()
      ]);

      return {
        success: true,
        data: {
          database: {
            connected: dbConnectionTest,
            uptime: process.uptime()
          },
          counts: {
            users: totalUsers,
            products: totalProducts,
            orders: totalOrders
          },
          errors: errorLogs,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error(`Error getting system health: ${error.message}`, error.stack);
      throw error;
    }
  }

  // 💰 CÁLCULOS AUXILIARES
  private async calculatePlatformRevenue(): Promise<number> {
    try {
      const transactions = await this.prisma.transaction.findMany({
        where: {
          type: 'PLATFORM_FEE'
        }
      });

      return transactions.reduce((total, transaction) => {
        return total + Number(transaction.amount);
      }, 0);
    } catch (error) {
      this.logger.error(`Error calculating platform revenue: ${error.message}`);
      return 0;
    }
  }

  private async testDatabaseConnection(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      return false;
    }
  }

  private async getRecentErrorLogs(): Promise<any[]> {
    // En un sistema real, esto vendría de un sistema de logging
    // Por ahora retornamos un array vacío
    return [];
  }
}