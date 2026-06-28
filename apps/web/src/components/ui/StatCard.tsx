'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  trend?: string
  trendUp?: boolean
  colorHex?: string
  className?: string
}

export function StatCard({
  title,
  value,
  trend,
  trendUp = true,
  colorHex = '#3B82F6',
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-[#111827] border border-[#1F2937] rounded-lg p-5 relative overflow-hidden group',
        className
      )}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1 opacity-80 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: colorHex }}
      />
      <h4 className="text-sm font-medium text-muted-foreground mb-1">{title}</h4>
      <div className="flex items-end justify-between">
        <span className="text-3xl font-bold text-foreground tracking-tight">{value}</span>
        {trend && (
          <div
            className={cn(
              'flex items-center text-xs font-medium px-2 py-1 rounded-md mb-1',
              trendUp
                ? 'text-[#4ae176] bg-[#4ae176]/10'
                : 'text-[#ffb4ab] bg-[#ffb4ab]/10'
            )}
          >
            {trendUp ? (
              <TrendingUp className="w-3 h-3 mr-1" />
            ) : (
              <TrendingDown className="w-3 h-3 mr-1" />
            )}
            {trend}
          </div>
        )}
      </div>
    </div>
  )
}
