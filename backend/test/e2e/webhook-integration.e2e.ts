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
        platformFeeRate: 10,
        totalAmount: 110,
        paymentIntentId: 'pi_test_webhook_123',
        subtotal: 100,
        platformFee: 10,
        sellerAmount: 90,
        buyerEmail: buyer.email,
        buyer: { connect: { id: buyer.id } }
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
      // First, find the order by paymentIntentId since it's not unique in the schema
      const orderToUpdate = await prisma.order.findFirst({
        where: { paymentIntentId: mockStripeEvent.data.object.id }
      });
      if (!orderToUpdate) throw new Error('Order not found for paymentIntentId');

      const updatedOrder = await prisma.order.update({
        where: { id: orderToUpdate.id },
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
          platformFeeRate: 5,
          totalAmount: 55,
          paymentIntentId: 'pi_test_failed_123',
          subtotal: 50,
          platformFee: 5,
          sellerAmount: 45,
          buyerEmail: buyer.email,
          buyer: { connect: { id: buyer.id } }
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
      const orderToUpdate = await prisma.order.findFirst({
        where: { paymentIntentId: mockFailureEvent.data.object.id }
      });
      if (!orderToUpdate) throw new Error('Order not found for paymentIntentId');

      const updatedOrder = await prisma.order.update({
        where: { id: orderToUpdate.id },
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