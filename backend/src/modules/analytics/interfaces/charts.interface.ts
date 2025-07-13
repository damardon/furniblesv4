// src/modules/analytics/interfaces/charts.interface.ts

export interface ChartDataPoint {
  label: string;
  value: number;
  date?: string;
  metadata?: Record<string, any>;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  secondaryValue?: number;
  label?: string;
}

export interface LineChartData {
  data: TimeSeriesData[];
  title: string;
  primaryLabel: string;
  secondaryLabel?: string;
  color: string;
  secondaryColor?: string;
}

export interface BarChartData {
  data: ChartDataPoint[];
  title: string;
  label: string;
  color: string;
  horizontal?: boolean;
}

export interface PieChartData {
  data: ChartDataPoint[];
  title: string;
  colors: string[];
}

export interface DonutChartData {
  data: ChartDataPoint[];
  title: string;
  centerLabel?: string;
  centerValue?: string;
  colors: string[];
}

export interface FunnelChartData {
  steps: {
    name: string;
    value: number;
    conversionRate?: number;
    dropOff?: number;
  }[];
  title: string;
  colors: string[];
}

export interface HeatmapData {
  data: {
    x: string;
    y: string;
    value: number;
  }[];
  title: string;
  xLabel: string;
  yLabel: string;
  colorScale: string[];
}

export interface GaugeChartData {
  value: number;
  min: number;
  max: number;
  title: string;
  label: string;
  thresholds?: {
    low: number;
    medium: number;
    high: number;
  };
  colors?: {
    low: string;
    medium: string;
    high: string;
  };
}

export interface MultiMetricChart {
  revenue: LineChartData;
  orders: LineChartData;
  customers: LineChartData;
  title: string;
  timeRange: string;
}

export interface ComparisonChartData {
  current: TimeSeriesData[];
  previous: TimeSeriesData[];
  title: string;
  currentLabel: string;
  previousLabel: string;
  metric: string;
}

export interface TopPerformersChart {
  data: {
    name: string;
    value: number;
    rank: number;
    change?: number;
    changeType?: 'increase' | 'decrease' | 'neutral';
  }[];
  title: string;
  metric: string;
  limit: number;
}

export interface CohortChartData {
  cohorts: {
    cohortMonth: string;
    data: {
      period: number;
      retentionRate: number;
      userCount: number;
    }[];
  }[];
  title: string;
}

export interface ConversionFunnelChart {
  steps: {
    name: string;
    count: number;
    percentage: number;
    conversionRate?: number;
  }[];
  title: string;
  colors: string[];
}

export interface GeographicData {
  data: {
    country: string;
    countryCode: string;
    value: number;
    percentage: number;
  }[];
  title: string;
  metric: string;
}

export interface DashboardChartConfig {
  revenue: {
    type: 'line';
    timeframe: 'daily' | 'weekly' | 'monthly';
    showComparison: boolean;
  };
  orders: {
    type: 'bar' | 'line';
    timeframe: 'daily' | 'weekly' | 'monthly';
    showTrend: boolean;
  };
  products: {
    type: 'table' | 'bar';
    sortBy: 'revenue' | 'orders' | 'rating';
    limit: number;
  };
  reviews: {
    type: 'donut' | 'bar';
    showDistribution: boolean;
    showTrends: boolean;
  };
  notifications: {
    type: 'funnel' | 'line';
    showByType: boolean;
    showEngagement: boolean;
  };
}

export interface ChartResponse<T = any> {
  success: boolean;
  data: T;
  meta: {
    title: string;
    description?: string;
    lastUpdated: string;
    dataPoints: number;
    timeRange?: {
      start: string;
      end: string;
    };
  };
  error?: string;
}