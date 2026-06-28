'use client'

import { useState } from 'react'
import { Wrench, AlertTriangle, Database, RefreshCw, Trash2, Download } from 'lucide-react'

const maintenanceTasks = [
  { id: 'clear-cache', icon: Trash2, label: 'Clear Application Cache', desc: 'Flush Redis and in-memory cache', danger: false },
  { id: 'reindex-db', icon: Database, label: 'Reindex Database', desc: 'Rebuild PostgreSQL indexes for performance', danger: false },
  { id: 'restart-workers', icon: RefreshCw, label: 'Restart Worker Processes', desc: 'Gracefully restart all background workers', danger: false },
  { id: 'purge-logs', icon: Trash2, label: 'Purge Old Logs (30d+)', desc: 'Delete logs older than 30 days', danger: true },
  { id: 'export-data', icon: Download, label: 'Export Platform Data', desc: 'Generate full platform data export', danger: false },
]

export function MaintenancePage() {
  const [running, setRunning] = useState<string | null>(null)
  const [done, setDone] = useState<string[]>([])

  const runTask = (id: string) => {
    setRunning(id)
    setTimeout(() => {
      setRunning(null)
      setDone((prev) => [...prev, id])
    }, 2000)
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Maintenance</h1>
        <p className="text-sm text-muted-foreground">Platform maintenance and operational tasks.</p>
      </div>

      {/* Warning Banner */}
      <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
        <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
        <div className="text-sm text-amber-400">
          <strong className="font-semibold">Admin Only Area.</strong> These actions affect the entire platform. Some operations may cause brief downtime. Proceed with caution.
        </div>
      </div>

      {/* Maintenance Tasks */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[#1F2937] flex items-center gap-2">
          <Wrench className="w-4 h-4 text-primary" />
          <h3 className="font-medium text-foreground">Maintenance Tasks</h3>
        </div>
        <div className="divide-y divide-[#1F2937]">
          {maintenanceTasks.map((task) => {
            const Icon = task.icon
            const isRunning = running === task.id
            const isDone = done.includes(task.id)
            return (
              <div key={task.id} className="p-5 flex items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg shrink-0 ${task.danger ? 'bg-[#ffb4ab]/10 text-[#ffb4ab]' : 'bg-primary/10 text-primary'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground text-sm">{task.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{task.desc}</div>
                    {isDone && <div className="text-xs text-[#4ae176] mt-1">✓ Completed successfully</div>}
                  </div>
                </div>
                <button
                  onClick={() => runTask(task.id)}
                  disabled={isRunning}
                  className={`shrink-0 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    isRunning
                      ? 'opacity-50 cursor-not-allowed'
                      : task.danger
                        ? 'bg-[#ffb4ab]/10 text-[#ffb4ab] border border-[#ffb4ab]/30 hover:bg-[#ffb4ab]/20'
                        : 'bg-[#1F2937] text-foreground hover:bg-[#2a3448]'
                  }`}
                >
                  {isRunning ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Running...
                    </span>
                  ) : 'Run'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
