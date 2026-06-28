'use client'

import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: 'online' | 'offline' | 'suspended' | 'active'
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const isOnline = status === 'online' || status === 'active'

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium',
        isOnline
          ? 'bg-[#4ae176]/10 text-[#4ae176] border border-[#4ae176]/20'
          : 'bg-[#ffb4ab]/10 text-[#ffb4ab] border border-[#ffb4ab]/20',
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        {isOnline && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ae176] opacity-75" />
        )}
        <span
          className={cn(
            'relative inline-flex rounded-full h-2 w-2',
            isOnline ? 'bg-[#4ae176]' : 'bg-[#ffb4ab]'
          )}
        />
      </span>
      <span className="capitalize">{status}</span>
    </div>
  )
}
