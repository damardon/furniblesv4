import { AnalyticsCalculationService } from './analytics-calculation.service';

describe('AnalyticsCalculationService', () => {
  let service: AnalyticsCalculationService;

  beforeEach(() => {
    service = new AnalyticsCalculationService();
  });

  describe('buildMetricValue', () => {
    it('returns neutral when no previous', () => {
      const result = service.buildMetricValue(100);
      expect(result).toEqual({ value: 100, change: 0, changeType: 'neutral' });
    });

    it('returns increase when current > previous', () => {
      const result = service.buildMetricValue(120, 100);
      expect(result.change).toBeCloseTo(20);
      expect(result.changeType).toBe('increase');
    });

    it('returns decrease when current < previous', () => {
      const result = service.buildMetricValue(80, 100);
      expect(result.change).toBeCloseTo(-20);
      expect(result.changeType).toBe('decrease');
    });

    it('returns neutral when previous is 0', () => {
      const result = service.buildMetricValue(50, 0);
      expect(result.change).toBe(0);
      expect(result.changeType).toBe('neutral');
    });
  });

  describe('calculateGrowthRate', () => {
    it('calculates positive growth', () => {
      expect(service.calculateGrowthRate(150, 100)).toBeCloseTo(50);
    });

    it('calculates negative growth', () => {
      expect(service.calculateGrowthRate(50, 100)).toBeCloseTo(-50);
    });

    it('returns 0 when previous is 0', () => {
      expect(service.calculateGrowthRate(100, 0)).toBe(0);
    });
  });

  describe('calculateConversionRate', () => {
    it('calculates percentage correctly', () => {
      expect(service.calculateConversionRate(25, 100)).toBe(25);
    });

    it('returns 0 when total is 0', () => {
      expect(service.calculateConversionRate(0, 0)).toBe(0);
    });
  });

  describe('calculateAOV', () => {
    it('divides revenue by orders', () => {
      expect(service.calculateAOV(500, 5)).toBe(100);
    });

    it('returns 0 when no orders', () => {
      expect(service.calculateAOV(500, 0)).toBe(0);
    });
  });

  describe('getTimeRange', () => {
    it('defaults to last 30 days when no args', () => {
      const { start, end } = service.getTimeRange();
      const diff = end.getTime() - start.getTime();
      expect(diff).toBeCloseTo(30 * 24 * 60 * 60 * 1000, -3);
    });

    it('uses provided dates', () => {
      const { start, end } = service.getTimeRange('2024-01-01', '2024-01-31');
      expect(start.toISOString()).toContain('2024-01-01');
      expect(end.toISOString()).toContain('2024-01-31');
    });
  });

  describe('getPreviousPeriod', () => {
    it('shifts range by its own duration', () => {
      const timeRange = {
        start: new Date('2024-02-01'),
        end: new Date('2024-03-01'),
      };
      const prev = service.getPreviousPeriod(timeRange);
      expect(prev.end.getTime()).toBe(timeRange.start.getTime());
    });
  });

  describe('groupRevenueByPeriod', () => {
    const orders = [
      { createdAt: new Date('2024-01-05'), sellerRevenue: 100 },
      { createdAt: new Date('2024-01-15'), sellerRevenue: 200 },
      { createdAt: new Date('2024-02-10'), sellerRevenue: 150 },
    ];

    it('groups by month correctly', () => {
      const result = service.groupRevenueByPeriod(orders, 'month');
      expect(result).toHaveLength(2);
      expect(result.find((r) => r.date === '2024-01')?.value).toBe(300);
      expect(result.find((r) => r.date === '2024-02')?.value).toBe(150);
    });

    it('groups by day correctly', () => {
      const result = service.groupRevenueByPeriod(orders, 'day');
      expect(result).toHaveLength(3);
    });

    it('returns sorted results', () => {
      const result = service.groupRevenueByPeriod(orders, 'month');
      expect(result[0].date < result[1].date).toBe(true);
    });

    it('returns empty array for empty input', () => {
      expect(service.groupRevenueByPeriod([], 'month')).toEqual([]);
    });
  });
});
