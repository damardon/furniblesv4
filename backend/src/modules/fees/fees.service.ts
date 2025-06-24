import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FeeType, ProductCategory } from '@prisma/client';
import { CreatefeeConfigDto, UpdatefeeConfigDto } from './dto/fee-config.dto';

interface feeCalculation {
  type: string;
  description: string;
  amount: number;
  rate?: number;
}

@Injectable()
export class FeesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calcular fees para un carrito
   */
  async calculateFees(
    subtotal: number, 
    items: any[], 
    country?: string,
    paymentMethod?: string
  ): Promise<feeCalculation[]> {
    const fees: feeCalculation[] = [];

    // Obtener configuraciones de fees aplicables
    const feeConfigs = await this.prisma.feeConfig.findMany({
      where: {
        isActive: true,
        OR: [
          { country: null }, // Fees globales
          { country },       // Fees específicos del país
        ]
      },
      orderBy: { priority: 'desc' }
    });

    // Aplicar fee de plataforma (principal)
    const platformfeeConfig = feeConfigs.find(
      config => config.type === FeeType.PLATFORM_FEE && !config.category
    );

    if (platformfeeConfig) {
      const feeAmount = this.calculateFeeAmount(subtotal, platformfeeConfig);
      fees.push({
        type: 'PLATFORM_FEE',
        description: platformfeeConfig.description || 'Fee de plataforma',
        amount: feeAmount,
        rate: platformfeeConfig.isPercentage ? platformfeeConfig.value : undefined
      });
    } else {
      // Fee por defecto si no hay configuración
      const defaultFee = subtotal * 0.10;
      fees.push({
        type: 'PLATFORM_FEE',
        description: 'Fee de plataforma (10%)',
        amount: defaultFee,
        rate: 0.10
      });
    }

    // Aplicar fees por categoría
    for (const item of items) {
      const categoryfeeConfig = feeConfigs.find(
        config => config.type === FeeType.PLATFORM_FEE && 
                 config.category === item.product.category
      );

      if (categoryfeeConfig) {
        const feeAmount = this.calculateFeeAmount(item.currentPrice, categoryfeeConfig);
        fees.push({
          type: 'CATEGORY_FEE',
          description: `Fee categoría ${item.product.category}`,
          amount: feeAmount,
          rate: categoryfeeConfig.isPercentage ? categoryfeeConfig.value : undefined
        });
      }
    }

    // Aplicar fees por método de pago
    if (paymentMethod) {
      const paymentfeeConfig = feeConfigs.find(
        config => config.type === FeeType.PAYMENT_PROCESSING && 
                 config.paymentMethod === paymentMethod
      );

      if (paymentfeeConfig) {
        const feeAmount = this.calculateFeeAmount(subtotal, paymentfeeConfig);
        fees.push({
          type: 'PAYMENT_FEE',
          description: `Fee procesamiento ${paymentMethod}`,
          amount: feeAmount,
          rate: paymentfeeConfig.isPercentage ? paymentfeeConfig.value : undefined
        });
      }
    }

    return fees;
  }

  /**
   * Calcular monto del fee basado en configuración
   */
  private calculateFeeAmount(amount: number, config: any): number {
    let feeAmount = config.isPercentage 
      ? amount * config.value 
      : config.value;

    // Aplicar límites mínimos y máximos
    if (config.minAmount && feeAmount < config.minAmount) {
      feeAmount = config.minAmount;
    }
    if (config.maxAmount && feeAmount > config.maxAmount) {
      feeAmount = config.maxAmount;
    }

    return Math.round(feeAmount * 100) / 100; // Redondear a 2 decimales
  }

  /**
   * Crear configuración de fee
   */
  async createfeeConfig(dto: CreatefeeConfigDto) {
    return this.prisma.feeConfig.create({
      data: dto
    });
  }

  /**
   * Obtener configuraciones de fees
   */
  async getfeeConfigs(country?: string, isActive?: boolean) {
    return this.prisma.feeConfig.findMany({
      where: {
        ...(country && { 
          OR: [
            { country },
            { country: null }
          ]
        }),
        ...(isActive !== undefined && { isActive })
      },
      orderBy: { priority: 'desc' }
    });
  }

  /**
   * Actualizar configuración de fee
   */
  async updatefeeConfig(id: string, dto: UpdatefeeConfigDto) {
    return this.prisma.feeConfig.update({
      where: { id },
      data: dto
    });
  }

  /**
   * Eliminar configuración de fee
   */
  async deletefeeConfig(id: string) {
    return this.prisma.feeConfig.delete({
      where: { id }
    });
  }
}