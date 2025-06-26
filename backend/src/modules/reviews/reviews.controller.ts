// src/modules/reviews/reviews.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam
} from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { 
  CreateReviewDto, 
  UpdateReviewDto, 
  CreateReviewResponseDto,
  VoteReviewDto,
  ReportReviewDto,
  FilterReviewDto,
  ModerateReviewDto
} from './dto';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // ============================================
  // PUBLIC ENDPOINTS
  // ============================================

  @Get()
  @ApiOperation({ summary: 'Get reviews with filters' })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
  async findAll(@Query() filters: FilterReviewDto) {
    return this.reviewsService.findAll(filters);
  }

  @Get('products/:productId/stats')
  @ApiOperation({ summary: 'Get product review statistics' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product stats retrieved' })
  async getProductStats(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.reviewsService.getProductStats(productId);
  }

  @Get('sellers/:sellerId/stats')
  @ApiOperation({ summary: 'Get seller review statistics' })
  @ApiParam({ name: 'sellerId', description: 'Seller ID' })
  @ApiResponse({ status: 200, description: 'Seller stats retrieved' })
  async getSellerStats(@Param('sellerId', ParseUUIDPipe) sellerId: string) {
    return this.reviewsService.getSellerStats(sellerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get review by ID' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Review found' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewsService.findOne(id);
  }

  // ============================================
  // AUTHENTICATED USER ENDPOINTS
  // ============================================

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUYER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a review' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Review already exists' })
  async create(
    @CurrentUser('sub') userId: string,
    @Body() createReviewDto: CreateReviewDto
  ) {
    return this.reviewsService.createReview(userId, createReviewDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own review' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Review updated successfully' })
  @ApiResponse({ status: 403, description: 'Not authorized to update this review' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async update(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateReviewDto: UpdateReviewDto
  ) {
    return this.reviewsService.updateReview(userId, id, updateReviewDto);
  }

  @Post(':id/response')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Respond to a review' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 201, description: 'Response created successfully' })
  @ApiResponse({ status: 403, description: 'Not authorized to respond to this review' })
  @ApiResponse({ status: 409, description: 'Response already exists' })
  async createResponse(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) reviewId: string,
    @Body() responseDto: CreateReviewResponseDto
  ) {
    return this.reviewsService.createResponse(userId, reviewId, responseDto);
  }

  @Post(':id/vote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vote on review helpfulness' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Vote recorded successfully' })
  @ApiResponse({ status: 400, description: 'Cannot vote on own review' })
  async voteReview(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) reviewId: string,
    @Body() voteDto: VoteReviewDto
  ) {
    return this.reviewsService.voteReview(userId, reviewId, voteDto);
  }

  @Post(':id/report')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Report inappropriate review' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Report submitted successfully' })
  @ApiResponse({ status: 409, description: 'Already reported this review' })
  async reportReview(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) reviewId: string,
    @Body() reportDto: ReportReviewDto
  ) {
    return this.reviewsService.reportReview(userId, reviewId, reportDto);
  }

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get admin review statistics' })
  @ApiResponse({ status: 200, description: 'Admin stats retrieved successfully' })
  async getAdminStats() {
    return this.reviewsService.getAdminStats();
  }

  @Get('admin/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pending reviews for moderation' })
  @ApiResponse({ status: 200, description: 'Pending reviews retrieved successfully' })
  async getPendingReviews(
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.reviewsService.getPendingReviews(page, limit);
  }

  @Put('admin/:id/moderate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Moderate a review' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Review moderated successfully' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async moderateReview(
    @CurrentUser('sub') adminId: string,
    @Param('id', ParseUUIDPipe) reviewId: string,
    @Body() moderateDto: ModerateReviewDto
  ) {
    return this.reviewsService.moderateReview(adminId, reviewId, moderateDto);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a review' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Review deleted successfully' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async deleteReview(@Param('id', ParseUUIDPipe) reviewId: string) {
    return this.reviewsService.deleteReview(reviewId);
  }
}