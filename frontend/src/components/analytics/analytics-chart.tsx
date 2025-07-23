'use client'

import { useState, useMemo, ReactElement } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Star,
  Calendar,
  Download,
  RefreshCw,
  MoreVertical
} from 'lucide-react'

interface ChartDataPoint {
  date: string
  value: number
  label?: string
  category?: string
  [key: string]: any
}

interface AnalyticsChartProps {
  title: string
  description?: string
  data: ChartDataPoint[]
  type: 'line' | 'area' | 'bar' | 'pie' | 'donut'
  dataKey: string
  categoryKey?: string
  className?: string
  height?: number
  showTrend?: boolean
  showExport?: boolean
  color?: string
  colors?: string[]
  formatValue?: (value: number) => string
  isLoading?: boolean
  error?: string
  period?: '7d' | '30d' | '90d' | '1y'
  onPeriodChange?: (period: string) => void
  onRefresh?: () => void
}

export function AnalyticsChart({
  title,
  description,
  data,
  type,
  dataKey,
  categoryKey,
  className,
  height = 300,
  showTrend = true,
  showExport = false,
  color = '#F9750B',
  colors = ['#F9750B', '#FFBF11', '#359360', '#9CC8DE', '#e8626d'],
  formatValue = (value) => value.toString(),
  isLoading = false,
  error,
  period = '30d',
  onPeriodChange,
  onRefresh
}: AnalyticsChartProps) {
  const t = useTranslations('analytics')
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  // Calculate trend
  const trend = useMemo(() => {
    if (!showTrend || data.length < 2) return null
    
    const current = data[data.length - 1]?.[dataKey] || 0
    const previous = data[data.length - 2]?.[dataKey] || 0
    
    if (previous === 0) return null
    
    const change = ((current - previous) / previous) * 100
    const isPositive = change > 0
    
    return {
      value: Math.abs(change),
      isPositive,
      icon: isPositive ? TrendingUp : TrendingDown,
      color: isPositive ? 'text-green-600' : 'text-red-600'
    }
  }, [data, dataKey, showTrend])

  // Calculate summary stats
  const stats = useMemo(() => {
    if (data.length === 0) return null
    
    const values = data.map(d => d[dataKey]).filter(v => typeof v === 'number')
    const total = values.reduce((sum, val) => sum + val, 0)
    const average = total / values.length
    const max = Math.max(...values)
    const min = Math.min(...values)
    
    return { total, average, max, min }
  }, [data, dataKey])

  const exportData = () => {
    const csvContent = [
      ['Date', 'Value', categoryKey && 'Category'].filter(Boolean).join(','),
      ...data.map(item => [
        item.date,
        item[dataKey],
        categoryKey && item[categoryKey]
      ].filter(Boolean).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${title.toLowerCase().replace(/\s+/g, '_')}_${period}.csv`
    link.click()
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div 
          className="bg-white border-3 border-black p-3 font-bold"
          style={{ boxShadow: '3px 3px 0 #000000' }}
        >
          <p className="text-black text-sm uppercase mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatValue(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const renderChart = (): ReactElement => {
    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    }

    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#000000" opacity={0.2} />
            <XAxis 
              dataKey="date" 
              stroke="#000000"
              fontSize={12}
              fontWeight="bold"
            />
            <YAxis 
              stroke="#000000"
              fontSize={12}
              fontWeight="bold"
              tickFormatter={formatValue}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={3}
              dot={{ fill: color, strokeWidth: 2, stroke: '#000000', r: 4 }}
              activeDot={{ r: 6, stroke: '#000000', strokeWidth: 2 }}
            />
          </LineChart>
        )

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#000000" opacity={0.2} />
            <XAxis 
              dataKey="date" 
              stroke="#000000"
              fontSize={12}
              fontWeight="bold"
            />
            <YAxis 
              stroke="#000000"
              fontSize={12}
              fontWeight="bold"
              tickFormatter={formatValue}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={3}
              fill={color}
              fillOpacity={0.3}
            />
          </AreaChart>
        )

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#000000" opacity={0.2} />
            <XAxis 
              dataKey="date" 
              stroke="#000000"
              fontSize={12}
              fontWeight="bold"
            />
            <YAxis 
              stroke="#000000"
              fontSize={12}
              fontWeight="bold"
              tickFormatter={formatValue}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey={dataKey} 
              fill={color}
              stroke="#000000"
              strokeWidth={2}
            />
          </BarChart>
        )

      case 'pie':
      case 'donut':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={type === 'donut' ? 60 : 0}
              outerRadius={100}
              paddingAngle={5}
              dataKey={dataKey}
              stroke="#000000"
              strokeWidth={2}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={colors[index % colors.length]}
                  style={{
                    filter: activeIndex === index ? 'brightness(1.1)' : 'none',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }}
            />
          </PieChart>
        )

      default:
        // ✅ FIXED: Retorna un elemento válido en lugar de null
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-gray-400 text-4xl mb-2">📊</div>
              <p className="text-gray-600 font-bold">{t('chart_type_not_supported')}</p>
            </div>
          </div>
        )
    }
  }

  if (error) {
    return (
      <div 
        className={cn("bg-white border-4 border-black p-6", className)}
        style={{ boxShadow: '4px 4px 0 #000000' }}
      >
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="font-black text-lg uppercase mb-2 text-black">{t('error_title')}</h3>
          <p className="text-gray-600 font-medium mb-4">{error}</p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="bg-orange-500 border-2 border-black px-4 py-2 font-black text-black uppercase hover:bg-yellow-400 transition-all"
              style={{ boxShadow: '2px 2px 0 #000000' }}
            >
              <RefreshCw className="w-4 h-4 inline mr-2" />
              {t('retry')}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div 
      className={cn("bg-white border-4 border-black", className)}
      style={{ boxShadow: '4px 4px 0 #000000' }}
    >
      {/* Header */}
      <div className="border-b-2 border-black p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-black text-lg uppercase text-black mb-1">{title}</h3>
            {description && (
              <p className="text-gray-600 font-medium text-sm">{description}</p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Period Selector */}
            {onPeriodChange && (
              <select
                value={period}
                onChange={(e) => onPeriodChange(e.target.value)}
                className="px-2 py-1 border-2 border-black text-xs font-bold bg-white focus:outline-none focus:bg-yellow-400"
              >
                <option value="7d">{t('period.7d')}</option>
                <option value="30d">{t('period.30d')}</option>
                <option value="90d">{t('period.90d')}</option>
                <option value="1y">{t('period.1y')}</option>
              </select>
            )}

            {/* Export Button */}
            {showExport && (
              <button
                onClick={exportData}
                className="p-2 bg-gray-100 border-2 border-black hover:bg-yellow-400 transition-all"
                style={{ boxShadow: '1px 1px 0 #000000' }}
                title={t('export_csv')}
              >
                <Download className="w-4 h-4" />
              </button>
            )}

            {/* Refresh Button */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 bg-gray-100 border-2 border-black hover:bg-yellow-400 transition-all"
                style={{ boxShadow: '1px 1px 0 #000000' }}
                title={t('refresh')}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Stats Summary */}
        {stats && (
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-600">{t('total')}:</span>
              <span className="text-lg font-black text-black">{formatValue(stats.total)}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-600">{t('average')}:</span>
              <span className="text-lg font-black text-black">{formatValue(stats.average)}</span>
            </div>

            {trend && (
              <div className="flex items-center gap-2">
                <trend.icon className={cn("w-4 h-4", trend.color)} />
                <span className={cn("text-sm font-bold", trend.color)}>
                  {trend.value.toFixed(1)}%
                </span>
                <span className="text-xs text-gray-500">vs {t('previous_period')}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chart Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center" style={{ height }}>
            <div className="text-center">
              <div className="animate-pulse text-4xl mb-2">📊</div>
              <p className="text-gray-600 font-bold">{t('loading')}</p>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center" style={{ height }}>
            <div className="text-center">
              <div className="text-gray-400 text-4xl mb-2">📈</div>
              <p className="text-gray-600 font-bold">{t('no_data')}</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            {renderChart()}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}