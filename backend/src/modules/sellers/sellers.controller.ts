import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { SellersService } from './sellers.service';
import {
  SellerProfile,
  Prisma,
  ProductCategory,
  Difficulty,
} from '@prisma/client';

@ApiTags('sellers')
@Controller('sellers')
export class SellersController {
  private readonly logger = new Logger(SellersController.name);
  constructor(private readonly sellersService: SellersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new seller' })
  @ApiResponse({ status: 201, description: 'Seller created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() createSellerDto: Prisma.SellerProfileCreateInput) {
    return this.sellersService.create(createSellerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sellers with pagination and stats' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term',
  })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const query = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      search,
    };
    return this.sellersService.findAll(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get seller by slug' })
  @ApiParam({ name: 'slug', description: 'Seller slug' })
  @ApiResponse({ status: 200, description: 'Seller found' })
  @ApiResponse({ status: 404, description: 'Seller not found' })
  async findBySlug(@Param('slug') slug: string) {
    const seller = await this.sellersService.findBySlug(slug);
    if (!seller) {
      throw new NotFoundException(`Seller with slug "${slug}" not found`);
    }
    return seller;
  }

  @Get(':slug/products')
  @ApiOperation({ summary: 'Get products from a specific seller' })
  @ApiParam({ name: 'slug', description: 'Seller slug' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'Product category',
  })
  @ApiQuery({
    name: 'difficulty',
    required: false,
    type: String,
    description: 'Product difficulty',
  })
  @ApiQuery({
    name: 'priceMin',
    required: false,
    type: Number,
    description: 'Minimum price',
  })
  @ApiQuery({
    name: 'priceMax',
    required: false,
    type: Number,
    description: 'Maximum price',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Sort by field',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term',
  })
  async getSellerProducts(
    @Param('slug') slug: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '12',
    @Query('category') category?: string,
    @Query('difficulty') difficulty?: string,
    @Query('priceMin') priceMin?: string,
    @Query('priceMax') priceMax?: string,
    @Query('sortBy') sortBy?: string,
    @Query('search') search?: string,
  ) {
    // ✅ Obtener el vendedor por slug
    const seller = await this.sellersService.findBySlug(slug);
    if (!seller) {
      throw new NotFoundException(`Seller with slug "${slug}" not found`);
    }

    // ✅ Convertir y validar parámetros
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 12));
    const priceMinNum = priceMin ? parseFloat(priceMin) : undefined;
    const priceMaxNum = priceMax ? parseFloat(priceMax) : undefined;

    // ✅ Validar sortBy
    const validSortOptions = [
      'newest',
      'oldest',
      'price_asc',
      'price_desc',
      'rating',
      'popular',
    ];
    const validSortBy = validSortOptions.includes(sortBy) ? sortBy : 'newest';

    // ✅ Crear filtros
    const filters = {
      page: pageNum,
      limit: limitNum,
      category: category as ProductCategory | undefined,
      difficulty: difficulty as Difficulty | undefined,
      priceMin: priceMinNum,
      priceMax: priceMaxNum,
      sortBy: validSortBy as
        | 'newest'
        | 'oldest'
        | 'price_asc'
        | 'price_desc'
        | 'rating'
        | 'popular',
      search,
    };

    try {
      // ✅ Usar sellerId (que es el userId del vendedor)
      return await this.sellersService.getSellerProducts(
        seller.userId,
        filters,
      );
    } catch (error) {
      this.logger.error('Error getting seller products', error.stack);
      throw new InternalServerErrorException(
        'Error retrieving seller products',
      );
    }
  }

  @Get('id/:id')
  @ApiOperation({ summary: 'Get seller by ID' })
  @ApiParam({ name: 'id', description: 'Seller ID' })
  @ApiResponse({ status: 200, description: 'Seller found' })
  @ApiResponse({ status: 404, description: 'Seller not found' })
  findOne(@Param('id') id: string) {
    return this.sellersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update seller by ID' })
  @ApiParam({ name: 'id', description: 'Seller ID' })
  @ApiResponse({ status: 200, description: 'Seller updated successfully' })
  @ApiResponse({ status: 404, description: 'Seller not found' })
  update(
    @Param('id') id: string,
    @Body() updateSellerDto: Prisma.SellerProfileUpdateInput,
  ) {
    return this.sellersService.update(id, updateSellerDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete seller by ID' })
  @ApiParam({ name: 'id', description: 'Seller ID' })
  @ApiResponse({ status: 200, description: 'Seller deleted successfully' })
  @ApiResponse({ status: 404, description: 'Seller not found' })
  remove(@Param('id') id: string) {
    return this.sellersService.remove(id);
  }
}
