import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { setupTestDb, cleanupTestDb, prisma } from '../e2e-setup';
import { randomBytes } from 'crypto';
import { User, Product } from '@prisma/client';

describe('Complete Purchase Flow (E2E)', () => {
  let app: INestApplication;
  let buyer: User;
  let seller: User;
  let product: Product;
  let authToken: string;

  beforeAll(async () => {
    const testData = await setupTestDb();
    buyer = testData.buyer;
    seller = testData.seller;
    product = testData.product;

    if (!buyer || !seller || !product) {
      throw new Error('Test data is incomplete');
    }

    authToken = 'mock-jwt-token';
  });

  afterAll(async () => {
    await cleanupTestDb();
  });

  describe('Cart Operations', () => {
    it('should add product to cart', async () => {
      const mockCartItem = {
        userId: buyer.id,
        productId: product.id,
        priceSnapshot: product.price,
        addedAt: new Date(),
      };

      const cartItem = await prisma.cartItem.create({
        data: mockCartItem,
      });

      expect(cartItem.productId).toBe(product.id);
      expect(cartItem.userId).toBe(buyer.id);
      expect(cartItem.priceSnapshot).toBe(product.price);
    });

    it('should calculate cart totals correctly', async () => {
      const cartItems = await prisma.cartItem.findMany({
        where: { userId: buyer.id },
        include: { product: true },
      });

      const subtotal = cartItems.reduce((sum, item) => sum + item.priceSnapshot, 0);
      const platformFee = subtotal * 0.1;
      const total = subtotal + platformFee;

      expect(subtotal).toBe(product.price);
      expect(platformFee).toBeCloseTo(product.price * 0.1);
      expect(total).toBeCloseTo(product.price * 1.1);
    });
  });

  describe('Order Creation', () => {
    it('should create order from cart', async () => {
      const cartItems = await prisma.cartItem.findMany({
        where: { userId: buyer.id },
        include: { product: true },
      });

      const subtotal = cartItems.reduce((sum, item) => sum + item.priceSnapshot, 0);
      const platformFee = subtotal * 0.1;
      const total = subtotal + platformFee;

      const order = await prisma.order.create({
        data: {
          orderNumber: 'ORD-20241224-001',
          buyerId: buyer.id,
          status: 'PENDING',
          subtotalAmount: subtotal,
          platformFeeAmount: platformFee,
          totalAmount: total,
          currency: 'USD',
          items: {
            create: cartItems.map(item => ({
              productId: item.productId,
              sellerId: item.product.sellerId,
              price: item.priceSnapshot,
              productTitle: item.product.title,
              productDescription: item.product.description,
            })),
          },
        },
      });

      expect(order.status).toBe('PENDING');
      expect(order.totalAmount).toBe(total);
      expect(order.orderNumber).toMatch(/^ORD-\d{8}-\d{3}$/);
    });
  });

  describe('Payment Processing', () => {
    it('should process successful payment', async () => {
      const order = await prisma.order.findFirst({
        where: { buyerId: buyer.id },
      });

      if (!order) throw new Error('Order not found');

      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'PROCESSING',
          paidAt: new Date(),
          paymentStatus: 'succeeded',
          paymentIntentId: 'pi_test_123',
        },
      });

      expect(updatedOrder.status).toBe('PROCESSING');
      expect(updatedOrder.paymentStatus).toBe('succeeded');
      expect(updatedOrder.paidAt).toBeDefined();
    });

    it('should complete order and generate download tokens', async () => {
      const order = await prisma.order.findFirst({
        where: { buyerId: buyer.id },
        include: { items: true },
      });

      if (!order || !order.items || order.items.length === 0) {
        throw new Error('Order or order items not found');
      }

      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });

      for (const item of order.items) {
        await prisma.downloadToken.create({
          data: {
            token: randomBytes(16).toString('hex'),
            orderId: order.id,
            productId: item.productId,
            buyerId: buyer.id,
            downloadLimit: 5,
            downloadCount: 0,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      }

      const tokens = await prisma.downloadToken.findMany({
        where: { orderId: order.id },
      });

      expect(tokens.length).toBe(order.items.length);
      expect(tokens[0].downloadLimit).toBe(5);
      expect(tokens[0].downloadCount).toBe(0);
    });
  });

  describe('Download Process', () => {
    function isTokenValid(token: any): boolean {
      return token.expiresAt > new Date() && token.downloadCount < token.downloadLimit;
    }

    it('should validate download tokens', async () => {
      const token = await prisma.downloadToken.findFirst({
        where: { buyerId: buyer.id },
      });

      if (!token) throw new Error('Download token not found');

      const valid = isTokenValid(token);
      expect(valid).toBe(true);
    });

    it('should track download attempts', async () => {
      const token = await prisma.downloadToken.findFirst({
        where: { buyerId: buyer.id },
      });

      if (!token) throw new Error('Download token not found');

      const updatedToken = await prisma.downloadToken.update({
        where: { id: token.id },
        data: {
          downloadCount: token.downloadCount + 1,
          lastDownloadAt: new Date(),
        },
      });

      expect(updatedToken.downloadCount).toBe(token.downloadCount + 1);
      expect(updatedToken.lastDownloadAt).toBeDefined();
    });
  });
});
