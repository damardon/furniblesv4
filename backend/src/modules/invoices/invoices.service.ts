// src/modules/invoices/invoices.service.ts
import { Injectable, Logger, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { GenerateInvoiceDto, InvoiceFilterDto } from './dto/generate-invoice.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 🆕 Generar invoice automáticamente desde orden
   */
  async generateInvoiceFromOrder(orderId: string, dto?: GenerateInvoiceDto) {
    try {
      this.logger.log(`Generating invoice for order ${orderId}`);

      // Verificar que la orden existe y está completa
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          buyer: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          items: {
            include: {
              seller: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  sellerProfile: {
                    select: {
                      storeName: true,
                    },
                  },
                },
              },
              product: {
                select: {
                  title: true,
                  category: true,
                },
              },
            },
          },
        },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (order.status !== 'COMPLETED') {
        throw new BadRequestException('Can only generate invoice for completed orders');
      }

      // Verificar si ya existe invoice para esta orden
      const existingInvoice = await this.prisma.invoice.findUnique({
        where: { orderId },
      });

      if (existingInvoice) {
        throw new BadRequestException('Invoice already exists for this order');
      }

      // Para cada seller en la orden, crear una invoice separada
      const sellerGroups = this.groupOrderItemsBySeller(order.items);
      const invoices = [];

      for (const [sellerId, items] of sellerGroups.entries()) {
        const seller = items[0].seller;
        
        // Calcular montos para este seller
        const subtotal = items.reduce((sum, item) => sum + Number(item.price), 0);
        const platformFeeRate = order.platformFeeRate || 0.10;
        const platformFee = subtotal * platformFeeRate;
        const netAmount = subtotal - platformFee;
        
        // Calcular tax si se proporciona
        const taxRate = dto?.taxRate || 0;
        const taxAmount = netAmount * taxRate;
        const totalAmount = netAmount + taxAmount;

        // Generar número de invoice único
        const invoiceNumber = await this.generateInvoiceNumber();

        // Crear invoice
        const invoice = await this.prisma.invoice.create({
          data: {
            invoiceNumber,
            sellerId,
            orderId,
            subtotal: new Prisma.Decimal(subtotal),
            platformFee: new Prisma.Decimal(platformFee),
            netAmount: new Prisma.Decimal(netAmount),
            taxAmount: taxAmount > 0 ? new Prisma.Decimal(taxAmount) : null,
            totalAmount: new Prisma.Decimal(totalAmount),
            status: 'ISSUED',
            currency: order.currency || 'USD',
            issuedAt: new Date(),
            dueAt: dto?.dueAt ? new Date(dto.dueAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
          },
        });

        invoices.push({
          ...invoice,
          seller: {
            name: `${seller.firstName} ${seller.lastName}`,
            storeName: seller.sellerProfile?.storeName,
            email: seller.email,
          },
          items: items.map(item => ({
            productTitle: item.product.title,
            category: item.product.category,
            price: Number(item.price),
            quantity: item.quantity,
          })),
        });
      }

      this.logger.log(`Generated ${invoices.length} invoices for order ${orderId}`);
      return invoices;
    } catch (error) {
      this.logger.error(`Failed to generate invoice: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Obtener invoices del seller
   */
  async getSellerInvoices(sellerId: string, filters: InvoiceFilterDto) {
    try {
      this.logger.log(`Getting invoices for seller ${sellerId}`);

      const where: Prisma.InvoiceWhereInput = {
        sellerId,
      };

      // Aplicar filtros
      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.currency) {
        where.currency = filters.currency;
      }

      if (filters.startDate || filters.endDate) {
        where.issuedAt = {};
        if (filters.startDate) {
          where.issuedAt.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          where.issuedAt.lte = new Date(filters.endDate);
        }
      }

      if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
        where.totalAmount = {};
        if (filters.minAmount !== undefined) {
          where.totalAmount.gte = new Prisma.Decimal(filters.minAmount);
        }
        if (filters.maxAmount !== undefined) {
          where.totalAmount.lte = new Prisma.Decimal(filters.maxAmount);
        }
      }

      if (filters.search) {
        where.OR = [
          { invoiceNumber: { contains: filters.search, mode: 'insensitive' } },
          {
            order: {
              orderNumber: { contains: filters.search, mode: 'insensitive' },
            },
          },
        ];
      }

      // Paginación
      const limit = filters.limit || 20;
      const page = filters.page || 1;
      const skip = (page - 1) * limit;

      // Ordenamiento
      const orderBy: Prisma.InvoiceOrderByWithRelationInput = {};
      const sortField = filters.sortBy || 'issuedAt';
      orderBy[sortField] = filters.sortOrder || 'desc';

      // Ejecutar consulta
      const [invoices, total] = await Promise.all([
        this.prisma.invoice.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            seller: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                sellerProfile: {
                  select: {
                    storeName: true,
                  },
                },
              },
            },
            order: {
              select: {
                orderNumber: true,
                totalAmount: true,
                status: true,
                buyer: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        }),
        this.prisma.invoice.count({ where }),
      ]);

      return {
        data: invoices,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get seller invoices: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Obtener todas las invoices (Admin)
   */
  async getAllInvoices(filters: InvoiceFilterDto) {
    try {
      this.logger.log('Getting all invoices for admin');

      const where: Prisma.InvoiceWhereInput = {};

      // Aplicar filtros
      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.currency) {
        where.currency = filters.currency;
      }

      if (filters.sellerId) {
        where.sellerId = filters.sellerId;
      }

      if (filters.startDate || filters.endDate) {
        where.issuedAt = {};
        if (filters.startDate) {
          where.issuedAt.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          where.issuedAt.lte = new Date(filters.endDate);
        }
      }

      if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
        where.totalAmount = {};
        if (filters.minAmount !== undefined) {
          where.totalAmount.gte = new Prisma.Decimal(filters.minAmount);
        }
        if (filters.maxAmount !== undefined) {
          where.totalAmount.lte = new Prisma.Decimal(filters.maxAmount);
        }
      }

      if (filters.search) {
        where.OR = [
          { invoiceNumber: { contains: filters.search, mode: 'insensitive' } },
          {
            order: {
              orderNumber: { contains: filters.search, mode: 'insensitive' },
            },
          },
          {
            seller: {
              OR: [
                { firstName: { contains: filters.search, mode: 'insensitive' } },
                { lastName: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } },
              ],
            },
          },
        ];
      }

      // Paginación
      const limit = filters.limit || 20;
      const page = filters.page || 1;
      const skip = (page - 1) * limit;

      // Ordenamiento
      const orderBy: Prisma.InvoiceOrderByWithRelationInput = {};
      const sortField = filters.sortBy || 'issuedAt';
      orderBy[sortField] = filters.sortOrder || 'desc';

      // Ejecutar consulta
      const [invoices, total] = await Promise.all([
        this.prisma.invoice.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            seller: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                sellerProfile: {
                  select: {
                    storeName: true,
                  },
                },
              },
            },
            order: {
              select: {
                orderNumber: true,
                totalAmount: true,
                status: true,
                buyerId: true,
                buyer: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        }),
        this.prisma.invoice.count({ where }),
      ]);

      return {
        data: invoices,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
        filters: {
          applied: Object.keys(where).length > 0,
          ...filters,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get all invoices: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Obtener detalles de invoice específica
   */
  async getInvoiceById(invoiceId: string, userId: string, userRole: string) {
    try {
      this.logger.log(`Getting invoice ${invoiceId} for user ${userId}`);

      const where: Prisma.InvoiceWhereUniqueInput = { id: invoiceId };

      const invoice = await this.prisma.invoice.findUnique({
        where,
        include: {
          seller: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              sellerProfile: {
                select: {
                  storeName: true,
                },
              },
            },
          },
          order: {
            select: {
              orderNumber: true,
              totalAmount: true,
              status: true,
              buyerId: true,
              buyer: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
              items: {
                include: {
                  product: {
                    select: {
                      title: true,
                      category: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      // Solo sellers pueden ver sus propias invoices, admins pueden ver todas
      if (userRole !== 'ADMIN' && invoice.sellerId !== userId) {
        throw new NotFoundException('Invoice not found');
      }

      return invoice;
    } catch (error) {
      this.logger.error(`Failed to get invoice: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Actualizar estado de invoice (Admin)
   */
  async updateInvoiceStatus(invoiceId: string, status: 'PENDING' | 'ISSUED' | 'PAID' | 'OVERDUE' | 'CANCELLED') {
    try {
      this.logger.log(`Updating invoice ${invoiceId} status to ${status}`);

      const updateData: Prisma.InvoiceUpdateInput = {
        status,
        updatedAt: new Date(),
      };

      if (status === 'PAID') {
        updateData.paidAt = new Date();
      }

      const updatedInvoice = await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: updateData,
      });

      this.logger.log(`Invoice ${invoiceId} status updated to ${status}`);
      return updatedInvoice;
    } catch (error) {
      this.logger.error(`Failed to update invoice status: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Obtener estadísticas de invoices
   */
  async getInvoiceStatistics(filters?: { startDate?: string; endDate?: string; sellerId?: string }) {
    try {
      this.logger.log('Getting invoice statistics');

      const where: Prisma.InvoiceWhereInput = {};

      if (filters?.sellerId) {
        where.sellerId = filters.sellerId;
      }

      if (filters?.startDate || filters?.endDate) {
        where.issuedAt = {};
        if (filters.startDate) {
          where.issuedAt.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          where.issuedAt.lte = new Date(filters.endDate);
        }
      }

      // Estadísticas por estado
      const statusStats = await this.prisma.invoice.groupBy({
        by: ['status'],
        where,
        _count: {
          id: true,
        },
        _sum: {
          totalAmount: true,
        },
      });

      // Estadísticas por moneda
      const currencyStats = await this.prisma.invoice.groupBy({
        by: ['currency'],
        where,
        _count: {
          id: true,
        },
        _sum: {
          totalAmount: true,
        },
      });

      // Estadísticas generales
      const totalInvoices = await this.prisma.invoice.count({ where });
      const totalAmount = await this.prisma.invoice.aggregate({
        where,
        _sum: {
          totalAmount: true,
        },
      });

      return {
        summary: {
          totalInvoices,
          totalAmount: Number(totalAmount._sum.totalAmount || 0),
          averageAmount: totalInvoices > 0 ? Number(totalAmount._sum.totalAmount || 0) / totalInvoices : 0,
        },
        byStatus: statusStats.map(stat => ({
          status: stat.status,
          count: stat._count.id,
          totalAmount: Number(stat._sum.totalAmount || 0),
        })),
        byCurrency: currencyStats.map(stat => ({
          currency: stat.currency,
          count: stat._count.id,
          totalAmount: Number(stat._sum.totalAmount || 0),
        })),
      };
    } catch (error) {
      this.logger.error(`Failed to get invoice statistics: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Procesar invoices vencidas automáticamente
   */
  async processOverdueInvoices() {
    try {
      this.logger.log('Processing overdue invoices');

      const now = new Date();
      
      // Buscar invoices que están vencidas (dueAt < now) y todavía están en estado ISSUED
      const overdueInvoices = await this.prisma.invoice.findMany({
        where: {
          status: 'ISSUED',
          dueAt: {
            lt: now,
          },
        },
        select: {
          id: true,
          invoiceNumber: true,
          sellerId: true,
          dueAt: true,
        },
      });

      if (overdueInvoices.length === 0) {
        this.logger.log('No overdue invoices found');
        return { processed: 0, invoices: [] };
      }

      // Actualizar todas las invoices vencidas a OVERDUE
      const updateResult = await this.prisma.invoice.updateMany({
        where: {
          id: {
            in: overdueInvoices.map(inv => inv.id),
          },
        },
        data: {
          status: 'OVERDUE',
          updatedAt: now,
        },
      });

      this.logger.log(`Marked ${updateResult.count} invoices as overdue`);

      return {
        processed: updateResult.count,
        invoices: overdueInvoices,
      };
    } catch (error) {
      this.logger.error(`Failed to process overdue invoices: ${error.message}`);
      throw error;
    }
  }

  // ==========================================
  // 🔧 MÉTODOS AUXILIARES PRIVADOS
  // ==========================================

  /**
   * Generar número de invoice único
   */
  private async generateInvoiceNumber(): Promise<string> {
    const prefix = this.configService.get('INVOICE_PREFIX', 'INV');
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    
    // Buscar el último número del día
    const lastInvoice = await this.prisma.invoice.findFirst({
      where: {
        invoiceNumber: {
          startsWith: `${prefix}-${dateStr}`,
        },
      },
      orderBy: {
        invoiceNumber: 'desc',
      },
    });

    let sequence = 1;
    if (lastInvoice) {
      const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-').pop() || '0');
      sequence = lastSequence + 1;
    }

    const sequenceStr = sequence.toString().padStart(3, '0');
    return `${prefix}-${dateStr}-${sequenceStr}`;
  }

  /**
   * Agrupar items de orden por seller
   */
  private groupOrderItemsBySeller(orderItems: any[]): Map<string, any[]> {
    const groups = new Map<string, any[]>();
    
    for (const item of orderItems) {
      const sellerId = item.sellerId;
      if (!groups.has(sellerId)) {
        groups.set(sellerId, []);
      }
      groups.get(sellerId)!.push(item);
    }
    
    return groups;
  }

  /**
   * 🆕 Generar PDF de invoice (placeholder - requiere implementación)
   */
  async generateInvoicePDF(invoiceId: string): Promise<string> {
    try {
      this.logger.log(`Generating PDF for invoice ${invoiceId}`);

      // TODO: Implementar generación de PDF
      // Esto requerirá una librería como puppeteer, jsPDF, o similar
      // Por ahora retornamos una URL placeholder

      const invoice = await this.getInvoiceById(invoiceId, 'system', 'ADMIN');
      
      // Placeholder URL - en implementación real sería la URL del PDF generado
      const pdfUrl = `/invoices/${invoiceId}/pdf`;
      
      // Actualizar invoice con URL del PDF
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: { pdfUrl },
      });

      this.logger.log(`PDF generated for invoice ${invoiceId}: ${pdfUrl}`);
      return pdfUrl;
    } catch (error) {
      this.logger.error(`Failed to generate PDF for invoice: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Marcar invoice como pagada automáticamente
   */
  async markInvoiceAsPaid(orderId: string) {
    try {
      this.logger.log(`Marking invoice as paid for order ${orderId}`);

      const updateResult = await this.prisma.invoice.updateMany({
        where: { orderId },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          updatedAt: new Date(),
        },
      });

      this.logger.log(`Marked ${updateResult.count} invoices as paid for order ${orderId}`);
      return updateResult;
    } catch (error) {
      this.logger.error(`Failed to mark invoice as paid: ${error.message}`);
      throw error;
    }
  }
}