// src/modules/cart/cart.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Headers,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiHeader
} from '@nestjs/swagger';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { CartResponseDto } from './dto/cart-response.dto';
import { UserRole } from '@prisma/client';

@ApiTags('Cart')
@Controller('cart')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('add')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.BUYER)
  @ApiOperation({ 
    summary: 'Agregar producto al carrito',
    description: 'Agrega un producto al carrito del usuario. Solo usuarios BUYER pueden usar esta funcionalidad.'
  })
  @ApiHeader({
    name: 'accept-language',
    description: 'Idioma preferido (en, es)',
    required: false,
    example: 'es'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Producto agregado exitosamente',
    type: CartResponseDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Error de validación (carrito lleno, producto ya existe, etc.)' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Solo compradores pueden agregar productos al carrito' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Producto no encontrado' 
  })
  async addToCart(
    @Request() req,
    @Body() dto: AddToCartDto,
    @Headers('accept-language') acceptLanguage?: string
  ): Promise<CartResponseDto> {
    const lang = this.detectLanguage(acceptLanguage);
    return this.cartService.addToCart(req.user.id, dto, lang);
  }

  @Get()
  @Roles(UserRole.BUYER)
  @ApiOperation({ 
    summary: 'Obtener carrito del usuario',
    description: 'Retorna el carrito actual del usuario con totales calculados y productos válidos.'
  })
  @ApiHeader({
    name: 'accept-language',
    description: 'Idioma preferido (en, es)',
    required: false,
    example: 'es'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Carrito obtenido exitosamente',
    type: CartResponseDto 
  })
  async getCart(
    @Request() req,
    @Headers('accept-language') acceptLanguage?: string
  ): Promise<CartResponseDto> {
    const lang = this.detectLanguage(acceptLanguage);
    return this.cartService.getCart(req.user.id, lang);
  }

  @Delete('items/:itemId')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.BUYER)
  @ApiOperation({ 
    summary: 'Remover producto del carrito',
    description: 'Elimina un producto específico del carrito del usuario.'
  })
  @ApiParam({ 
    name: 'itemId', 
    description: 'ID del item en el carrito' 
  })
  @ApiHeader({
    name: 'accept-language',
    description: 'Idioma preferido (en, es)',
    required: false,
    example: 'es'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Producto removido exitosamente',
    type: CartResponseDto 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Item no encontrado en el carrito' 
  })
  async removeFromCart(
    @Request() req,
    @Param('itemId') itemId: string,
    @Headers('accept-language') acceptLanguage?: string
  ): Promise<CartResponseDto> {
    const lang = this.detectLanguage(acceptLanguage);
    return this.cartService.removeFromCart(req.user.id, itemId, lang);
  }

  @Delete('clear')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.BUYER)
  @ApiOperation({ 
    summary: 'Limpiar carrito completo',
    description: 'Elimina todos los productos del carrito del usuario.'
  })
  @ApiHeader({
    name: 'accept-language',
    description: 'Idioma preferido (en, es)',
    required: false,
    example: 'es'
  })
  @ApiResponse({ 
    status: 204, 
    description: 'Carrito limpiado exitosamente' 
  })
  async clearCart(
    @Request() req,
    @Headers('accept-language') acceptLanguage?: string
  ): Promise<void> {
    const lang = this.detectLanguage(acceptLanguage);
    return this.cartService.clearCart(req.user.id, lang);
  }

  @Post('migrate')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.BUYER)
  @ApiOperation({ 
    summary: 'Migrar carrito temporal',
    description: 'Migra productos del carrito temporal (localStorage) al carrito persistente después del login.'
  })
  @ApiHeader({
    name: 'accept-language',
    description: 'Idioma preferido (en, es)',
    required: false,
    example: 'es'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Carrito migrado exitosamente',
    type: CartResponseDto 
  })
  async migrateTemporaryCart(
    @Request() req,
    @Body() temporaryItems: any[],
    @Headers('accept-language') acceptLanguage?: string
  ): Promise<CartResponseDto> {
    const lang = this.detectLanguage(acceptLanguage);
    return this.cartService.migrateTemporaryCart(req.user.id, temporaryItems, lang);
  }

  /**
   * Detectar idioma del header Accept-Language
   * @param acceptLanguage Header Accept-Language
   * @returns 'es' o 'en'
   */
  private detectLanguage(acceptLanguage?: string): string {
    if (!acceptLanguage) return 'en';
    
    // Detectar español en varios formatos
    const spanishPatterns = ['es', 'es-', 'spanish', 'español'];
    const lowerLang = acceptLanguage.toLowerCase();
    
    return spanishPatterns.some(pattern => lowerLang.includes(pattern)) ? 'es' : 'en';
  }
}