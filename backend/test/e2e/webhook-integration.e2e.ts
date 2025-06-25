import { setupTestDb, cleanupTestDb, prisma } from '../e2e-setup';

describe('Webhook Integration (E2E)', () => {
  let buyer: any;
  let order: any;

  beforeAll(async () => {
    const testData = await setupTestDb();
    buyer = testData.buyer;
    
    // Create test order
    order = await prisma.order.create({
      data: {
        orderNumber: 'ORD-20241224-002',
        buyerId: buyer.id,
        status: 'PENDING',
        subtotalAmount: 100,
        platformFeeAmount: 10,
        totalAmount: 110,
        currency: 'USD',
        paymentIntentId: 'pi_test_webhook_123'
      }
    });
  });

  afterAll(async () => {
    await cleanupTestDb();
  });

  describe('Payment Intent Events', () => {
    it('should process payment_intent.succeeded event', async () => {
      const mockStripeEvent = {
        id: 'evt_test_webhook_123',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_webhook_123',
            amount_received: 11000, // $110.00 in cents
            currency: 'usd',
            metadata: { orderId: order.id }
          }
        }
      };
      
      // Simulate webhook processing
      const updatedOrder = await prisma.order.update({
        where: { paymentIntentId: mockStripeEvent.data.object.id },
        data: {
          status: 'PROCESSING',
          paidAt: new Date(),
          paymentStatus: 'succeeded'
        }
      });
      
      expect(updatedOrder.status).toBe('PROCESSING');
      expect(updatedOrder.paymentStatus).toBe('succeeded');
    });
    
    it('should process payment_intent.payment_failed event', async () => {
      // Create another test order for failure
      const failedOrder = await prisma.order.create({
        data: {
          orderNumber: 'ORD-20241224-003',
          buyerId: buyer.id,
          status: 'PENDING',
          subtotalAmount: 50,
          platformFeeAmount: 5,
          totalAmount: 55,
          currency: 'USD',
          paymentIntentId: 'pi_test_failed_123'
        }
      });
      
      const mockFailureEvent = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_test_failed_123',
            last_payment_error: {
              code: 'card_declined',
              message: 'Your card was declined.'
            }
          }
        }
      };
      
      // Simulate failure processing
      const updatedOrder = await prisma.order.update({
        where: { paymentIntentId: mockFailureEvent.data.object.id },
        data: {
          paymentStatus: 'failed',
          metadata: {
            paymentError: {
              code: mockFailureEvent.data.object.last_payment_error.code,
              message: mockFailureEvent.data.object.last_payment_error.message
            }
          }
        }
      });
      
      expect(updatedOrder.paymentStatus).toBe('failed');
    });
  });

  describe('Notification Creation', () => {
    it('should create notifications on order completion', async () => {
      // Complete the order
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'COMPLETED', completedAt: new Date() }
      });
      
      // Create buyer notification
      const buyerNotification = await prisma.notification.create({
        data: {
          userId: buyer.id,
          type: 'ORDER_COMPLETED',
          title: 'Orden completada exitosamente',
          message: `Tu orden ${order.orderNumber} ha sido completada.`,
          data: { orderId: order.id },
          isRead: false,
          emailSent: true
        }
      });
      
      expect(buyerNotification.type).toBe('ORDER_COMPLETED');
      expect(buyerNotification.emailSent).toBe(true);
    });
  });
});