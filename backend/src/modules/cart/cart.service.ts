import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ForbiddenException 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FeesService } from '../fees/fees.service';
import { TranslationHelper } from '../../common/helpers/translation.helper';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { CartResponseDto } from './dto/cart-response.dto';
import { UserRole, ProductStatus } from '@prisma/client';
import { SyncCartDto } from './dto/sync-cart.dto';

@Injectable()
export class CartService {
  constructor(
    private prisma: PrismaService,
    private feesService: FeesService,
  ) {}

  /**
   * Agregar producto al carrito
   */
  async addToCart(userId: string, dto: AddToCartDto, lang = 'en'): Promise<CartResponseDto> {
    // Verificar que el usuario sea BUYER
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { buyerProfile: true }
    });

    if (!user || !user.buyerProfile) {
      throw new ForbiddenException(
        TranslationHelper.t('cart.buyerOnly', lang)
      );
    }

    // Verificar que el producto existe y está disponible
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { seller: true }
    });

    if (!product) {
      throw new NotFoundException(
        TranslationHelper.t('products.notFound', lang)
      );
    }

    if (product.status !== ProductStatus.APPROVED) {
      throw new BadRequestException(
        TranslationHelper.t('products.notAvailable', lang)
      );
    }

    if (product.sellerId === userId) {
      throw new BadRequestException(
        TranslationHelper.t('cart.ownProduct', lang)
      );
    }

    // Verificar límite de productos en carrito (10 máximo)
    const currentCartCount = await this.prisma.cartItem.count({
      where: { userId }
    });

    if (currentCartCount >= 10) {
      throw new BadRequestException(
        TranslationHelper.t('cart.limitExceeded', lang)
      );
    }

    // Verificar si el producto ya está en el carrito
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId: dto.productId
        }
      }
    });

    if (existingItem) {
      throw new BadRequestException(
        TranslationHelper.t('cart.alreadyExists', lang)
      );
    }

    // Agregar al carrito
    await this.prisma.cartItem.create({
      data: {
        userId,
        productId: dto.productId,
        priceSnapshot: product.price,
        quantity: 1 // Siempre 1 para productos digitales
      }
    });

    // Retornar carrito actualizado
    return this.getCart(userId, lang);
  }

  /**
   * Obtener carrito del usuario - CORREGIDO
   */
  async getCart(userId: string, lang = 'en'): Promise<CartResponseDto> {
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            seller: {
              include: {
                sellerProfile: true
              }
            }
          }
        }
      },
      orderBy: { addedAt: 'desc' }
    });

    // Filtrar productos que ya no existen o no están disponibles
    const validItems = cartItems.filter(item => 
      item.product && 
      item.product.status === ProductStatus.APPROVED
    );

    // Eliminar items inválidos del carrito
    const invalidItemIds = cartItems
      .filter(item => !validItems.includes(item))
      .map(item => item.id);

    if (invalidItemIds.length > 0) {
      await this.prisma.cartItem.deleteMany({
        where: { id: { in: invalidItemIds } }
      });
    }

    // Helper function para obtener imagen del producto
    const getProductImage = async (product: any): Promise<string | undefined> => {
      try {
        const imageFileIds = JSON.parse(product.imageFileIds || '[]');
        if (imageFileIds.length > 0) {
          const imageFile = await this.prisma.file.findFirst({
            where: { 
              id: { in: imageFileIds },
              type: 'IMAGE',
              status: 'ACTIVE'
            }
          });
          return imageFile?.url;
        }
      } catch (error) {
        console.warn('Error parsing imageFileIds:', error);
      }
      return undefined;
    };

    // Preparar respuesta con imágenes
    const items = await Promise.all(validItems.map(async (item) => {
      const imageUrl = await getProductImage(item.product);
      
      return {
        id: item.id,
        productId: item.productId,
        productTitle: item.product.title,
        productSlug: item.product.slug,
        priceSnapshot: item.priceSnapshot,
        currentPrice: item.product.price,
        quantity: item.quantity,
        addedAt: item.addedAt,
        seller: {
          id: item.product.seller.id,
          name: `${item.product.seller.firstName} ${item.product.seller.lastName}`,
          storeName: item.product.seller.sellerProfile?.storeName || 'Tienda'
        },
        product: {
          id: item.product.id,
          title: item.product.title,
          slug: item.product.slug,
          price: item.product.price,
          category: item.product.category,
          status: item.product.status,
          imageUrl
        }
      };
    }));

    // Calcular totales
    const subtotal = items.reduce((sum, item) => sum + item.currentPrice, 0);
    const feeBreakdown = await this.feesService.calculateFees(subtotal, items);
    const platformFee = feeBreakdown.reduce((sum, fee) => sum + fee.amount, 0);
    const totalAmount = subtotal + platformFee;

    return {
      items,
      summary: {
        subtotal,
        platformFeeRate: feeBreakdown.find(f => f.type === 'PLATFORM_FEE')?.rate || 0.10,
        platformFee,
        totalAmount,
        itemCount: items.length,
        feeBreakdown
      },
      userId,
      updatedAt: new Date()
    };
  }

  /**
   * Remover producto del carrito
   */
  async removeFromCart(userId: string, cartItemId: string, lang = 'en'): Promise<CartResponseDto> {
    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        userId
      }
    });

    if (!cartItem) {
      throw new NotFoundException(
        TranslationHelper.t('cart.itemNotFound', lang)
      );
    }

    await this.prisma.cartItem.delete({
      where: { id: cartItemId }
    });

    return this.getCart(userId, lang);
  }

  /**
   * Limpiar carrito completo
   */
  async clearCart(userId: string, lang = 'en'): Promise<void> {
    await this.prisma.cartItem.deleteMany({
      where: { userId }
    });
  }

  /**
   * Migrar carrito temporal desde localStorage
   */
  async migrateTemporaryCart(userId: string, temporaryItems: any[], lang = 'en'): Promise<CartResponseDto> {
    if (!temporaryItems || temporaryItems.length === 0) {
      return this.getCart(userId, lang);
    }

    // Obtener carrito actual
    const existingCart = await this.getCart(userId, lang);
    const existingProductIds = existingCart.items.map(item => item.productId);

    // Filtrar productos que no están ya en el carrito
    const newProductIds = temporaryItems
      .filter(item => !existingProductIds.includes(item.productId))
      .slice(0, 10 - existingCart.items.length) // Respetar límite de 10
      .map(item => item.productId);

    // Validar productos y agregarlos
    for (const productId of newProductIds) {
      try {
        await this.addToCart(userId, { productId }, lang);
      } catch (error) {
        // Ignorar errores individuales para no fallar toda la migración
        console.warn(`Failed to migrate product ${productId}:`, error.message);
      }
    }

    return this.getCart(userId, lang);
  }

  /**
   * Actualizar precios en carrito cuando el seller cambia precios
   */
  async updateCartPrices(productId: string, newPrice: number): Promise<void> {
    await this.prisma.cartItem.updateMany({
      where: { productId },
      data: { priceSnapshot: newPrice }
    });
  }

  /**
   * Limpiar carritos abandonados (Cron Job)
   */
  async cleanupAbandonedCarts(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.prisma.cartItem.deleteMany({
      where: {
        addedAt: {
          lt: thirtyDaysAgo
        }
      }
    });

    return result.count;
  }

  
  /**
 * Sincronizar carrito desde el cliente
 * Útil para sincronizar el carrito después del login o entre dispositivos
 */
