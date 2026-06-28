'use client'

import { useState } from 'react'
import { Puzzle } from 'lucide-react'
import { ToggleSwitch } from './ToggleSwitch'
import type { Plugin } from '@/types'

export function PluginCard({ plugin }: { plugin: Plugin }) {
  const [active, setActive] = useState(plugin.status === 'active')

  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-5 flex flex-col relative overflow-hidden group">
      <div className="absolute top-4 right-4">
        <ToggleSwitch checked={active} onChange={setActive} />
      </div>

      <div className="flex items-center gap-3 mb-3 pr-12">
        <div className="p-2 bg-primary/10 rounded-md text-primary shrink-0">
          <Puzzle className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h3 className="font-medium text-foreground truncate">{plugin.name}</h3>
          <span className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground px-2 py-0.5 bg-[#1F2937] rounded-full">
            {plugin.category}
          </span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4 flex-1 line-clamp-2">
        {plugin.description}
      </p>

      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-[#1F2937] pt-3 mt-auto">
        <span>v{plugin.version}</span>
        <span>By {plugin.author}</span>
      </div>
    </div>
  )
}
