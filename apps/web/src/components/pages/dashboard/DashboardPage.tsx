'use client'

import Link from 'next/link'
import { Plus, ArrowRight } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { analyticsApi, botsApi, logsApi } from '@/lib/api/services'
import { useResource } from '@/lib/api/hooks'
import { useAuth } from '@/lib/auth/store'

export function DashboardPage() {
  const { user } = useAuth()
  const { data: overview } = useResource(
    () => analyticsApi.overview(),
    { totalBots: 0, onlineBots: 0, offlineBots: 0, messagesHandled: 0, activeUsers: 0, chart: [] },
    [],
  )
  const { data: bots } = useResource(() => botsApi.list(), [], [])
  const { data: logs } = useResource(() => logsApi.list(), [], [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back{user ? `, ${user.name.split(' ')[0]}` : ''}. Here&apos;s your platform overview.</p>
        </div>
        <Link
          href="/dashboard/bots/create"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity shadow-[inset_0_0_10px_rgba(255,255,255,0.2)] w-fit"
        >
          <Plus className="w-4 h-4" /> Deploy New Bot
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Online Bots" value={overview.onlineBots} colorHex="#4ae176" />
        <StatCard title="Offline Bots" value={overview.offlineBots} trendUp={false} colorHex="#ffb4ab" />
        <StatCard title="Messages Handled" value={overview.messagesHandled.toLocaleString()} colorHex="#4d8eff" />
        <StatCard title="Active Users" value={overview.activeUsers.toLocaleString()} colorHex="#bdc7d9" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main chart */}
        <div className="lg:col-span-2 bg-[#111827] border border-[#1F2937] rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Message Activity</h3>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={overview.chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4d8eff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4d8eff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ae176" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4ae176" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#8c909f" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#1F2937', color: '#dce2f6', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="messages" stroke="#4d8eff" strokeWidth={2} fillOpacity={1} fill="url(#colorMessages)" name="Messages" />
                <Area type="monotone" dataKey="users" stroke="#4ae176" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" name="Users" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-6 mt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-3 h-0.5 bg-[#4d8eff]" /> Messages
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-3 h-0.5 bg-[#4ae176]" /> Users
            </div>
          </div>
        </div>

        {/* Activity feed */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-5">
          <h3 className="font-semibold text-foreground mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity.</p>
            ) : (
              logs.slice(0, 6).map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="mt-1 w-2 h-2 rounded-full bg-primary shrink-0 ring-4 ring-primary/10" />
                  <div className="text-sm min-w-0">
                    <span className="text-muted-foreground font-mono text-xs">{activity.source} </span>
                    <span className="text-muted-foreground">{activity.message}</span>
                    <div className="text-xs text-muted-foreground/60 mt-0.5">
                      {new Date(activity.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bot Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Your Bots</h3>
          <Link href="/dashboard/bots" className="text-sm text-primary hover:text-primary/80 flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {bots.map((bot) => (
            <Link
              key={bot.id}
              href={`/dashboard/bots/${bot.id}`}
              className="bg-[#111827] border border-[#1F2937] rounded-lg p-4 hover:border-primary/40 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="h-9 w-9 rounded bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                  {bot.name.substring(0, 2).toUpperCase()}
                </div>
                <StatusBadge status={bot.status} />
              </div>
              <h4 className="font-medium text-foreground text-sm truncate mb-1">{bot.name}</h4>
              <p className="text-xs text-muted-foreground font-mono mb-3 truncate">{bot.id}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{bot.messagesHandled.toLocaleString()} msgs</span>
                <span>{bot.ping != null ? `${bot.ping}ms` : 'Offline'}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
