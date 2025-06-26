// src/modules/fees/fees.service.ts - VERSIÓN CORREGIDA COMPLETA

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FeeType, ProductCategory } from '@prisma/client';

interface FeeCalculation {
  type: string;
  description: string;
  amount: number;
  rate?: number;
}

// Interfaces para Etapa 8
export interface FeeCalculationInput {
  amount: number;
  country?: string;
  category?: string;
  paymentMethod?: string;
  sellerTier?: string;
}

export interface SellerFeeCalculationInput extends FeeCalculationInput {
  sellerId: string;
}

export interface FeeCalculationResult {
  platformFee: number;
  stripeFee: number;
  sellerEarning: number;
  feeBreakdown: FeeBreakdownItem[];
}

export interface FeeBreakdownItem {
  name: string;
  type: string;
  amount: number;
  percentage?: number;
  description?: string;
}

@Injectable()
export class FeesService {
  private readonly logger = new Logger(FeesService.name);
  
  // Cache para configuraciones de fees
  private feeConfigCache = new Map<string, any>();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutos
  private lastCacheUpdate = 0;

  constructor(private prisma: PrismaService) {}

  /**
   * Calcular fees (método original de Etapa 7)
   */
  async calculateFees(subtotal: number, items: any[], country?: string, paymentMethod?: string): Promise<FeeCalculation[]> {
    const fees: FeeCalculation[] = [];

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
    const platformFeeConfig = feeConfigs.find(
      config => config.type === FeeType.PLATFORM_FEE && !config.category
    );

    if (platformFeeConfig) {
      const feeAmount = this.calculateFeeAmount(subtotal, platformFeeConfig);
      fees.push({
        type: 'PLATFORM_FEE',
        description: platformFeeConfig.description || 'Fee de plataforma',
        amount: feeAmount,
        rate: platformFeeConfig.isPercentage ? platformFeeConfig.value : undefined
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
      const categoryFeeConfig = feeConfigs.find(
        config => config.type === FeeType.PLATFORM_FEE && 
                 config.category === item.product.category
      );

      if (categoryFeeConfig) {
        const feeAmount = this.calculateFeeAmount(item.currentPrice, categoryFeeConfig);
        fees.push({
          type: 'CATEGORY_FEE',
          description: `Fee categoría ${item.product.category}`,
          amount: feeAmount,
          rate: categoryFeeConfig.isPercentage ? categoryFeeConfig.value : undefined
        });
      }
    }

    // Aplicar fees por método de pago
    if (paymentMethod) {
      const paymentFeeConfig = feeConfigs.find(
        config => config.type === FeeType.PAYMENT_PROCESSING && 
                 config.paymentMethod === paymentMethod
      );

      if (paymentFeeConfig) {
        const feeAmount = this.calculateFeeAmount(subtotal, paymentFeeConfig);
        fees.push({
          type: 'PAYMENT_FEE',
          description: `Fee procesamiento ${paymentMethod}`,
          amount: feeAmount,
          rate: paymentFeeConfig.isPercentage ? paymentFeeConfig.value : undefined
        });
      }
    }

    return fees;
  }

  /**
   * Calcular fees específicos para un seller (Etapa 8)
   */
  async calculateFeesForSeller(input: SellerFeeCalculationInput): Promise<FeeCalculationResult> {
    const { sellerId, amount, country, category, paymentMethod } = input;

    // Obtener información del seller
    const seller = await this.prisma.user.findUnique({
      where: { id: sellerId },
      include: {
        sellerProfile: true,
        transactions: {
          where: { type: 'SALE', status: 'COMPLETED' },
          select: { amount: true }
        }
      }
    });

    if (!seller) {
      throw new Error(`Seller ${sellerId} not found`);
    }

    // Determinar tier del seller basado en ventas
    const sellerTier = this.determineSellerTier(seller);

    // Calcular fees con tier específico
    return this.calculateAdvancedFees({
      amount,
      country,
      category,
      paymentMethod,
      sellerTier
    });
  }

  /**
   * Calcular fees avanzados (método principal Etapa 8)
   */
  async calculateAdvancedFees(input: FeeCalculationInput): Promise<FeeCalculationResult> {
    const { amount, country, category, paymentMethod, sellerTier } = input;

    // Obtener configuraciones de fees aplicables
    const feeConfigs = await this.getApplicableFeeConfigs({
      country,
      category,
      paymentMethod,
      sellerTier
    });

    let platformFee = 0;
    let stripeFee = 0;
    const feeBreakdown: FeeBreakdownItem[] = [];

    // Aplicar cada configuración de fee
    for (const config of feeConfigs) {
      const feeAmount = this.calculateIndividualFee(amount, config);
      
      if (config.type === 'PLATFORM_FEE') {
        platformFee += feeAmount;
      } else if (config.type === 'PAYMENT_PROCESSING') {
        stripeFee += feeAmount;
      }

      // Agregar al breakdown si el fee es significativo
      if (feeAmount > 0.01) {
        feeBreakdown.push({
          name: config.name,
          type: config.type,
          amount: feeAmount,
          percentage: config.isPercentage ? config.value * 100 : undefined,
          description: config.description
        });
      }
    }

    // Aplicar fee base si no hay configuración específica
    if (platformFee === 0) {
      platformFee = amount * 0.10; // 10% default
      feeBreakdown.push({
        name: 'Platform Fee (Default)',
        type: 'PLATFORM_FEE',
        amount: platformFee,
        percentage: 10,
        description: 'Default platform fee'
      });
    }

    // Calcular Stripe fee si no está configurado
    if (stripeFee === 0) {
      stripeFee = this.calculateStripeFee(amount, paymentMethod);
      feeBreakdown.push({
        name: 'Stripe Processing Fee',
        type: 'PAYMENT_PROCESSING',
        amount: stripeFee,
        description: 'Stripe payment processing fee'
      });
    }

    const sellerEarning = amount - platformFee - stripeFee;

    this.logger.log(`Fee calculation completed`, {
      amount,
      platformFee,
      stripeFee,
      sellerEarning,
      country,
      category,
      sellerTier
    });

    return {
      platformFee: Number(platformFee.toFixed(2)),
      stripeFee: Number(stripeFee.toFixed(2)),
      sellerEarning: Number(sellerEarning.toFixed(2)),
      feeBreakdown
    };
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
   * Calcular fee individual (método mejorado para Etapa 8)
   */
  private calculateIndividualFee(amount: number, config: any): number {
    let fee = 0;

    if (config.isPercentage) {
      fee = amount * config.value;
    } else {
      fee = config.value;
    }

    // Aplicar límites mínimos y máximos
    if (config.minAmount && fee < config.minAmount) {
      fee = config.minAmount;
    }

    if (config.maxAmount && fee > config.maxAmount) {
      fee = config.maxAmount;
    }

    return fee;
  }

  /**
   * Determinar tier del seller basado en métricas
   */
  private determineSellerTier(seller: any): string {
    const totalSales = seller.transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const salesCount = seller.transactions?.length || 0;

    if (totalSales >= 10000 && salesCount >= 100) {
      return 'PLATINUM';
    } else if (totalSales >= 5000 && salesCount >= 50) {
      return 'GOLD';
    } else if (totalSales >= 1000 && salesCount >= 10) {
      return 'SILVER';
    } else {
      return 'BRONZE';
    }
  }

  /**
   * Obtener configuraciones de fees aplicables con cache
   */
  private async getApplicableFeeConfigs(criteria: {
    country?: string;
    category?: string;
    paymentMethod?: string;
    sellerTier?: string;
  }): Promise<any[]> {
    // Verificar cache
    const cacheKey = JSON.stringify(criteria);
    const now = Date.now();
    
    if (this.feeConfigCache.has(cacheKey) && (now - this.lastCacheUpdate) < this.cacheExpiry) {
      return this.feeConfigCache.get(cacheKey);
    }

    // Construir query con filtros dinámicos
    const where: any = {
      isActive: true,
      OR: []
    };

    // Configuraciones globales (sin criterios específicos)
    where.OR.push({
      country: null,
      category: null,
      paymentMethod: null,
      sellerTier: null
    });

    // Configuraciones específicas por país
    if (criteria.country) {
      where.OR.push({ country: criteria.country });
    }

    // Configuraciones específicas por categoría
    if (criteria.category) {
      where.OR.push({ category: criteria.category });
    }

    // Configuraciones específicas por método de pago
    if (criteria.paymentMethod) {
      where.OR.push({ paymentMethod: criteria.paymentMethod });
    }

    // Configuraciones específicas por tier de seller
    if (criteria.sellerTier) {
      where.OR.push({ sellerTier: criteria.sellerTier });
    }

    const configs = await this.prisma.feeConfig.findMany({
      where,
      orderBy: { priority: 'desc' } // Mayor prioridad primero
    });

    // Resolver conflictos por prioridad
    const resolvedConfigs = this.resolveFeeConflicts(configs, criteria);

    // Actualizar cache
    this.feeConfigCache.set(cacheKey, resolvedConfigs);
    this.lastCacheUpdate = now;

    return resolvedConfigs;
  }

  /**
   * Resolver conflictos entre configuraciones de fees
   */
  private resolveFeeConflicts(configs: any[], criteria: any): any[] {
    const configsByType = new Map<string, any[]>();

    // Agrupar por tipo
    configs.forEach(config => {
      if (!configsByType.has(config.type)) {
        configsByType.set(config.type, []);
      }
      configsByType.get(config.type).push(config);
    });

    const resolvedConfigs: any[] = [];

    // Para cada tipo, elegir la configuración más específica
    configsByType.forEach((typeConfigs, type) => {
      const mostSpecific = this.findMostSpecificConfig(typeConfigs, criteria);
      if (mostSpecific) {
        resolvedConfigs.push(mostSpecific);
      }
    });

    return resolvedConfigs;
  }

  /**
   * Encontrar la configuración más específica para un tipo
   */
  private findMostSpecificConfig(configs: any[], criteria: any): any | null {
    let mostSpecific = null;
    let maxSpecificity = -1;

    configs.forEach(config => {
      const specificity = this.calculateSpecificity(config, criteria);
      if (specificity > maxSpecificity) {
        maxSpecificity = specificity;
        mostSpecific = config;
      }
    });

    return mostSpecific;
  }

  /**
   * Calcular especificidad de una configuración
   */
  private calculateSpecificity(config: any, criteria: any): number {
    let specificity = 0;

    // +4 por match exacto de seller tier
    if (config.sellerTier && config.sellerTier === criteria.sellerTier) {
      specificity += 4;
    }

    // +3 por match exacto de país
    if (config.country && config.country === criteria.country) {
      specificity += 3;
    }

    // +2 por match exacto de categoría
    if (config.category && config.category === criteria.category) {
      specificity += 2;
    }

    // +1 por match exacto de método de pago
    if (config.paymentMethod && config.paymentMethod === criteria.paymentMethod) {
      specificity += 1;
    }

    // Penalizar configuraciones globales (sin criterios específicos)
    if (!config.country && !config.category && !config.paymentMethod && !config.sellerTier) {
      specificity = 0;
    }

    return specificity;
  }

  /**
   * Calcular fee de Stripe basado en método de pago
   */
  private calculateStripeFee(amount: number, paymentMethod?: string): number {
    // Fees de Stripe (aproximados)
    const stripeFees = {
      'card': 0.029 + 0.30, // 2.9% + $0.30
      'card_international': 0.039 + 0.30, // 3.9% + $0.30
      'bancontact': 0.014, // 1.4%
      'ideal': 0.008, // 0.8%
      'sepa_debit': 0.008, // 0.8%
      'default': 0.029 + 0.30 // Default to card
    };

    const feeStructure = stripeFees[paymentMethod] || stripeFees.default;
    
    if (typeof feeStructure === 'number') {
      return amount * feeStructure;
    } else {
      // Para estructura con fee fijo + porcentaje
      return (amount * 0.029) + 0.30;
    }
  }

  /**
   * Crear configuración de fee personalizada
   */
  async createFeeConfig(config: {
    name: string;
    type: 'PLATFORM_FEE' | 'PAYMENT_PROCESSING' | 'TAX' | 'REGIONAL_FEE';
    country?: string;
    category?: string;
    paymentMethod?: string;
    sellerTier?: string;
    isPercentage: boolean;
    value: number;
    minAmount?: number;
    maxAmount?: number;
    priority?: number;
    description?: string;
    validFrom?: Date;
    validUntil?: Date;
  }): Promise<any> {
    const feeConfig = await this.prisma.feeConfig.create({
      data: {
        name: config.name,
        type: config.type as any, // Cast para evitar problemas de tipos
        country: config.country || null,
        category: config.category as any,
        paymentMethod: config.paymentMethod || null,
        sellerTier: config.sellerTier || null,
        isPercentage: config.isPercentage,
        value: config.value,
        minAmount: config.minAmount || null,
        maxAmount: config.maxAmount || null,
        priority: config.priority || 100,
        description: config.description || null,
        validFrom: config.validFrom || null,
        validUntil: config.validUntil || null,
        isActive: true
      }
    });

    // Limpiar cache
    this.clearFeeCache();

    this.logger.log(`Fee config created: ${feeConfig.name}`, {
      id: feeConfig.id,
      type: feeConfig.type,
      value: feeConfig.value
    });

    return feeConfig;
  }

  /**
   * Obtener configuraciones de fees
   */
  async getFeeConfigs(filters?: {
    type?: string;
    country?: string;
    category?: string;
    isActive?: boolean;
  }): Promise<any[]> {
    const where: any = {};

    if (filters?.type) where.type = filters.type;
    if (filters?.country) where.country = filters.country;
    if (filters?.category) where.category = filters.category;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    return this.prisma.feeConfig.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });
  }

  /**
   * Actualizar configuración de fee
   */
  async updateFeeConfig(id: string, updates: any): Promise<any> {
    // Filtrar solo campos válidos y convertir tipos si es necesario
    const validUpdates: any = {};
    
    if (updates.name !== undefined) validUpdates.name = updates.name;
    if (updates.type !== undefined) validUpdates.type = updates.type;
    if (updates.country !== undefined) validUpdates.country = updates.country;
    if (updates.category !== undefined) validUpdates.category = updates.category;
    if (updates.paymentMethod !== undefined) validUpdates.paymentMethod = updates.paymentMethod;
    if (updates.sellerTier !== undefined) validUpdates.sellerTier = updates.sellerTier;
    if (updates.isPercentage !== undefined) validUpdates.isPercentage = updates.isPercentage;
    if (updates.value !== undefined) validUpdates.value = updates.value;
    if (updates.minAmount !== undefined) validUpdates.minAmount = updates.minAmount;
    if (updates.maxAmount !== undefined) validUpdates.maxAmount = updates.maxAmount;
    if (updates.priority !== undefined) validUpdates.priority = updates.priority;
    if (updates.description !== undefined) validUpdates.description = updates.description;
    if (updates.validFrom !== undefined) validUpdates.validFrom = updates.validFrom;
    if (updates.validUntil !== undefined) validUpdates.validUntil = updates.validUntil;
    if (updates.isActive !== undefined) validUpdates.isActive = updates.isActive;

    const feeConfig = await this.prisma.feeConfig.update({
      where: { id },
      data: validUpdates
    });

    this.clearFeeCache();

    this.logger.log(`Fee config updated: ${feeConfig.name}`, {
      id: feeConfig.id,
      updates: Object.keys(validUpdates)
    });

    return feeConfig;
  }

  /**
   * Desactivar configuración de fee
   */
  async deactivateFeeConfig(id: string): Promise<void> {
    await this.prisma.feeConfig.update({
      where: { id },
      data: { isActive: false }
    });

    this.clearFeeCache();

    this.logger.log(`Fee config deactivated: ${id}`);
  }

  /**
   * Limpiar cache de fees
   */
  private clearFeeCache(): void {
    this.feeConfigCache.clear();
    this.lastCacheUpdate = 0;
    this.logger.log('Fee cache cleared');
  }

  /**
   * Validar configuración de fee
   */
  validateFeeConfig(config: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.name || config.name.trim().length === 0) {
      errors.push('Name is required');
    }

    if (!config.type || !['PLATFORM_FEE', 'PAYMENT_PROCESSING', 'TAX', 'REGIONAL_FEE'].includes(config.type)) {
      errors.push('Valid type is required');
    }

    if (typeof config.value !== 'number' || config.value < 0) {
      errors.push('Value must be a positive number');
    }

    if (config.isPercentage && config.value > 1) {
      errors.push('Percentage value should be between 0 and 1 (e.g., 0.10 for 10%)');
    }

    if (config.minAmount && config.maxAmount && config.minAmount > config.maxAmount) {
      errors.push('Minimum amount cannot be greater than maximum amount');
    }

    if (config.validFrom && config.validUntil && config.validFrom > config.validUntil) {
      errors.push('Valid from date cannot be after valid until date');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}