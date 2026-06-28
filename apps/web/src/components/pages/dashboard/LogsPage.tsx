'use client'

import { useState } from 'react'
import { LogRow } from '@/components/ui/LogRow'
import { RefreshCw, Download } from 'lucide-react'
import type { LogLevel } from '@/types'
import { logsApi } from '@/lib/api/services'
import { useResource } from '@/lib/api/hooks'

const LEVELS: Array<LogLevel | 'all'> = ['all', 'info', 'warn', 'error', 'debug']

export function LogsPage() {
  const [level, setLevel] = useState<LogLevel | 'all'>('all')
  const { data: logs, isLoading, refetch } = useResource(() => logsApi.list(), [], [])

  const filtered = level === 'all' ? logs : logs.filter((l) => l.level === level)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">System Logs</h1>
          <p className="text-sm text-muted-foreground">Real-time platform event logs.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 bg-[#111827] border border-[#1F2937] rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-[#19202e] transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={refetch} className="flex items-center gap-2 px-3 py-2 bg-[#111827] border border-[#1F2937] rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-[#19202e] transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Level Filter */}
      <div className="flex flex-wrap gap-2">
        {LEVELS.map((l) => (
          <button
            key={l}
            onClick={() => setLevel(l)}
            className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase font-semibold tracking-wider transition-colors ${
              level === l
                ? 'bg-primary/10 text-primary border border-primary/30'
                : 'bg-[#111827] border border-[#1F2937] text-muted-foreground hover:text-foreground'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="bg-[#111827] border border-[#1F2937] rounded-lg overflow-hidden">
        <div className="p-3 border-b border-[#1F2937] bg-[#19202e]/50 flex items-center gap-3 text-xs text-muted-foreground font-mono px-4">
          <span className="w-40 shrink-0">Timestamp</span>
          <span className="w-20 shrink-0">Level</span>
          <span className="flex-1">Message</span>
          <span className="w-32 text-right shrink-0">Source</span>
        </div>
        <div>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Loading logs…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No logs for selected level.</div>
          ) : (
            filtered.map((log) => <LogRow key={log.id} log={log} />)
          )}
        </div>
      </div>
    </div>
  )
}
