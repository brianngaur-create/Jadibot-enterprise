'use client'

import { useState } from 'react'
import { PluginCard } from '@/components/ui/PluginCard'
import { Search, Filter, Upload } from 'lucide-react'
import { pluginsApi } from '@/lib/api/services'
import { useResource } from '@/lib/api/hooks'

export function PluginManagerPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const { data: plugins, isLoading, error } = useResource(() => pluginsApi.list(), [], [])

  const filteredPlugins = plugins.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Plugin Manager</h1>
          <p className="text-sm text-muted-foreground">Extend your bots with custom functionality.</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 shadow-[inset_0_0_10px_rgba(255,255,255,0.2)]">
          <Upload className="w-4 h-4" /> Upload Plugin
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search plugins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#111827] border border-[#1F2937] rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#111827] border border-[#1F2937] rounded-md text-sm font-medium text-foreground hover:bg-[#19202e] transition-colors">
          <Filter className="w-4 h-4" /> All Categories
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-24 text-muted-foreground">Loading plugins…</div>
      ) : error ? (
        <div className="text-center py-24 text-destructive">{error}</div>
      ) : filteredPlugins.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">No plugins found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlugins.map((plugin) => (
            <PluginCard key={plugin.id} plugin={plugin} />
          ))}
        </div>
      )}
    </div>
  )
}
