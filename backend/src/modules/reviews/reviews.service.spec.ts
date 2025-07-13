// src/modules/reviews/reviews.service.spec.ts - VERSIÓN FINAL SIN PROBLEMAS DE TIPOS
import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notifications.service';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let prismaService: PrismaService;
  let notificationService: NotificationService;

  const mockPrisma = {
    review: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    order: {
      findFirst: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    file: {
      findMany: jest.fn(),
    },
    reviewImage: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    reviewResponse: {
      create: jest.fn(),
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
    },
    reviewVote: {
      upsert: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    reviewReport: {
      create: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn(),
    },
    productRating: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    sellerRating: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    sellerProfile: {
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockNotificationService = {
    createNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    prismaService = module.get<PrismaService>(PrismaService);
    notificationService = module.get<NotificationService>(NotificationService);

    // Clear all mocks before each test
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(async (callback) => {
      return await callback(mockPrisma);
    });
  });

  describe('createReview', () => {
    const userId = 'buyer-123';
    const createReviewDto = {
      orderId: 'order-456',
      productId: 'product-789',
      rating: 5,
      title: 'Excelente producto',
      comment: 'Muy buena calidad, lo recomiendo',
      pros: 'Buena calidad, fácil armado',
      cons: 'Podría tener más accesorios',
    };

    const mockOrder = {
      id: 'order-456',
      buyerId: userId,
      status: 'COMPLETED',
      items: [{ productId: 'product-789', sellerId: 'seller-111' }],
    };

    const mockProduct = {
      id: 'product-789',
      sellerId: 'seller-111',
      title: 'Mesa de Comedor',
    };

    const mockReview = {
      id: 'review-abc123',
      orderId: 'order-456',
      productId: 'product-789',
      buyerId: userId,
      sellerId: 'seller-111',
      rating: 5,
      title: 'Excelente producto',
      comment: 'Muy buena calidad, lo recomiendo',
      pros: 'Buena calidad, fácil armado',
      cons: 'Podría tener más accesorios',
      status: 'PENDING_MODERATION',
      isVerified: true,
      helpfulCount: 0,
      notHelpfulCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should successfully create a verified review', async () => {
      // Spy en findOne para evitar problemas de tipos complejos
      const findOneSpy = jest.spyOn(service, 'findOne').mockResolvedValue({
        ...mockReview,
        status: 'PUBLISHED',
        buyer: {
          firstName: 'Test',
          lastName: 'Buyer',
          avatar: null,
          buyerProfile: { totalReviews: 1 }
        },
        product: {
          title: 'Mesa de Comedor',
          slug: 'mesa-comedor-premium',
          thumbnailFileIds: []
        },
        images: [],
        response: null,
        votes: []
      } as any);

      // Setup mocks for createReview flow
      mockPrisma.order.findFirst.mockResolvedValue(mockOrder);
      mockPrisma.review.findUnique.mockResolvedValue(null); // No existing review
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.review.create.mockResolvedValue(mockReview);
      mockPrisma.review.update.mockResolvedValue({
        ...mockReview,
        status: 'PUBLISHED',
      });
      mockPrisma.review.findMany.mockResolvedValue([mockReview]);
      mockPrisma.productRating.upsert.mockResolvedValue({});
      mockPrisma.product.update.mockResolvedValue({});
      mockPrisma.sellerRating.upsert.mockResolvedValue({});
      mockPrisma.sellerProfile.update.mockResolvedValue({});

      const result = await service.createReview(userId, createReviewDto);

      expect(mockPrisma.order.findFirst).toHaveBeenCalledWith({
        where: {
          id: createReviewDto.orderId,
          buyerId: userId,
          status: 'COMPLETED',
        },
        include: {
          items: {
            where: { productId: createReviewDto.productId },
          },
        },
      });

      expect(mockPrisma.review.create).toHaveBeenCalledWith({
        data: {
          orderId: createReviewDto.orderId,
          productId: createReviewDto.productId,
          buyerId: userId,
          sellerId: mockProduct.sellerId,
          rating: createReviewDto.rating,
          title: createReviewDto.title,
          comment: createReviewDto.comment,
          pros: createReviewDto.pros,
          cons: createReviewDto.cons,
          status: 'PENDING_MODERATION',
        },
      });

      // Verify findOne was called
      expect(findOneSpy).toHaveBeenCalledWith(mockReview.id);
      expect(result.status).toBe('PUBLISHED');
      expect(result.rating).toBe(5);

      findOneSpy.mockRestore();
    });

    it('should validate images when provided', async () => {
      const dtoWithImages = {
        ...createReviewDto,
        images: ['image-1', 'image-2'],
      };

      const mockValidImages = [
        { id: 'image-1', uploadedById: userId, type: 'REVIEW_IMAGE', status: 'ACTIVE' },
        { id: 'image-2', uploadedById: userId, type: 'REVIEW_IMAGE', status: 'ACTIVE' },
      ];

      // Spy en findOne
      const findOneSpy = jest.spyOn(service, 'findOne').mockResolvedValue({
        ...mockReview,
        status: 'PUBLISHED',
        buyer: {
          firstName: 'Test',
          lastName: 'Buyer',
          avatar: null,
          buyerProfile: { totalReviews: 1 }
        },
        product: {
          title: 'Mesa de Comedor',
          slug: 'mesa-comedor-premium',
          thumbnailFileIds: []
        },
        images: [
          {
            file: { url: '/uploads/image-1.jpg', filename: 'image-1.jpg' },
            order: 0
          },
          {
            file: { url: '/uploads/image-2.jpg', filename: 'image-2.jpg' },
            order: 1
          }
        ],
        response: null,
        votes: []
      } as any);

      // Setup mocks
      mockPrisma.order.findFirst.mockResolvedValue(mockOrder);
      mockPrisma.review.findUnique.mockResolvedValue(null);
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.file.findMany.mockResolvedValue(mockValidImages);
      mockPrisma.review.create.mockResolvedValue(mockReview);
      mockPrisma.reviewImage.createMany.mockResolvedValue({ count: 2 });
      mockPrisma.review.update.mockResolvedValue({
        ...mockReview,
        status: 'PUBLISHED',
      });
      mockPrisma.review.findMany.mockResolvedValue([mockReview]);
      mockPrisma.productRating.upsert.mockResolvedValue({});
      mockPrisma.product.update.mockResolvedValue({});
      mockPrisma.sellerRating.upsert.mockResolvedValue({});
      mockPrisma.sellerProfile.update.mockResolvedValue({});

      const result = await service.createReview(userId, dtoWithImages);

      expect(mockPrisma.file.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['image-1', 'image-2'] },
          uploadedById: userId,
          type: 'REVIEW_IMAGE',
          status: 'ACTIVE',
        },
      });

      expect(mockPrisma.reviewImage.createMany).toHaveBeenCalledWith({
        data: [
          { reviewId: mockReview.id, fileId: 'image-1', order: 0 },
          { reviewId: mockReview.id, fileId: 'image-2', order: 1 },
        ],
      });

      expect(result.status).toBe('PUBLISHED');
      expect(result.images).toHaveLength(2);

      findOneSpy.mockRestore();
    });

    it('should throw NotFoundException when order not found', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(null);

      await expect(
        service.createReview(userId, createReviewDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when product not in order', async () => {
      mockPrisma.order.findFirst.mockResolvedValue({
        ...mockOrder,
        items: [], // Sin el producto
      });

      await expect(
        service.createReview(userId, createReviewDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when review already exists', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(mockOrder);
      mockPrisma.review.findUnique.mockResolvedValue(mockReview); // Existing review

      await expect(
        service.createReview(userId, createReviewDto),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject too many images', async () => {
      const dtoWithTooManyImages = {
        ...createReviewDto,
        images: ['img1', 'img2', 'img3', 'img4', 'img5', 'img6'], // 6 imágenes
      };

      mockPrisma.order.findFirst.mockResolvedValue(mockOrder);
      mockPrisma.review.findUnique.mockResolvedValue(null);
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

      await expect(
        service.createReview(userId, dtoWithTooManyImages),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    const mockReviews = [
      {
        id: 'review-1',
        rating: 5,
        title: 'Excelente',
        comment: 'Muy bueno',
        createdAt: new Date(),
        buyer: { firstName: 'Test', lastName: 'User' },
        product: { title: 'Producto 1' },
        images: [],
        response: null,
      },
    ];

    beforeEach(() => {
      mockPrisma.review.findMany.mockResolvedValue(mockReviews);
      mockPrisma.review.count.mockResolvedValue(1);
    });

    it('should return paginated reviews with default filters', async () => {
      const filters = { page: 1, limit: 10 };

      const result = await service.findAll(filters);

      expect(mockPrisma.review.findMany).toHaveBeenCalledWith({
        where: { status: 'PUBLISHED' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });

      expect(result.reviews).toHaveLength(1);
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.totalItems).toBe(1);
    });

    it('should filter by productId', async () => {
      const filters = { productId: 'product-123', page: 1, limit: 10 };

      await service.findAll(filters);

      expect(mockPrisma.review.findMany).toHaveBeenCalledWith({
        where: { status: 'PUBLISHED', productId: 'product-123' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
    });

    it('should sort by helpful votes', async () => {
      const filters = { sortBy: 'helpful' as const, page: 1, limit: 10 };

      await service.findAll(filters);

      expect(mockPrisma.review.findMany).toHaveBeenCalledWith({
        where: { status: 'PUBLISHED' },
        include: expect.any(Object),
        orderBy: { helpfulCount: 'desc' },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('createResponse', () => {
    const sellerId = 'seller-111';
    const reviewId = 'review-123';
    const responseDto = { comment: 'Gracias por tu reseña!' };

    const mockReview = {
      id: reviewId,
      sellerId: sellerId,
      status: 'PUBLISHED',
      product: { id: 'product-123' },
      buyer: { id: 'buyer-456' },
    };

    const mockResponse = {
      id: 'response-123',
      reviewId,
      sellerId,
      comment: responseDto.comment,
      seller: {
        firstName: 'Test',
        lastName: 'Seller',
        sellerProfile: { storeName: 'Mi Tienda' },
      },
    };

    beforeEach(() => {
      mockPrisma.review.findUnique.mockResolvedValue(mockReview);
      mockPrisma.reviewResponse.findUnique.mockResolvedValue(null);
      mockPrisma.reviewResponse.create.mockResolvedValue(mockResponse);
    });

    it('should successfully create seller response', async () => {
      const result = await service.createResponse(sellerId, reviewId, responseDto);

      expect(result.comment).toBe(responseDto.comment);
      expect(result.seller.firstName).toBe('Test');
    });

    it('should throw NotFoundException when review not found', async () => {
      mockPrisma.review.findUnique.mockResolvedValue(null);

      await expect(
        service.createResponse(sellerId, reviewId, responseDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when not review owner', async () => {
      mockPrisma.review.findUnique.mockResolvedValue({
        ...mockReview,
        sellerId: 'other-seller',
      });

      await expect(
        service.createResponse(sellerId, reviewId, responseDto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('voteReview', () => {
    const userId = 'user-123';
    const reviewId = 'review-456';
    const voteDto = { vote: 'HELPFUL' as const };

    const mockReview = {
      id: reviewId,
      status: 'PUBLISHED',
      buyerId: 'other-user',
    };

    beforeEach(() => {
      mockPrisma.review.findUnique.mockResolvedValue(mockReview);
      mockPrisma.reviewVote.upsert.mockResolvedValue({});
      mockPrisma.reviewVote.findMany.mockResolvedValue([
        { vote: 'HELPFUL' },
        { vote: 'HELPFUL' },
        { vote: 'NOT_HELPFUL' },
      ]);
      mockPrisma.review.update.mockResolvedValue({});
    });

    it('should successfully vote on review', async () => {
      const result = await service.voteReview(userId, reviewId, voteDto);
      expect(result.success).toBe(true);
    });

    it('should throw BadRequestException when voting own review', async () => {
      mockPrisma.review.findUnique.mockResolvedValue({
        ...mockReview,
        buyerId: userId,
      });

      await expect(
        service.voteReview(userId, reviewId, voteDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getProductStats', () => {
    it('should return existing product rating stats', async () => {
      const mockRating = {
        totalReviews: 10,
        averageRating: 4.5,
        oneStar: 1,
        twoStar: 0,
        threeStar: 2,
        fourStar: 3,
        fiveStar: 4,
        recommendationRate: 70,
      };

      mockPrisma.productRating.findUnique.mockResolvedValue(mockRating);

      const result = await service.getProductStats('product-123');
      expect(result).toEqual(mockRating);
    });

    it('should return default stats when no rating exists', async () => {
      mockPrisma.productRating.findUnique.mockResolvedValue(null);

      const result = await service.getProductStats('product-123');
      expect(result.totalReviews).toBe(0);
    });
  });

  describe('updateProductRating (private method)', () => {
    it('should correctly calculate and update product rating', async () => {
      const productId = 'product-123';
      const mockReviews = [
        { rating: 5 },
        { rating: 4 },
        { rating: 5 },
        { rating: 3 },
        { rating: 4 },
      ];

      mockPrisma.review.findMany.mockResolvedValue(mockReviews);
      mockPrisma.product.findUnique.mockResolvedValue({ sellerId: 'seller-123' });
      mockPrisma.productRating.upsert.mockResolvedValue({});
      mockPrisma.product.update.mockResolvedValue({});
      mockPrisma.sellerRating.upsert.mockResolvedValue({});
      mockPrisma.sellerProfile.update.mockResolvedValue({});

      await service['updateProductRating'](productId);

      const expectedRecommendationRate = (4 / 5) * 100; // 80% (4-5 stars)

      expect(mockPrisma.productRating.upsert).toHaveBeenCalledWith({
        where: { productId },
        update: expect.objectContaining({
          recommendationRate: expectedRecommendationRate,
        }),
        create: expect.objectContaining({
          recommendationRate: expectedRecommendationRate,
        }),
      });
    });
  });

  describe('autoModerateReview (private method)', () => {
    it('should flag review with suspicious content', async () => {
      const reviewId = 'review-123';
      mockPrisma.review.findUnique.mockResolvedValue({
        id: reviewId,
        comment: 'This is a spam review',
        rating: 5,
      });
      mockPrisma.review.update.mockResolvedValue({});

      await service['autoModerateReview'](reviewId);

      expect(mockPrisma.review.update).toHaveBeenCalledWith({
        where: { id: reviewId },
        data: { status: 'FLAGGED' },
      });
    });

    it('should publish clean reviews automatically', async () => {
      const reviewId = 'review-123';
      mockPrisma.review.findUnique.mockResolvedValue({
        id: reviewId,
        comment: 'Great product, very satisfied',
        rating: 5,
      });
      mockPrisma.review.update.mockResolvedValue({});

      await service['autoModerateReview'](reviewId);

      expect(mockPrisma.review.update).toHaveBeenCalledWith({
        where: { id: reviewId },
        data: { status: 'PUBLISHED' },
      });
    });
  });
});