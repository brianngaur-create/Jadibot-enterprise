'use client'

import { StatusBadge } from '@/components/ui/StatusBadge'
import { StatCard } from '@/components/ui/StatCard'
import { Server } from 'lucide-react'
import { adminApi, botsApi, type AdminDashboard } from '@/lib/api/services'
import { useResource } from '@/lib/api/hooks'

const gb = (bytes: number) => `${(bytes / 1024 ** 3).toFixed(1)} GB`

export function MonitoringPage() {
  const { data: monitoring } = useResource<AdminDashboard | null>(() => adminApi.monitoring(), null, [])
  const { data: bots } = useResource(() => botsApi.list(), [], [])
  const system = monitoring?.system
  const totals = monitoring?.totals

  const serverMetrics = system
    ? [
        { label: 'CPU Usage', value: `${system.cpu}%`, current: system.cpu, color: '#4d8eff' },
        {
          label: 'Memory Usage',
          value: `${gb(system.memory.used)} / ${gb(system.memory.total)}`,
          current: system.memory.percent,
          color: '#4ae176',
        },
      ]
    : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">System Monitoring</h1>
        <p className="text-sm text-muted-foreground">Real-time platform infrastructure health.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Server Load" value={`${system?.cpu ?? 0}%`} colorHex="#4d8eff" />
        <StatCard title="Memory Used" value={system ? gb(system.memory.used) : '—'} colorHex="#4ae176" />
        <StatCard title="Total Bots Active" value={(totals?.onlineBots ?? 0).toString()} colorHex="#bdc7d9" />
        <StatCard title="Live Sessions" value={(totals?.liveSessions ?? 0).toString()} colorHex="#ffb4ab" />
      </div>

      {/* Server Metrics */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-6">
        <h3 className="font-semibold text-foreground mb-5">Infrastructure Metrics</h3>
        <div className="space-y-5">
          {serverMetrics.map((metric) => (
            <div key={metric.label}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm text-foreground">{metric.label}</span>
                <span className="text-sm font-mono text-muted-foreground">{metric.value}</span>
              </div>
              <div className="h-2 bg-[#1F2937] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${metric.current}%`, backgroundColor: metric.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bot Status Table */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[#1F2937] flex items-center gap-2">
          <Server className="w-4 h-4 text-primary" />
          <h3 className="font-medium text-foreground">Bot Instance Health</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-[#19202e] uppercase font-semibold">
              <tr>
                <th className="px-5 py-4">Instance</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Uptime</th>
                <th className="px-5 py-4">Ping</th>
                <th className="px-5 py-4">Messages</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937]">
              {bots.map((bot) => (
                <tr key={bot.id} className="hover:bg-[#1F2937]/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-medium text-foreground">{bot.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{bot.id}</div>
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={bot.status} /></td>
                  <td className="px-5 py-4 text-muted-foreground">{bot.uptime || '—'}</td>
                  <td className="px-5 py-4">
                    {bot.ping != null ? (
                      <span className={bot.ping < 100 ? 'text-[#4ae176]' : 'text-amber-400'}>
                        {bot.ping}ms
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{bot.messagesHandled.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
