// test/e2e/stages-1-11-complete-flow.e2e.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/modules/prisma/prisma.service';
import { UserRole, OrderStatus, ProductStatus, ReviewStatus, ProductCategory, Difficulty } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { hash } from 'bcrypt';

describe('Stages 1-11 Complete E2E Flow', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  // Test entities
  let adminUser: any;
  let sellerUser: any;
  let buyerUser: any;
  let product: any;
  let order: any;
  let review: any;

  // Auth tokens
  let adminToken: string;
  let sellerToken: string;
  let buyerToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    
    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    await app.init();
  });

  afterAll(async () => {
    await cleanupAllTestData();
    await app.close();
  });

  async function cleanupAllTestData() {
    try {
      if (sellerUser?.id) {
        await prisma.notificationAnalytics.deleteMany({ where: { userId: sellerUser.id } });
        await prisma.notification.deleteMany({ where: { userId: sellerUser.id } });
        await prisma.transaction.deleteMany({ where: { sellerId: sellerUser.id } });
        await prisma.sellerRating.deleteMany({ where: { sellerId: sellerUser.id } });
      }
      
      if (product?.id) {
        await prisma.productRating.deleteMany({ where: { productId: product.id } });
        await prisma.reviewResponse.deleteMany({ where: { reviewId: review?.id } });
        await prisma.review.deleteMany({ where: { productId: product.id } });
      }
      
      if (order?.id) {
        await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
        await prisma.order.deleteMany({ where: { id: order.id } });
      }
      
      if (product?.id) {
        await prisma.product.deleteMany({ where: { id: product.id } });
      }
      
      if (sellerUser?.id) {
        await prisma.sellerProfile.deleteMany({ where: { userId: sellerUser.id } });
      }
      
      await prisma.user.deleteMany({
        where: {
          email: { in: [
            'admin@stages-test.com', 
            'seller@stages-test.com', 
            'buyer@stages-test.com'
          ] }
        }
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  describe('Stage 1-4: Foundation Setup', () => {
    it('Step 1: Should create admin user (Stage 2)', async () => {
      const hashedPassword = await hash('admin123', 10);
      
      adminUser = await prisma.user.create({
        data: {
          email: 'admin@stages-test.com',
          firstName: 'Admin',
          lastName: 'Test',
          role: UserRole.ADMIN,
          emailVerified: true,
          password: hashedPassword
        }
      });

      expect(adminUser).toBeDefined();
      expect(adminUser.role).toBe(UserRole.ADMIN);
      expect(adminUser.emailVerified).toBe(true);
    });

    it('Step 2: Should authenticate admin (Stage 3)', async () => {
      adminToken = jwtService.sign({ 
        sub: adminUser.id, 
        email: adminUser.email, 
        role: UserRole.ADMIN 
      });

      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.id).toBe(adminUser.id);
      expect(response.body.role).toBe(UserRole.ADMIN);
    });

    it('Step 3: Should create seller user with profile (Stage 2)', async () => {
      const hashedPassword = await hash('seller123', 10);
      
      sellerUser = await prisma.user.create({
        data: {
          email: 'seller@stages-test.com',
          firstName: 'Seller',
          lastName: 'Test',
          role: UserRole.SELLER,
          emailVerified: true,
          password: hashedPassword
        }
      });

      // Create seller profile with correct field names from schema
      const sellerProfile = await prisma.sellerProfile.create({
        data: {
          userId: sellerUser.id,
          storeName: 'Test Furniture Store',
          slug: 'test-furniture-store',
          description: 'Premium furniture designs',
          isVerified: true
        }
      });

      sellerToken = jwtService.sign({ 
        sub: sellerUser.id, 
        email: sellerUser.email, 
        role: UserRole.SELLER 
      });

      expect(sellerUser).toBeDefined();
      expect(sellerProfile).toBeDefined();
      expect(sellerUser.role).toBe(UserRole.SELLER);
    });

    it('Step 4: Should create buyer user (Stage 2)', async () => {
      const hashedPassword = await hash('buyer123', 10);
      
      buyerUser = await prisma.user.create({
        data: {
          email: 'buyer@stages-test.com',
          firstName: 'Buyer',
          lastName: 'Test',
          role: UserRole.BUYER,
          emailVerified: true,
          password: hashedPassword
        }
      });

      buyerToken = jwtService.sign({ 
        sub: buyerUser.id, 
        email: buyerUser.email, 
        role: UserRole.BUYER 
      });

      expect(buyerUser).toBeDefined();
      expect(buyerUser.role).toBe(UserRole.BUYER);
    });

    it('Step 5: Should test i18n functionality (Stage 4)', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${sellerToken}`)
        .set('Accept-Language', 'es')
        .expect(200);

      expect(response.body.id).toBe(sellerUser.id);
    });
  });

  describe('Stage 5-6: Product & File Management', () => {
    it('Step 6: Should create product (Stage 5)', async () => {
      // Create product using correct schema fields
      product = await prisma.product.create({
        data: {
          title: 'Modern Minimalist Chair',
          description: 'A beautiful minimalist chair design perfect for modern homes.',
          price: 199.99,
          sellerId: sellerUser.id,
          status: ProductStatus.APPROVED,
          slug: 'modern-minimalist-chair',
          difficulty: Difficulty.BEGINNER,
          category: ProductCategory.CHAIRS // Using enum instead of categoryId
        }
      });

      expect(product).toBeDefined();
      expect(product.title).toBe('Modern Minimalist Chair');
      expect(product.status).toBe(ProductStatus.APPROVED);
      expect(product.sellerId).toBe(sellerUser.id);
      expect(product.category).toBe(ProductCategory.CHAIRS);
      expect(product.difficulty).toBe(Difficulty.BEGINNER);
    });

    it('Step 7: Should verify product via API (Stage 5)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/products/${product.id}`)
        .expect(200);

      expect(response.body.id).toBe(product.id);
      expect(response.body.title).toBe('Modern Minimalist Chair');
    });

    it('Step 8: Should list products for marketplace (Stage 5)', async () => {
      const response = await request(app.getHttpServer())
        .get('/products')
        .query({ limit: 10, page: 1 })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Stage 7: Order Management & Cart', () => {
    it('Step 9: Should add product to cart (Stage 7)', async () => {
      const response = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          productId: product.id,
          quantity: 1
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toBeDefined();
      expect(response.body.data.items.length).toBeGreaterThan(0);
    });

    it('Step 10: Should get cart contents (Stage 7)', async () => {
      const response = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      expect(response.body.data.items).toBeDefined();
      expect(response.body.data.items.length).toBe(1);
      expect(response.body.data.totalAmount).toBe(199.99);
    });

    it('Step 11: Should create order from cart (Stage 7)', async () => {
      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({})
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.status).toBe(OrderStatus.PENDING);

      order = response.body.data;
    });

    it('Step 12: Should complete order payment simulation (Stage 7-8)', async () => {
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.COMPLETED }
      });

      expect(updatedOrder).toBeDefined();
      expect(updatedOrder.status).toBe(OrderStatus.COMPLETED);
      order = updatedOrder;
    });
  });

  describe('Stage 8: Advanced Payments Integration', () => {
    it('Step 13: Should create transaction records (Stage 8)', async () => {
      const platformFeeTransaction = await prisma.transaction.create({
        data: {
          type: 'PLATFORM_FEE',
          status: 'COMPLETED',
          amount: 20.00,
          currency: 'USD',
          sellerId: sellerUser.id,
          orderId: order.id,
          description: 'Platform fee for order'
        }
      });

      const stripeFeeTransaction = await prisma.transaction.create({
        data: {
          type: 'STRIPE_FEE',
          status: 'COMPLETED',
          amount: 6.00,
          currency: 'USD',
          sellerId: sellerUser.id,
          orderId: order.id,
          description: 'Stripe processing fee'
        }
      });

      expect(platformFeeTransaction).toBeDefined();
      expect(stripeFeeTransaction).toBeDefined();
      expect(platformFeeTransaction.amount).toBe(20.00);
      expect(stripeFeeTransaction.amount).toBe(6.00);
    });

    it('Step 14: Should verify seller revenue calculation (Stage 8)', async () => {
      const sellerTransactions = await prisma.transaction.findMany({
        where: { sellerId: sellerUser.id }
      });

      const totalFees = sellerTransactions
        .filter(t => t.type === 'PLATFORM_FEE' || t.type === 'STRIPE_FEE')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      expect(totalFees).toBe(26.00);
      expect(199.99 - totalFees).toBe(173.99);
    });
  });

  describe('Stage 9: Reviews and Ratings', () => {
    it('Step 15: Should create review for completed order (Stage 9)', async () => {
      review = await prisma.review.create({
        data: {
          orderId: order.id,
          productId: product.id,
          buyerId: buyerUser.id,
          sellerId: sellerUser.id,
          rating: 5,
          title: 'Amazing Chair Design!',
          comment: 'This chair design is exactly what I was looking for. High quality and beautiful!',
          pros: 'Great design, easy to assemble, high quality materials',
          cons: 'Delivery took a bit longer than expected',
          status: ReviewStatus.PUBLISHED,
          isVerified: true
        }
      });

      expect(review).toBeDefined();
      expect(review.rating).toBe(5);
      expect(review.isVerified).toBe(true);
      expect(review.status).toBe(ReviewStatus.PUBLISHED);
    });

    it('Step 16: Should create seller response to review (Stage 9)', async () => {
      const response = await prisma.reviewResponse.create({
        data: {
          reviewId: review.id,
          sellerId: sellerUser.id,
          comment: 'Thank you so much for your wonderful review! We are thrilled that you love the chair design.'
        }
      });

      expect(response).toBeDefined();
      expect(response.sellerId).toBe(sellerUser.id);
      expect(response.comment).toContain('Thank you');
    });

    it('Step 17: Should create rating aggregations (Stage 9)', async () => {
      const productRating = await prisma.productRating.create({
        data: {
          productId: product.id,
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

      const sellerRating = await prisma.sellerRating.create({
        data: {
          sellerId: sellerUser.id,
          totalReviews: 1,
          averageRating: 5.0,
          oneStar: 0,
          twoStar: 0,
          threeStar: 0,
          fourStar: 0,
          fiveStar: 1
        }
      });

      expect(productRating.averageRating).toBe(5.0);
      expect(sellerRating.averageRating).toBe(5.0);
      expect(productRating.recommendationRate).toBe(100.0);
    });

    it('Step 18: Should test review API endpoints (Stage 9)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/reviews`)
        .query({ productId: product.id })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reviews).toBeDefined();
      expect(response.body.data.reviews.length).toBe(1);
      expect(response.body.data.reviews[0].id).toBe(review.id);
    });
  });

  describe('Stage 10: Advanced Notifications', () => {
    it('Step 19: Should create notification for review (Stage 10)', async () => {
      const notification = await prisma.notification.create({
        data: {
          userId: sellerUser.id,
          type: 'REVIEW_RECEIVED',
          title: 'New Review Received!',
          message: `You received a 5-star review for "${product.title}"`,
          isRead: false,
          data: {
            reviewId: review.id,
            productId: product.id,
            rating: 5
          }
        }
      });

      expect(notification).toBeDefined();
      expect(notification.type).toBe('REVIEW_RECEIVED');
      expect(notification.userId).toBe(sellerUser.id);
    });

    it('Step 20: Should create notification analytics (Stage 10)', async () => {
      const notificationAnalytics = await prisma.notificationAnalytics.create({
        data: {
          userId: sellerUser.id,
          type: 'REVIEW_RECEIVED',
          channel: 'EMAIL',
          sent: true,
          delivered: true,
          read: true,
          clicked: false,
          sentAt: new Date(),
          deliveredAt: new Date(),
          readAt: new Date(),
          deviceType: 'desktop',
          platform: 'web'
        }
      });

      expect(notificationAnalytics).toBeDefined();
      expect(notificationAnalytics.delivered).toBe(true);
      expect(notificationAnalytics.read).toBe(true);
    });

    it('Step 21: Should test notification API endpoints (Stage 10)', async () => {
      const response = await request(app.getHttpServer())
        .get('/notifications')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notifications).toBeDefined();
      expect(response.body.data.notifications.length).toBeGreaterThan(0);
    });
  });

  describe('Stage 11: Analytics and Reporting - COMPLETE FLOW', () => {
    it('Step 22: Should get seller dashboard analytics (Stage 11)', async () => {
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
      expect(response.body.meta.sellerId).toBe(sellerUser.id);
      expect(response.body.meta.currency).toBe('USD');
    });

    it('Step 23: Should get seller revenue analytics (Stage 11)', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/seller/revenue')
        .set('Authorization', `Bearer ${sellerToken}`)
        .query({
          includeProductBreakdown: 'true',
          includeFees: 'true'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.revenue).toBeDefined();
    });

    it('Step 24: Should get seller products analytics (Stage 11)', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/seller/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .query({
          sortBy: 'revenue',
          sortOrder: 'desc'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toBeDefined();
      expect(response.body.data.summary).toBeDefined();
    });

    it('Step 25: Should get seller reviews analytics (Stage 11)', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/seller/reviews')
        .set('Authorization', `Bearer ${sellerToken}`)
        .query({
          includeDistribution: 'true',
          includeRecentReviews: 'true'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reviews).toBeDefined();
    });

    it('Step 26: Should get platform overview analytics (Admin) (Stage 11)', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/admin/platform')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          includeComparison: 'true'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalUsers).toBeDefined();
      expect(response.body.data.totalSellers).toBeDefined();
      expect(response.body.data.totalBuyers).toBeDefined();
    });

    it('Step 27: Should export analytics data (Stage 11)', async () => {
      const response = await request(app.getHttpServer())
        .post('/analytics/export')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          type: 'SELLER_REVENUE',
          format: 'CSV',
          filename: 'test_export_stages_1_11'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.filename).toContain('test_export_stages_1_11.CSV');
      expect(response.body.data.downloadUrl).toBeDefined();
    });

    it('Step 28: Should generate custom report (Stage 11)', async () => {
      const response = await request(app.getHttpServer())
        .post('/analytics/reports/custom')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          title: 'Complete Flow Report',
          description: 'Report covering all stages 1-11',
          metrics: ['revenue', 'orders', 'products', 'reviews'],
          chartTypes: ['line', 'bar']
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.filename).toMatch(/custom_report_\d+\.pdf/);
    });

    it('Step 29: Should get chart data for seller revenue (Stage 11)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/analytics/charts/seller/${sellerUser.id}/revenue`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .query({
          startDate: '2024-01-01',
          endDate: '2024-12-31'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.title).toBe('Revenue Trends');
      expect(response.body.meta.title).toBe('Seller Revenue Chart');
    });

    it('Step 30: Should check system health (Stage 11)', async () => {
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
  });

  describe('Integration Validation - All Stages Working Together', () => {
    it('Should validate complete data flow integrity', async () => {
      // Verify order exists and has correct structure
      const orderWithItems = await prisma.order.findUnique({
        where: { id: order.id },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });

      expect(orderWithItems).toBeDefined();
      if (orderWithItems) {
        expect(orderWithItems.buyerId).toBe(buyerUser.id);
        expect(orderWithItems.items.length).toBeGreaterThan(0);
        expect(orderWithItems.items[0].product.sellerId).toBe(sellerUser.id);
      }

      // Verify review exists and has correct structure
      const reviewData = await prisma.review.findUnique({
        where: { id: review.id },
        include: {
          product: {
            include: {
              productRating: true
            }
          }
        }
      });

      expect(reviewData).toBeDefined();
      if (reviewData) {
        expect(reviewData.buyerId).toBe(buyerUser.id);
        expect(reviewData.sellerId).toBe(sellerUser.id);
        expect(reviewData.productId).toBe(product.id);
      }
    });

    it('Should validate business metrics calculations', async () => {
      const totalOrderValue = 199.99;
      const transactions = await prisma.transaction.findMany({
        where: { orderId: order.id }
      });

      const actualPlatformFee = transactions
        .filter(t => t.type === 'PLATFORM_FEE')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const actualStripeFee = transactions
        .filter(t => t.type === 'STRIPE_FEE')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      expect(actualPlatformFee).toBeCloseTo(20.00, 2);
      expect(actualStripeFee).toBe(6.00);
      expect(totalOrderValue - actualPlatformFee - actualStripeFee).toBeCloseTo(173.99, 2);
    });

    it('Should validate all modules are accessible via API', async () => {
      const endpoints = [
        { method: 'GET', path: '/auth/me', token: adminToken, status: 200 },
        { method: 'GET', path: '/products', status: 200 },
        { method: 'GET', path: '/orders', token: buyerToken, status: 200 },
        { method: 'GET', path: '/reviews', status: 200 },
        { method: 'GET', path: '/notifications', token: sellerToken, status: 200 },
        { method: 'GET', path: '/analytics/seller/dashboard', token: sellerToken, status: 200 },
        { method: 'GET', path: '/analytics/admin/platform', token: adminToken, status: 200 }
      ];

      for (const endpoint of endpoints) {
        let req = request(app.getHttpServer())[endpoint.method.toLowerCase()](endpoint.path);
        
        if (endpoint.token) {
          req = req.set('Authorization', `Bearer ${endpoint.token}`);
        }
        
        await req.expect(endpoint.status);
      }
    });

    it('Should validate performance across all stages', async () => {
      const startTime = Date.now();

      const operations = [
        request(app.getHttpServer())
          .get('/analytics/seller/dashboard')
          .set('Authorization', `Bearer ${sellerToken}`),
        request(app.getHttpServer())
          .get('/products')
          .query({ limit: 10 }),
        request(app.getHttpServer())
          .get('/reviews')
          .query({ productId: product.id }),
        request(app.getHttpServer())
          .get('/notifications')
          .set('Authorization', `Bearer ${sellerToken}`)
      ];

      const responses = await Promise.all(operations);
      const endTime = Date.now();

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      expect(endTime - startTime).toBeLessThan(5000);
    });
  });
});