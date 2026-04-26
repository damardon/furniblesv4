import { Injectable } from '@nestjs/common';
import { MetricValue } from '../interfaces/analytics.interface';
import { TimeSeriesData } from '../interfaces/charts.interface';

@Injectable()
export class AnalyticsCalculationService {
  buildMetricValue(value: number, previous?: number): MetricValue {
    const change =
      previous != null && previous > 0
        ? ((value - previous) / previous) * 100
        : 0;
    return {
      value,
      change,
      changeType: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'neutral',
    };
  }

  calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  calculateConversionRate(conversions: number, total: number): number {
    if (total === 0) return 0;
    return (conversions / total) * 100;
  }

  calculateAOV(totalRevenue: number, orderCount: number): number {
    if (orderCount === 0) return 0;
    return totalRevenue / orderCount;
  }

  getTimeRange(
    startDate?: string,
    endDate?: string,
  ): { start: Date; end: Date } {
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { start, end };
  }

  getPreviousPeriod(timeRange: { start: Date; end: Date }): {
    start: Date;
    end: Date;
  } {
    const duration = timeRange.end.getTime() - timeRange.start.getTime();
    return {
      start: new Date(timeRange.start.getTime() - duration),
      end: new Date(timeRange.start.getTime()),
    };
  }

  getCurrentMonthStart(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  groupRevenueByPeriod(
    orders: Array<{ createdAt: Date; sellerRevenue: number }>,
    groupBy: 'day' | 'week' | 'month' = 'month',
  ): TimeSeriesData[] {
    const buckets = new Map<string, number>();

    for (const order of orders) {
      const key = this.getPeriodKey(order.createdAt, groupBy);
      buckets.set(key, (buckets.get(key) ?? 0) + order.sellerRevenue);
    }

    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({ date, value, label: date }));
  }

  private getPeriodKey(date: Date, groupBy: 'day' | 'week' | 'month'): string {
    if (groupBy === 'day') return date.toISOString().substring(0, 10);
    if (groupBy === 'month') return date.toISOString().substring(0, 7);
    // week: ISO week key YYYY-Www
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil(
      ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
    );
    return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
  }
}
