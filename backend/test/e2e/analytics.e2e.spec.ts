// test/e2e/analytics.e2e.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/modules/prisma/prisma.service';
import { UserRole, OrderStatus, ProductStatus, ReviewStatus, ProductCategory, Difficulty } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { hash } from 'bcrypt';

describe('Analytics E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  // Test data IDs
  let adminUserId: string;
  let sellerUserId: string;
  let buyerUserId: string;
  let productId: string;
  let orderId: string;
  let reviewId: string;

  // Auth tokens
  let adminToken: string;
  let sellerToken: string;
  let buyerToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    
    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    await app.init();

    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData();
    await app.close();
  });

  async function setupTestData() {
    // Hash password for users
    const hashedPassword = await hash('testPassword123', 10);

    // Create Admin User
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@analytics-test.com',
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        emailVerified: true,
        password: hashedPassword
      }
    });
    adminUserId = adminUser.id;

    // Create Seller User
    const sellerUser = await prisma.user.create({
      data: {
        email: 'seller@analytics-test.com',
        firstName: 'Seller',
        lastName: 'User',
        role: UserRole.SELLER,
        emailVerified: true,
        password: hashedPassword
      }
    });
    sellerUserId = sellerUser.id;

    // Create Seller Profile with correct schema fields
    await prisma.sellerProfile.create({
      data: {
        userId: sellerUserId,
        storeName: 'Test Business',
        slug: 'test-business',
        description: 'Test Description',
        isVerified: true
      }
    });

    // Create Buyer User
    const buyerUser = await prisma.user.create({
      data: {
        email: 'buyer@analytics-test.com',
        firstName: 'Buyer',
        lastName: 'User',
        role: UserRole.BUYER,
        emailVerified: true,
        password: hashedPassword
      }
    });
    buyerUserId = buyerUser.id;

    // Create Product with required fields from schema
    const product = await prisma.product.create({
      data: {
        title: 'Test Product for Analytics',
        description: 'Test Product Description',
        price: 100.00,
        sellerId: sellerUserId,
        status: ProductStatus.APPROVED,
        slug: 'test-product-analytics',
        category: ProductCategory.FURNITURE,
        difficulty: Difficulty.BEGINNER
      }
    });
    productId = product.id;

    // Create Files for Product with correct schema structure
    const pdfFile = await prisma.file.create({
      data: {
        filename: 'test-file.pdf',
        key: 'files/test-file.pdf',
        url: 'https://example.com/test-file.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        type: 'PDF',
        uploadedById: sellerUserId
      }
    });

    // Update product with file reference
    await prisma.product.update({
      where: { id: productId },
      data: {
        pdfFileId: pdfFile.id
      }
    });

    // Create Order with proper structure and required fields
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}`,
        buyerId: buyerUserId,
        subtotal: 100.00,
        subtotalAmount: 100.00,
        platformFeeRate: 0.10,
        platformFee: 10.00,
        totalAmount: 100.00,
        sellerAmount: 90.00,
        status: OrderStatus.COMPLETED,
        buyerEmail: 'buyer@analytics-test.com',
        items: {
          create: {
            productId: productId,
            productTitle: 'Test Product for Analytics',
            productSlug: 'test-product-analytics',
            sellerId: sellerUserId,
            sellerName: 'Seller User',
            storeName: 'Test Business',
            price: 100.00,
            quantity: 1
          }
        }
      }
    });
    orderId = order.id;

    // Create Review
    const review = await prisma.review.create({
      data: {
        orderId: orderId,
        productId: productId,
        buyerId: buyerUserId,
        sellerId: sellerUserId,
        rating: 5,
        title: 'Great Product!',
        comment: 'This product exceeded my expectations.',
        status: ReviewStatus.PUBLISHED,
        isVerified: true
      }
    });
    reviewId = review.id;

    // Create Review Response
    await prisma.reviewResponse.create({
      data: {
        reviewId: reviewId,
        sellerId: sellerUserId,
        comment: 'Thank you for your review!'
      }
    });

    // Create Product Rating
    await prisma.productRating.create({
      data: {
        productId: productId,
        totalReviews: 1,
        averageRating: 5.0,
        oneStar: 0,
        twoStar: 0,
        threeStar: 0,
        fourStar: 0,
        fiveStar: 1,
        recommendationRate: 100.0
      }
    });

    // Create Seller Rating
    await prisma.sellerRating.create({
      data: {
        sellerId: sellerUserId,
        totalReviews: 1,
        averageRating: 5.0,
        oneStar: 0,
        twoStar: 0,
        threeStar: 0,
        fourStar: 0,
        fiveStar: 1
      }
    });

    // Create Transactions
    await prisma.transaction.create({
      data: {
        type: 'PLATFORM_FEE',
        status: 'COMPLETED',
        amount: 10.00,
        currency: 'USD',
        sellerId: sellerUserId,
        orderId: orderId,
        description: 'Platform fee for order'
      }
    });

    await prisma.transaction.create({
      data: {
        type: 'STRIPE_FEE',
        status: 'COMPLETED',
        amount: 3.00,
        currency: 'USD',
        sellerId: sellerUserId,
        orderId: orderId,
        description: 'Stripe processing fee'
      }
    });

    // Create Notification Analytics
    await prisma.notificationAnalytics.create({
      data: {
        userId: sellerUserId,
        type: 'REVIEW_RECEIVED',
        channel: 'EMAIL',
        sent: true,
        delivered: true,
        read: true,
        clicked: true,
        sentAt: new Date(),
        deliveredAt: new Date(),
        readAt: new Date(),
        clickedAt: new Date(),
        deviceType: 'desktop',
        platform: 'web'
      }
    });

    // Generate JWT tokens
    adminToken = jwtService.sign({ sub: adminUserId, email: adminUser.email, role: UserRole.ADMIN });
    sellerToken = jwtService.sign({ sub: sellerUserId, email: sellerUser.email, role: UserRole.SELLER });
    buyerToken = jwtService.sign({ sub: buyerUserId, email: buyerUser.email, role: UserRole.BUYER });
  }

  async function cleanupTestData() {
    try {
      // Delete in reverse order of dependencies
      await prisma.notificationAnalytics.deleteMany({ where: { userId: sellerUserId } });
      await prisma.transaction.deleteMany({ where: { sellerId: sellerUserId } });
      await prisma.sellerRating.deleteMany({ where: { sellerId: sellerUserId } });
      await prisma.productRating.deleteMany({ where: { productId: productId } });
      await prisma.reviewResponse.deleteMany({ where: { sellerId: sellerUserId } });
      await prisma.review.deleteMany({ where: { sellerId: sellerUserId } });
      await prisma.orderItem.deleteMany({ where: { orderId: orderId } });
      await prisma.order.deleteMany({ where: { buyerId: buyerUserId } });
      await prisma.file.deleteMany({ where: { uploadedById: sellerUserId } });
      await prisma.product.deleteMany({ where: { sellerId: sellerUserId } });
      await prisma.sellerProfile.deleteMany({ where: { userId: sellerUserId } });
      await prisma.user.deleteMany({
        where: {
          id: { in: [adminUserId, sellerUserId, buyerUserId] }
        }
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  describe('Seller Analytics Endpoints', () => {
    describe('GET /analytics/seller/dashboard', () => {
      it('should return seller dashboard for authenticated seller', async () => {
        const response = await request(app.getHttpServer())
          .get('/analytics/seller/dashboard')
          .set('Authorization', `Bearer ${sellerToken}`)
          .query({
            startDate: '2024-01-01T00:00:00.000Z',
            endDate: '2024-12-31T23:59:59.999Z',
            includeComparison: 'true',
            includeActivity: 'true'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.totalRevenue).toBeDefined();
        expect(response.body.data.totalOrders).toBeDefined();
        expect(response.body.data.totalProducts).toBeDefined();
        expect(response.body.data.averageRating).toBeDefined();
        expect(response.body.meta.sellerId).toBe(sellerUserId);
        expect(response.body.meta.currency).toBe('USD');

        // Verify specific data matches our test setup
        expect(response.body.data.totalRevenue.value).toBe(100);
        expect(response.body.data.totalOrders.value).toBe(1);
        expect(response.body.data.totalProducts.value).toBe(1);
        expect(response.body.data.averageRating.value).toBe(5);
      });

      it('should allow admin to view specific seller dashboard', async () => {
        const response = await request(app.getHttpServer())
          .get('/analytics/seller/dashboard')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({
            sellerId: sellerUserId,
            includeComparison: 'false'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.meta.sellerId).toBe(sellerUserId);
      });

      it('should reject admin without sellerId parameter', async () => {
        await request(app.getHttpServer())
          .get('/analytics/seller/dashboard')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(403);
      });

      it('should reject unauthorized access', async () => {
        await request(app.getHttpServer())
          .get('/analytics/seller/dashboard')
          .expect(401);
      });

      it('should reject buyer access', async () => {
        await request(app.getHttpServer())
          .get('/analytics/seller/dashboard')
          .set('Authorization', `Bearer ${buyerToken}`)
          .expect(403);
      });
    });

    describe('GET /analytics/seller/revenue', () => {
      it('should return seller revenue analytics', async () => {
        const response = await request(app.getHttpServer())
          .get('/analytics/seller/revenue')
          .set('Authorization', `Bearer ${sellerToken}`)
          .query({
            includeProductBreakdown: 'true',
            includeFees: 'true',
            groupBy: 'month'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.revenue).toBeDefined();
        expect(response.body.meta.sellerId).toBe(sellerUserId);
      });

      it('should handle date range filtering', async () => {
        const response = await request(app.getHttpServer())
          .get('/analytics/seller/revenue')
          .set('Authorization', `Bearer ${sellerToken}`)
          .query({
            startDate: '2024-01-01',
            endDate: '2024-06-30'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.meta.timeRange).toBeDefined();
        expect(response.body.meta.timeRange.start).toBe('2024-01-01T00:00:00.000Z');
        expect(response.body.meta.timeRange.end).toBe('2024-06-30T00:00:00.000Z');
      });
    });

    describe('GET /analytics/seller/products', () => {
      it('should return seller products analytics', async () => {
        const response = await request(app.getHttpServer())
          .get('/analytics/seller/products')
          .set('Authorization', `Bearer ${sellerToken}`)
          .query({
            sortBy: 'revenue',
            sortOrder: 'desc',
            includeDetails: 'true'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.products).toBeDefined();
        expect(response.body.data.summary).toBeDefined();
      });
    });

    describe('GET /analytics/seller/reviews', () => {
      it('should return seller reviews analytics', async () => {
        const response = await request(app.getHttpServer())
          .get('/analytics/seller/reviews')
          .set('Authorization', `Bearer ${sellerToken}`)
          .query({
            includeDistribution: 'true',
            includeRecentReviews: 'true',
            includeResponseMetrics: 'true'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.reviews).toBeDefined();
        expect(response.body.data.recentReviews).toBeDefined();
      });
    });

    describe('GET /analytics/seller/customers', () => {
      it('should return seller customers analytics', async () => {
        const response = await request(app.getHttpServer())
          .get('/analytics/seller/customers')
          .set('Authorization', `Bearer ${sellerToken}`)
          .query({
            includeRepeatAnalysis: 'true',
            includeLifetimeValue: 'true'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.customers).toBeDefined();
      });
    });

    describe('GET /analytics/seller/notifications', () => {
      it('should return seller notifications analytics', async () => {
        const response = await request(app.getHttpServer())
          .get('/analytics/seller/notifications')
          .set('Authorization', `Bearer ${sellerToken}`)
          .query({
            includeEngagement: 'true',
            includeTypeBreakdown: 'true'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.notifications).toBeDefined();
      });
    });
  });

  describe('Admin Analytics Endpoints', () => {
    describe('GET /analytics/admin/platform', () => {
      it('should return platform overview for admin', async () => {
        const response = await request(app.getHttpServer())
          .get('/analytics/admin/platform')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({
            includeComparison: 'true',
            includeTrends: 'true'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.totalUsers).toBeDefined();
        expect(response.body.data.totalSellers).toBeDefined();
        expect(response.body.data.totalBuyers).toBeDefined();
        expect(response.body.meta.requestedBy).toBe(adminUserId);

        // Verify platform has our test data
        expect(response.body.data.totalUsers.value).toBeGreaterThanOrEqual(3); // admin + seller + buyer
        expect(response.body.data.totalSellers.value).toBeGreaterThanOrEqual(1);
        expect(response.body.data.totalBuyers.value).toBeGreaterThanOrEqual(1);
      });

      it('should reject non-admin access', async () => {
        await request(app.getHttpServer())
          .get('/analytics/admin/platform')
          .set('Authorization', `Bearer ${sellerToken}`)
          .expect(403);
      });
    });

    describe('GET /analytics/admin/top-performers', () => {
      it('should return top performers for admin', async () => {
        const response = await request(app.getHttpServer())
          .get('/analytics/admin/top-performers')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({
            type: 'sellers',
            sortBy: 'revenue',
            sortOrder: 'desc',
            limit: '10'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.performers).toBeDefined();
        expect(response.body.data.type).toBe('sellers');
      });

      it('should require type parameter', async () => {
        await request(app.getHttpServer())
          .get('/analytics/admin/top-performers')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400); // Should fail validation
      });
    });

    describe('GET /analytics/admin/sellers/comparison', () => {
      it('should return seller comparison for admin', async () => {
        const response = await request(app.getHttpServer())
          .get('/analytics/admin/sellers/comparison')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({
            'sellerIds[]': sellerUserId, // Array parameter format
            'metrics[]': 'revenue'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
      });
    });

    describe('GET /analytics/admin/financial-report', () => {
      it('should return financial report for admin', async () => {
        const response = await request(app.getHttpServer())
          .get('/analytics/admin/financial-report')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            includeBreakdown: 'true'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
      });
    });
  });

  describe('Export and Reporting Endpoints', () => {
    describe('POST /analytics/export', () => {
      it('should export data for admin', async () => {
        const response = await request(app.getHttpServer())
          .post('/analytics/export')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            type: 'SELLER_REVENUE',
            format: 'CSV',
            filename: 'test_export',
            sellerId: sellerUserId,
            startDate: '2024-01-01',
            endDate: '2024-12-31'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.filename).toContain('test_export.CSV');
        expect(response.body.data.downloadUrl).toBeDefined();
      });

      it('should auto-set sellerId for seller users', async () => {
        const response = await request(app.getHttpServer())
          .post('/analytics/export')
          .set('Authorization', `Bearer ${sellerToken}`)
          .send({
            type: 'SELLER_REVENUE',
            format: 'XLSX',
            sellerId: 'some-other-seller' // Should be overridden
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.meta.requestedBy).toBe(sellerUserId);
      });

      it('should reject buyer access', async () => {
        await request(app.getHttpServer())
          .post('/analytics/export')
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({
            type: 'SELLER_REVENUE',
            format: 'CSV'
          })
          .expect(403);
      });
    });

    describe('POST /analytics/reports/custom', () => {
      it('should generate custom report for seller', async () => {
        const response = await request(app.getHttpServer())
          .post('/analytics/reports/custom')
          .set('Authorization', `Bearer ${sellerToken}`)
          .send({
            title: 'My Sales Report',
            description: 'Monthly sales overview',
            metrics: ['revenue', 'orders'],
            chartTypes: ['line', 'bar'],
            includeRawData: true
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.filename).toMatch(/custom_report_\d+\.pdf/);
      });

      it('should generate custom report for admin', async () => {
        const response = await request(app.getHttpServer())
          .post('/analytics/reports/custom')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: 'Platform Overview Report',
            metrics: ['revenue', 'users', 'growth'],
            chartTypes: ['line']
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.meta.requestedBy).toBe(adminUserId);
      });
    });

    describe('POST /analytics/reports/schedule', () => {
      it('should schedule report for admin', async () => {
        const response = await request(app.getHttpServer())
          .post('/analytics/reports/schedule')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Weekly Sales Report',
            frequency: 'weekly',
            recipients: ['admin@test.com'],
            reportType: 'PLATFORM_OVERVIEW',
            deliveryTime: '09:00'
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.reportId).toBeDefined();
        expect(response.body.message).toContain('scheduled successfully');
      });

      it('should reject non-admin access', async () => {
        await request(app.getHttpServer())
          .post('/analytics/reports/schedule')
          .set('Authorization', `Bearer ${sellerToken}`)
          .send({
            name: 'Test Report',
            frequency: 'weekly'
          })
          .expect(403);
      });
    });
  });

  describe('Chart Data Endpoints', () => {
    describe('GET /analytics/charts/seller/:sellerId/revenue', () => {
      it('should return chart data for seller', async () => {
        const response = await request(app.getHttpServer())
          .get(`/analytics/charts/seller/${sellerUserId}/revenue`)
          .set('Authorization', `Bearer ${sellerToken}`)
          .query({
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            groupBy: 'month'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.title).toBe('Revenue Trends');
        expect(response.body.data.data).toBeDefined();
        expect(response.body.meta.title).toBe('Seller Revenue Chart');
      });

      it('should allow admin to access any seller chart', async () => {
        const response = await request(app.getHttpServer())
          .get(`/analytics/charts/seller/${sellerUserId}/revenue`)
          .set('Authorization', `Bearer ${adminToken}`)
          .query({
            groupBy: 'week'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should prevent sellers from accessing other sellers charts', async () => {
        // Create another seller for this test
        const otherSeller = await prisma.user.create({
          data: {
            email: 'other-seller@test.com',
            firstName: 'Other',
            lastName: 'Seller',
            role: UserRole.SELLER,
            emailVerified: true,
            password: 'hashedPassword'
          }
        });

        await request(app.getHttpServer())
          .get(`/analytics/charts/seller/${otherSeller.id}/revenue`)
          .set('Authorization', `Bearer ${sellerToken}`)
          .expect(403);

        // Cleanup
        await prisma.user.delete({ where: { id: otherSeller.id } });
      });

      it('should validate UUID format in path parameter', async () => {
        await request(app.getHttpServer())
          .get('/analytics/charts/seller/invalid-uuid/revenue')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);
      });
    });

    describe('GET /analytics/charts/admin/platform-overview', () => {
      it('should return platform chart data for admin', async () => {
        const response = await request(app.getHttpServer())
          .get('/analytics/charts/admin/platform-overview')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({
            includeTrends: 'true'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.meta.title).toBe('Platform Overview Charts');
      });

      it('should reject non-admin access', async () => {
        await request(app.getHttpServer())
          .get('/analytics/charts/admin/platform-overview')
          .set('Authorization', `Bearer ${sellerToken}`)
          .expect(403);
      });
    });
  });

  describe('Health and Status Endpoints', () => {
    describe('GET /analytics/health', () => {
      it('should return system health for admin', async () => {
        const response = await request(app.getHttpServer())
          .get('/analytics/health')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.status).toBeDefined();
        expect(response.body.uptime).toBeDefined();
        expect(response.body.services).toBeDefined();
        expect(response.body.services.database).toBeDefined();
        expect(response.body.services.analytics).toBeDefined();
      });

      it('should reject non-admin access', async () => {
        await request(app.getHttpServer())
          .get('/analytics/health')
          .set('Authorization', `Bearer ${sellerToken}`)
          .expect(403);
      });
    });

    describe('GET /analytics/cache/status', () => {
      it('should return cache status for admin', async () => {
        const response = await request(app.getHttpServer())
          .get('/analytics/cache/status')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.status).toBeDefined();
        expect(response.body.timestamp).toBeDefined();
      });

      it('should reject non-admin access', async () => {
        await request(app.getHttpServer())
          .get('/analytics/cache/status')
          .set('Authorization', `Bearer ${sellerToken}`)
          .expect(403);
      });
    });
  });

  describe('Data Integrity and Business Logic', () => {
    it('should calculate revenue correctly from OrderItems', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/seller/dashboard')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      // Should match our test data: 1 order with $100 revenue
      expect(response.body.data.totalRevenue.value).toBe(100);
      expect(response.body.data.totalOrders.value).toBe(1);
      expect(response.body.data.averageOrderValue.value).toBe(100);
    });

    it('should show correct review metrics', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/seller/reviews')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body.data.reviews.averageRating.value).toBe(5);
      expect(response.body.data.reviews.total.value).toBe(1);
    });

    it('should respect time range filtering', async () => {
      // Test with future date range (should return 0 results)
      const futureResponse = await request(app.getHttpServer())
        .get('/analytics/seller/dashboard')
        .set('Authorization', `Bearer ${sellerToken}`)
        .query({
          startDate: '2025-01-01T00:00:00.000Z',
          endDate: '2025-12-31T23:59:59.999Z'
        })
        .expect(200);

      // Should have no revenue in future date range
      expect(futureResponse.body.data.totalRevenue.value).toBe(0);
      expect(futureResponse.body.data.totalOrders.value).toBe(0);

      // Test with past date range (should include our data)
      const pastResponse = await request(app.getHttpServer())
        .get('/analytics/seller/dashboard')
        .set('Authorization', `Bearer ${sellerToken}`)
        .query({
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-12-31T23:59:59.999Z'
        })
        .expect(200);

      // Should include our test data
      expect(pastResponse.body.data.totalRevenue.value).toBe(100);
      expect(pastResponse.body.data.totalOrders.value).toBe(1);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid sellerId gracefully', async () => {
      await request(app.getHttpServer())
        .get('/analytics/seller/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          sellerId: 'non-existent-seller-id'
        })
        .expect(404); // Should return NotFoundException
    });

    it('should handle malformed date parameters', async () => {
      await request(app.getHttpServer())
        .get('/analytics/seller/dashboard')
        .set('Authorization', `Bearer ${sellerToken}`)
        .query({
          startDate: 'invalid-date',
          endDate: 'also-invalid'
        })
        .expect(400); // Should fail validation
    });

    it('should handle missing required parameters', async () => {
      await request(app.getHttpServer())
        .get('/analytics/admin/top-performers')
        .set('Authorization', `Bearer ${adminToken}`)
        // Missing required 'type' parameter
        .expect(400);
    });

    it('should handle large date ranges without timeout', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/seller/dashboard')
        .set('Authorization', `Bearer ${sellerToken}`)
        .query({
          startDate: '2020-01-01T00:00:00.000Z',
          endDate: '2024-12-31T23:59:59.999Z'
        })
        .timeout(5000) // 5 second timeout
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Performance and Scalability', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .get('/analytics/seller/dashboard')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Should respond within 1 second
      expect(responseTime).toBeLessThan(1000);
    });

    it('should handle concurrent requests correctly', async () => {
      const requests = Array(5).fill(0).map(() =>
        request(app.getHttpServer())
          .get('/analytics/seller/dashboard')
          .set('Authorization', `Bearer ${sellerToken}`)
          .expect(200)
      );

      const responses = await Promise.all(requests);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.body.success).toBe(true);
        expect(response.body.data.totalRevenue.value).toBe(100);
      });
    });
  });

  describe('Security and Authorization', () => {
    it('should reject requests without authentication', async () => {
      await request(app.getHttpServer())
        .get('/analytics/seller/dashboard')
        .expect(401);
    });

    it('should reject requests with invalid tokens', async () => {
      await request(app.getHttpServer())
        .get('/analytics/seller/dashboard')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should enforce role-based access control', async () => {
      // Buyer cannot access seller endpoints
      await request(app.getHttpServer())
        .get('/analytics/seller/dashboard')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(403);

      // Seller cannot access admin endpoints
      await request(app.getHttpServer())
        .get('/analytics/admin/platform')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(403);
    });

    it('should prevent data leakage between sellers', async () => {
      // Create a second seller
      const seller2 = await prisma.user.create({
        data: {
          email: 'seller2@test.com',
          firstName: 'Seller2',
          lastName: 'User',
          role: UserRole.SELLER,
          emailVerified: true,
          password: 'hashedPassword'
        }
      });

      const seller2Token = jwtService.sign({ 
        sub: seller2.id, 
        email: seller2.email, 
        role: UserRole.SELLER 
      });

      // Seller2 should not see seller1's data
      const response = await request(app.getHttpServer())
        .get('/analytics/seller/dashboard')
        .set('Authorization', `Bearer ${seller2Token}`)
        .expect(200);

      // Should have no revenue (seller2 has no orders)
      expect(response.body.data.totalRevenue.value).toBe(0);
      expect(response.body.data.totalOrders.value).toBe(0);
      expect(response.body.meta.sellerId).toBe(seller2.id);

      // Cleanup
      await prisma.user.delete({ where: { id: seller2.id } });
    });
  });

  describe('API Response Format Consistency', () => {
    it('should return consistent response format across endpoints', async () => {
      const endpoints = [
        '/analytics/seller/dashboard',
        '/analytics/seller/revenue',
        '/analytics/seller/products',
        '/analytics/seller/reviews'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app.getHttpServer())
          .get(endpoint)
          .set('Authorization', `Bearer ${sellerToken}`)
          .expect(200);

        // All responses should have consistent structure
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('meta');
        expect(response.body.meta).toHaveProperty('sellerId', sellerUserId);
        expect(response.body.meta).toHaveProperty('timeRange');
        expect(response.body.meta).toHaveProperty('lastUpdated');
        expect(response.body.meta).toHaveProperty('currency', 'USD');
      }
    });

    it('should return proper MetricValue structure', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/seller/dashboard')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      const metrics = ['totalRevenue', 'monthlyRevenue', 'averageOrderValue', 'totalOrders'];
      
      metrics.forEach(metric => {
        expect(response.body.data[metric]).toHaveProperty('value');
        expect(typeof response.body.data[metric].value).toBe('number');
        
        if (response.body.data[metric].change !== undefined) {
          expect(typeof response.body.data[metric].change).toBe('number');
          expect(response.body.data[metric]).toHaveProperty('changeType');
          expect(['increase', 'decrease', 'neutral']).toContain(response.body.data[metric].changeType);
        }
      });
    });
  });
});