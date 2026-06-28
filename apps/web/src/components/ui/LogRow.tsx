'use client'

import type { Log } from '@/types'

const levelConfig: Record<Log['level'], { color: string; bg: string }> = {
  info: { color: 'text-[#4d8eff]', bg: 'bg-[#4d8eff]/10' },
  warn: { color: 'text-amber-400', bg: 'bg-amber-400/10' },
  error: { color: 'text-[#ffb4ab]', bg: 'bg-[#ffb4ab]/10' },
  debug: { color: 'text-[#8c909f]', bg: 'bg-[#8c909f]/10' },
}

export function LogRow({ log }: { log: Log }) {
  const config = levelConfig[log.level]

  return (
    <div className="flex items-center py-2 border-b border-[#1F2937] hover:bg-[#1F2937]/30 transition-colors text-sm px-4">
      <div className="w-40 font-mono text-muted-foreground text-xs whitespace-nowrap shrink-0">
        {log.timestamp}
      </div>
      <div className="w-20 shrink-0">
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-wider ${config.color} ${config.bg}`}
        >
          {log.level}
        </span>
      </div>
      <div className="flex-1 text-foreground min-w-0 truncate">{log.message}</div>
      <div className="w-32 text-right text-xs text-muted-foreground truncate shrink-0">
        {log.source}
      </div>
    </div>
  )
}
