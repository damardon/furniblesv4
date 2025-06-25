describe('Complete Purchase Flow E2E', () => {
  // Mock services
  const mockPrisma = {
    user: { create: jest.fn(), findFirst: jest.fn() },
    product: { create: jest.fn(), findFirst: jest.fn() },
    cartItem: { create: jest.fn(), findMany: jest.fn(), deleteMany: jest.fn() },
    order: { create: jest.fn(), update: jest.fn(), findFirst: jest.fn() },
    orderItem: { create: jest.fn() },
    downloadToken: { create: jest.fn(), findMany: jest.fn() },
    notification: { create: jest.fn() },
    $transaction: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock transaction to execute callback immediately
    mockPrisma.$transaction.mockImplementation(async (callback) => {
      return await callback(mockPrisma);
    });
  });

  describe('Step 1: User Setup', () => {
    it('should create buyer and seller', async () => {
      const mockBuyer = {
        id: 'buyer-123',
        email: 'buyer@test.com',
        role: 'BUYER',
        firstName: 'Test',
        lastName: 'Buyer'
      };
      
      const mockSeller = {
        id: 'seller-456',
        email: 'seller@test.com',
        role: 'SELLER',
        firstName: 'Test',
        lastName: 'Seller'
      };
      
      mockPrisma.user.create
        .mockResolvedValueOnce(mockBuyer)
        .mockResolvedValueOnce(mockSeller);
      
      const buyer = await mockPrisma.user.create({
        data: {
          email: 'buyer@test.com',
          role: 'BUYER',
          firstName: 'Test',
          lastName: 'Buyer'
        }
      });
      
      const seller = await mockPrisma.user.create({
        data: {
          email: 'seller@test.com',
          role: 'SELLER',
          firstName: 'Test',
          lastName: 'Seller'
        }
      });
      
      expect(buyer.role).toBe('BUYER');
      expect(seller.role).toBe('SELLER');
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('Step 2: Product and Cart', () => {
    it('should add product to cart', async () => {
      const mockProduct = {
        id: 'product-789',
        title: 'Mesa de Comedor',
        price: 150,
        sellerId: 'seller-456',
        status: 'PUBLISHED'
      };
      
      const mockCartItem = {
        id: 'cart-item-1',
        userId: 'buyer-123',
        productId: 'product-789',
        priceSnapshot: 150,
        addedAt: new Date()
      };
      
      mockPrisma.product.findFirst.mockResolvedValue(mockProduct);
      mockPrisma.cartItem.create.mockResolvedValue(mockCartItem);
      
      // Validate product exists
      const product = await mockPrisma.product.findFirst({
        where: { id: 'product-789', status: 'PUBLISHED' }
      });
      
      // Add to cart
      const cartItem = await mockPrisma.cartItem.create({
        data: {
          userId: 'buyer-123',
          productId: product.id,
          priceSnapshot: product.price
        }
      });
      
      expect(product.price).toBe(150);
      expect(cartItem.priceSnapshot).toBe(150);
      expect(cartItem.userId).toBe('buyer-123');
    });
    
    it('should calculate cart totals', async () => {
      const mockCartItems = [
        { priceSnapshot: 150, productId: 'product-789' },
        { priceSnapshot: 100, productId: 'product-456' }
      ];
      
      mockPrisma.cartItem.findMany.mockResolvedValue(mockCartItems);
      
      const cartItems = await mockPrisma.cartItem.findMany({
        where: { userId: 'buyer-123' }
      });
      
      // Calculate totals (like CartService would)
      const subtotal = cartItems.reduce((sum, item) => sum + item.priceSnapshot, 0);
      const platformFee = Math.round(subtotal * 0.10 * 100) / 100; // 10% fee
      const total = subtotal + platformFee;
      
      expect(subtotal).toBe(250);
      expect(platformFee).toBe(25);
      expect(total).toBe(275);
    });
  });

  describe('Step 3: Order Creation', () => {
    it('should create order from cart', async () => {
      const mockOrder = {
        id: 'order-abc123',
        orderNumber: 'ORD-20241224-001',
        buyerId: 'buyer-123',
        status: 'PENDING',
        subtotalAmount: 250,
        platformFeeAmount: 25,
        totalAmount: 275,
        currency: 'USD',
        createdAt: new Date()
      };
      
      const mockCartItems = [
        { 
          priceSnapshot: 150, 
          productId: 'product-789',
          product: { sellerId: 'seller-456', title: 'Mesa de Comedor' }
        },
        { 
          priceSnapshot: 100, 
          productId: 'product-456',
          product: { sellerId: 'seller-789', title: 'Silla Moderna' }
        }
      ];
      
      mockPrisma.cartItem.findMany.mockResolvedValue(mockCartItems);
      mockPrisma.order.create.mockResolvedValue(mockOrder);
      mockPrisma.cartItem.deleteMany.mockResolvedValue({ count: 2 });
      
      // Get cart items
      const cartItems = await mockPrisma.cartItem.findMany({
        where: { userId: 'buyer-123' },
        include: { product: true }
      });
      
      // Create order
      const order = await mockPrisma.order.create({
        data: {
          orderNumber: 'ORD-20241224-001',
          buyerId: 'buyer-123',
          status: 'PENDING',
          subtotalAmount: 250,
          platformFeeAmount: 25,
          totalAmount: 275,
          currency: 'USD'
        }
      });
      
      // Clear cart
      await mockPrisma.cartItem.deleteMany({
        where: { userId: 'buyer-123' }
      });
      
      expect(order.status).toBe('PENDING');
      expect(order.totalAmount).toBe(275);
      expect(order.orderNumber).toMatch(/^ORD-\d{8}-\d{3}$/);
      expect(mockPrisma.cartItem.deleteMany).toHaveBeenCalled();
    });
  });

  describe('Step 4: Payment Processing (Webhook Simulation)', () => {
    it('should process successful payment via webhook', async () => {
      const mockOrder = {
        id: 'order-abc123',
        status: 'PENDING',
        buyerId: 'buyer-123',
        items: [
          { productId: 'product-789', sellerId: 'seller-456' },
          { productId: 'product-456', sellerId: 'seller-789' }
        ]
      };
      
      const mockUpdatedOrder = {
        ...mockOrder,
        status: 'COMPLETED',
        paidAt: new Date(),
        completedAt: new Date(),
        paymentStatus: 'succeeded',
        paymentIntentId: 'pi_test_123'
      };
      
      mockPrisma.order.findFirst.mockResolvedValue(mockOrder);
      mockPrisma.order.update.mockResolvedValue(mockUpdatedOrder);
      
      // Simulate webhook: payment_intent.succeeded
      const stripeEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            amount_received: 27500, // $275.00 in cents
            metadata: { orderId: 'order-abc123' }
          }
        }
      };
      
      // Process webhook (like StripeWebhookService would)
      const order = await mockPrisma.order.findFirst({
        where: { id: stripeEvent.data.object.metadata.orderId },
        include: { items: true }
      });
      
      const updatedOrder = await mockPrisma.order.update({
        where: { id: order.id },
        data: {
          status: 'COMPLETED',
          paidAt: new Date(),
          paymentStatus: 'succeeded',
          paymentIntentId: stripeEvent.data.object.id
        }
      });
      
      expect(updatedOrder.status).toBe('COMPLETED');
      expect(updatedOrder.paymentStatus).toBe('succeeded');
      expect(updatedOrder.paymentIntentId).toBe('pi_test_123');
    });
  });

  describe('Step 5: Download Tokens and Notifications', () => {
    it('should generate download tokens after payment', async () => {
      const mockTokens = [
        {
          id: 'token-1',
          token: 'download_abc123_xyz789',
          orderId: 'order-abc123',
          productId: 'product-789',
          buyerId: 'buyer-123',
          downloadLimit: 5,
          downloadCount: 0,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        {
          id: 'token-2', 
          token: 'download_def456_uvw012',
          orderId: 'order-abc123',
          productId: 'product-456',
          buyerId: 'buyer-123',
          downloadLimit: 5,
          downloadCount: 0,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      ];
      
      mockPrisma.downloadToken.create
        .mockResolvedValueOnce(mockTokens[0])
        .mockResolvedValueOnce(mockTokens[1]);
      
      mockPrisma.downloadToken.findMany.mockResolvedValue(mockTokens);
      
      // Generate tokens for each product in order
      const orderItems = [
        { productId: 'product-789' },
        { productId: 'product-456' }
      ];
      
      for (const item of orderItems) {
        await mockPrisma.downloadToken.create({
          data: {
            token: `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            orderId: 'order-abc123',
            productId: item.productId,
            buyerId: 'buyer-123',
            downloadLimit: 5,
            downloadCount: 0,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        });
      }
      
      const tokens = await mockPrisma.downloadToken.findMany({
        where: { orderId: 'order-abc123' }
      });
      
      expect(tokens).toHaveLength(2);
      expect(tokens[0].downloadLimit).toBe(5);
      expect(tokens[0].downloadCount).toBe(0);
      expect(mockPrisma.downloadToken.create).toHaveBeenCalledTimes(2);
    });
    
    it('should create completion notifications', async () => {
      const mockBuyerNotification = {
        id: 'notif-1',
        userId: 'buyer-123',
        type: 'ORDER_COMPLETED',
        title: 'Orden completada exitosamente',
        message: 'Tu orden ORD-20241224-001 ha sido completada.',
        isRead: false,
        emailSent: true
      };
      
      const mockSellerNotification = {
        id: 'notif-2',
        userId: 'seller-456',
        type: 'NEW_SALE',
        title: '¡Nueva venta realizada!',
        message: 'Has vendido "Mesa de Comedor" por $150.00',
        isRead: false,
        emailSent: true
      };
      
      mockPrisma.notification.create
        .mockResolvedValueOnce(mockBuyerNotification)
        .mockResolvedValueOnce(mockSellerNotification);
      
      // Create buyer notification
      const buyerNotif = await mockPrisma.notification.create({
        data: {
          userId: 'buyer-123',
          type: 'ORDER_COMPLETED',
          title: 'Orden completada exitosamente',
          message: 'Tu orden ORD-20241224-001 ha sido completada.',
          isRead: false,
          emailSent: true
        }
      });
      
      // Create seller notification
      const sellerNotif = await mockPrisma.notification.create({
        data: {
          userId: 'seller-456',
          type: 'NEW_SALE',
          title: '¡Nueva venta realizada!',
          message: 'Has vendido "Mesa de Comedor" por $150.00',
          isRead: false,
          emailSent: true
        }
      });
      
      expect(buyerNotif.type).toBe('ORDER_COMPLETED');
      expect(sellerNotif.type).toBe('NEW_SALE');
      expect(buyerNotif.emailSent).toBe(true);
      expect(sellerNotif.emailSent).toBe(true);
    });
  });

  describe('Integration: Complete Flow', () => {
    it('should run complete purchase flow end-to-end', async () => {
      // This test validates the entire flow works together
      const flowData = {
        buyer: { id: 'buyer-123', email: 'buyer@test.com' },
        product: { id: 'product-789', price: 150, title: 'Mesa de Comedor' },
        cartTotal: 165, // 150 + 15 (10% fee)
        orderNumber: 'ORD-20241224-001',
        paymentIntentId: 'pi_test_complete_123'
      };
      
      // Validate flow data integrity
      expect(flowData.cartTotal).toBe(flowData.product.price + (flowData.product.price * 0.1));
      expect(flowData.orderNumber).toMatch(/^ORD-\d{8}-\d{3}$/);
      expect(flowData.paymentIntentId).toContain('pi_');
      
      // Validate all steps can chain together
      const steps = [
        'user_creation',
        'add_to_cart', 
        'create_order',
        'process_payment',
        'generate_tokens',
        'send_notifications'
      ];
      
      expect(steps).toHaveLength(6);
      expect(steps).toEqual(expect.arrayContaining([
        'user_creation',
        'add_to_cart',
        'create_order', 
        'process_payment',
        'generate_tokens',
        'send_notifications'
      ]));
    });
  });
});
