// src/modules/products/products.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductFiltersDto } from './dto/product-filters.dto';
import { ProductResponseDto, PaginatedProductsDto } from './dto/product-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '@prisma/client';
import { plainToClass } from 'class-transformer';

interface JwtUser {
  id: string;
  email: string;
  role: UserRole;
}

@ApiTags('Products')
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo producto' })
  @ApiResponse({
    status: 201,
    description: 'Producto creado exitosamente',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiBearerAuth()
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() user: JwtUser,
  ) {
    const product = await this.productsService.create(user.id, createProductDto);
    return plainToClass(ProductResponseDto, product, {
      excludeExtraneousValues: false,
    });
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Listar productos públicos (aprobados)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de productos',
    type: PaginatedProductsDto,
  })
  @ApiQuery({ name: 'q', required: false, description: 'Búsqueda en título y descripción' })
  @ApiQuery({ name: 'category', required: false, description: 'Filtrar por categoría' })
  @ApiQuery({ name: 'difficulty', required: false, description: 'Filtrar por dificultad' })
  @ApiQuery({ name: 'priceMin', required: false, description: 'Precio mínimo' })
  @ApiQuery({ name: 'priceMax', required: false, description: 'Precio máximo' })
  @ApiQuery({ name: 'tags', required: false, description: 'Filtrar por tags' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Ordenar por' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Elementos por página' })
  async findAll(
    @Query() filters: ProductFiltersDto,
    @CurrentUser() user?: JwtUser,
  ) {
    const result = await this.productsService.findAll(filters);
    return {
      ...result,
      data: result.data.map(product =>
        plainToClass(ProductResponseDto, product, {
          excludeExtraneousValues: false,
        }),
      ),
    };
  }

  @Get('search')
  @Public()
  @ApiOperation({ summary: 'Búsqueda avanzada de productos' })
  @ApiResponse({
    status: 200,
    description: 'Resultados de búsqueda',
    type: PaginatedProductsDto,
  })
  async search(@Query() filters: ProductFiltersDto) {
    const result = await this.productsService.findAll(filters);
    return {
      ...result,
      data: result.data.map(product =>
        plainToClass(ProductResponseDto, product, {
          excludeExtraneousValues: false,
        }),
      ),
    };
  }

  @Get('my')
  @ApiOperation({ summary: 'Obtener mis productos (seller)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de productos del usuario',
    type: PaginatedProductsDto,
  })
  @ApiBearerAuth()
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async findMyProducts(
    @Query() filters: ProductFiltersDto,
    @CurrentUser() user: JwtUser,
  ) {
    const result = await this.productsService.findMyProducts(user.id, filters);
    return result;
  }

  @Get('pending')
  @ApiOperation({ summary: 'Obtener productos pendientes de moderación (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de productos pendientes',
    type: PaginatedProductsDto,
  })
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  async findPendingProducts(@Query() filters: ProductFiltersDto) {
    const pendingFilters = { ...filters, status: 'PENDING' as any };
    const result = await this.productsService.findAll(pendingFilters);
    return result;
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Obtener producto por ID' })
  @ApiResponse({
    status: 200,
    description: 'Detalle del producto',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user?: JwtUser,
  ) {
    const product = await this.productsService.findOne(id, user?.id);
    return plainToClass(ProductResponseDto, product, {
      excludeExtraneousValues: false,
    });
  }

  @Get('slug/:slug')
  @Public()
  @ApiOperation({ summary: 'Obtener producto por slug' })
  @ApiResponse({
    status: 200,
    description: 'Detalle del producto',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async findBySlug(
    @Param('slug') slug: string,
    @CurrentUser() user?: JwtUser,
  ) {
    const product = await this.productsService.findBySlug(slug, user?.id);
    return plainToClass(ProductResponseDto, product, {
      excludeExtraneousValues: false,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar producto' })
  @ApiResponse({
    status: 200,
    description: 'Producto actualizado',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 403, description: 'No autorizado para editar' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiBearerAuth()
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() user: JwtUser,
  ) {
    const product = await this.productsService.update(
      id,
      updateProductDto,
      user.id,
      user.role,
    );
    return plainToClass(ProductResponseDto, product, {
      excludeExtraneousValues: false,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar producto' })
  @ApiResponse({ status: 204, description: 'Producto eliminado' })
  @ApiResponse({ status: 403, description: 'No autorizado para eliminar' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiResponse({ status: 409, description: 'Producto tiene órdenes asociadas' })
  @ApiBearerAuth()
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtUser,
  ) {
    await this.productsService.remove(id, user.id, user.role);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publicar producto (DRAFT -> PENDING)' })
  @ApiResponse({
    status: 200,
    description: 'Producto enviado para moderación',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 400, description: 'No se puede publicar el producto' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiBearerAuth()
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async publish(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtUser,
  ) {
    const product = await this.productsService.publish(id, user.id);
    return plainToClass(ProductResponseDto, product, {
      excludeExtraneousValues: false,
    });
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Aprobar producto (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Producto aprobado',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 400, description: 'No se puede aprobar el producto' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  async approve(@Param('id', ParseUUIDPipe) id: string) {
    const product = await this.productsService.approve(id);
    return plainToClass(ProductResponseDto, product, {
      excludeExtraneousValues: false,
    });
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Rechazar producto (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Producto rechazado',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 400, description: 'No se puede rechazar el producto' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason?: string,
  ) {
    const product = await this.productsService.reject(id, reason);
    return plainToClass(ProductResponseDto, product, {
      excludeExtraneousValues: false,
    });
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Obtener estadísticas del producto' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas del producto',
    schema: {
      type: 'object',
      properties: {
        viewCount: { type: 'number' },
        downloadCount: { type: 'number' },
        favoriteCount: { type: 'number' },
        rating: { type: 'number' },
        reviewCount: { type: 'number' },
      },
    },
  })
  @ApiBearerAuth()
  async getStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.getProductStats(id);
  }
}