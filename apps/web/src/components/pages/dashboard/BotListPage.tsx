'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { BotCard } from '@/components/ui/BotCard'
import { botsApi } from '@/lib/api/services'
import { useResource } from '@/lib/api/hooks'

export function BotListPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'online' | 'offline'>('all')
  const { data: bots, isLoading, error } = useResource(() => botsApi.list(), [])

  const filtered = bots.filter((b) => {
    const matchSearch = b.name.toLowerCase().includes(search.toLowerCase()) || b.id.includes(search)
    const matchFilter = filter === 'all' || b.status === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Bot Fleet</h1>
          <p className="text-sm text-muted-foreground">Manage and monitor all your bot instances.</p>
        </div>
        <Link
          href="/dashboard/bots/create"
          className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 shadow-[inset_0_0_10px_rgba(255,255,255,0.2)] w-fit"
        >
          <Plus className="w-4 h-4" /> Deploy New Bot
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search bots..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111827] border border-[#1F2937] rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'online', 'offline'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : 'bg-[#111827] border border-[#1F2937] text-muted-foreground hover:text-foreground'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Bot Grid */}
      {isLoading ? (
        <div className="text-center py-24 text-muted-foreground">Loading bots…</div>
      ) : error ? (
        <div className="text-center py-24 text-destructive">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          <p className="text-lg">No bots found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((bot) => (
            <BotCard key={bot.id} bot={bot} />
          ))}
        </div>
      )}
    </div>
  )
}
