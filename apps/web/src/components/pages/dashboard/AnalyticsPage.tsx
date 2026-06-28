'use client'

import { StatCard } from '@/components/ui/StatCard'
import { analyticsApi, botsApi, commandsApi } from '@/lib/api/services'
import { useResource } from '@/lib/api/hooks'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts'

const pieData = [
  { name: 'AI Chat', value: 42, color: '#4d8eff' },
  { name: 'Sticker', value: 23, color: '#4ae176' },
  { name: 'Media', value: 18, color: '#ffb4ab' },
  { name: 'Admin', value: 17, color: '#bdc7d9' },
]

export function AnalyticsPage() {
  const { data: overview } = useResource(
    () => analyticsApi.overview(),
    { totalBots: 0, onlineBots: 0, offlineBots: 0, messagesHandled: 0, activeUsers: 0, chart: [] },
    [],
  )
  const { data: bots } = useResource(() => botsApi.list(), [], [])
  const { data: commands } = useResource(() => commandsApi.list(), [], [])

  const onlinePings = bots.filter((b) => b.ping != null).map((b) => b.ping as number)
  const avgPing = onlinePings.length
    ? (onlinePings.reduce((a, b) => a + b, 0) / onlinePings.length / 1000).toFixed(1)
    : '0.0'
  const commandsExecuted = commands.reduce((sum, c) => sum + c.usage, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">Platform-wide performance and engagement metrics.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Messages" value={overview.messagesHandled.toLocaleString()} colorHex="#4d8eff" />
        <StatCard title="Active Users" value={overview.activeUsers.toLocaleString()} colorHex="#4ae176" />
        <StatCard title="Avg Response Time" value={`${avgPing}s`} colorHex="#bdc7d9" />
        <StatCard title="Commands Executed" value={commandsExecuted.toLocaleString()} colorHex="#ffb4ab" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#111827] border border-[#1F2937] rounded-lg p-5">
          <h3 className="font-semibold text-foreground mb-4">Message Volume — 7 Days</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={overview.chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="aMessages" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4d8eff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4d8eff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="date" stroke="#8c909f" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#8c909f" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1F2937', color: '#dce2f6', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="messages" stroke="#4d8eff" strokeWidth={2} fillOpacity={1} fill="url(#aMessages)" name="Messages" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-5">
          <h3 className="font-semibold text-foreground mb-4">Command Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="name">
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1F2937', color: '#dce2f6', borderRadius: '8px' }} />
                <Legend formatter={(value) => <span style={{ color: '#8c909f', fontSize: 12 }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart Row 2 */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-5">
        <h3 className="font-semibold text-foreground mb-4">Bot Performance Comparison</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bots} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey="name" stroke="#8c909f" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#8c909f" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1F2937', color: '#dce2f6', borderRadius: '8px' }} />
              <Bar dataKey="messagesHandled" fill="#4d8eff" radius={[4, 4, 0, 0]} name="Messages Handled" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
