'use client'

import { useState } from 'react'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'
import { Search, Edit2, Trash2, Plus } from 'lucide-react'
import { commandsApi } from '@/lib/api/services'
import { useResource } from '@/lib/api/hooks'

export function CommandManagerPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const { data: commands, refetch } = useResource(() => commandsApi.list(), [], [])

  const toggle = async (id: string, enabled: boolean) => {
    await commandsApi.setEnabled(id, enabled)
    refetch()
  }

  const filteredCommands = commands.filter(
    (c) =>
      c.command.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Command Manager</h1>
          <p className="text-sm text-muted-foreground">Manage and toggle bot commands.</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 shadow-[inset_0_0_10px_rgba(255,255,255,0.2)]">
          <Plus className="w-4 h-4" /> Add Command
        </button>
      </div>

      <div className="bg-[#111827] border border-[#1F2937] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[#1F2937]">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search commands..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0B1220] border border-[#1F2937] rounded-md pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-[#19202e] uppercase font-semibold">
              <tr>
                <th className="px-5 py-4">Command</th>
                <th className="px-5 py-4">Description</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Usage</th>
                <th className="px-5 py-4 text-center">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937]">
              {filteredCommands.map((cmd) => (
                <tr key={cmd.id} className="hover:bg-[#1F2937]/30 transition-colors">
                  <td className="px-5 py-4 font-mono font-medium text-primary">{cmd.command}</td>
                  <td className="px-5 py-4 text-muted-foreground">{cmd.description}</td>
                  <td className="px-5 py-4">
                    <span className="text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 bg-[#1F2937] rounded-full text-foreground">
                      {cmd.category}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{cmd.usage.toLocaleString()}</td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex justify-center">
                      <ToggleSwitch checked={cmd.enabled} onChange={(v) => toggle(cmd.id, v)} />
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-[#1F2937] rounded transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-[#ffb4ab] hover:text-red-400 hover:bg-[#ffb4ab]/10 rounded transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