async syncCart(userId: string, dto: SyncCartDto, lang = 'en'): Promise<CartResponseDto> {
  // Verificar que el usuario sea BUYER
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    include: { buyerProfile: true }
  });

  if (!user || !user.buyerProfile) {
    throw new ForbiddenException(
      TranslationHelper.t('cart.buyerOnly', lang)
    );
  }

  // Obtener carrito actual del servidor
  const currentCart = await this.getCart(userId, lang);
  const currentProductIds = currentCart.items.map(item => item.productId);

  // Filtrar items del cliente que no están en el servidor
  const newItems = dto.items.filter(clientItem => 
    !currentProductIds.includes(clientItem.productId)
  );

  // Limitar items nuevos para no exceder el límite de 10
  const availableSlots = 10 - currentCart.items.length;
  const itemsToSync = newItems.slice(0, availableSlots);

  // Validar y agregar productos nuevos
  const syncResults = [];
  for (const item of itemsToSync) {
    try {
      // Verificar que el producto existe y está disponible
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        include: { seller: true }
      });

      if (!product) {
        syncResults.push({
          productId: item.productId,
          success: false,
          error: 'Product not found'
        });
        continue;
      }

      if (product.status !== ProductStatus.APPROVED) {
        syncResults.push({
          productId: item.productId,
          success: false,
          error: 'Product not available'
        });
        continue;
      }

      if (product.sellerId === userId) {
        syncResults.push({
          productId: item.productId,
          success: false,
          error: 'Cannot add own product'
        });
        continue;
      }

      // Agregar al carrito usando el precio actual del producto
      await this.prisma.cartItem.create({
        data: {
          userId,
          productId: item.productId,
          priceSnapshot: product.price, // Usar precio actual, no el del cliente
          quantity: 1 // Siempre 1 para productos digitales
        }
      });

      syncResults.push({
        productId: item.productId,
        success: true,
        error: null
      });

    } catch (error) {
      syncResults.push({
        productId: item.productId,
        success: false,
        error: error.message
      });
    }
  }

  // Retornar carrito actualizado con resultados de sincronización
  const updatedCart = await this.getCart(userId, lang);
  
  return {
    ...updatedCart,
    syncResults: {
      totalItemsReceived: dto.items.length,
      itemsAlreadyInCart: dto.items.length - newItems.length,
      itemsSynced: syncResults.filter(r => r.success).length,
      itemsSkipped: syncResults.filter(r => !r.success).length,
      availableSlots: availableSlots,
      results: syncResults
    }
  };
}
}