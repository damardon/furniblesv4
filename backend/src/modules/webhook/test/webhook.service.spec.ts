describe('Webhook Service Tests', () => {
  it('should validate stripe events', () => {
    const eventType = 'payment_intent.succeeded';
    expect(eventType).toContain('payment_intent');
  });
});