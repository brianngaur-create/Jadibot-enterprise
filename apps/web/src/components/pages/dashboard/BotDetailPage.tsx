'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Settings, Power, RefreshCw, BarChart } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { StatCard } from '@/components/ui/StatCard'
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { botsApi, sessionsApi, logsApi } from '@/lib/api/services'
import { useResource } from '@/lib/api/hooks'
import type { Bot } from '@/types'

export function BotDetailPage({ id }: { id: string }) {
  const [activeTab, setActiveTab] = useState('overview')
  const { data: bot, isLoading, refetch } = useResource<Bot | null>(() => botsApi.get(id), null, [id])
  const { data: events } = useResource(() => logsApi.list({ botId: id }), [], [id])

  const restart = async () => {
    await botsApi.restart(id)
    refetch()
  }
  const toggle = async (online: boolean) => {
    await (online ? sessionsApi.disconnect(id) : sessionsApi.reconnect(id))
    refetch()
  }

  if (isLoading || !bot) {
    return <div className="py-24 text-center text-muted-foreground">Loading bot…</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/bots"
            className="p-2 bg-[#111827] border border-[#1F2937] rounded-md text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">{bot.name}</h1>
              <StatusBadge status={bot.status} />
            </div>
            <p className="text-sm font-mono text-muted-foreground">{bot.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {bot.status === 'online' ? (
            <button onClick={() => toggle(true)} className="flex items-center gap-2 bg-[#ffb4ab]/10 text-[#ffb4ab] border border-[#ffb4ab]/20 px-4 py-2 rounded-md text-sm font-medium hover:bg-[#ffb4ab]/20 transition-colors">
              <Power className="w-4 h-4" /> Stop
            </button>
          ) : (
            <button onClick={() => toggle(false)} className="flex items-center gap-2 bg-[#4ae176]/10 text-[#4ae176] border border-[#4ae176]/20 px-4 py-2 rounded-md text-sm font-medium hover:bg-[#4ae176]/20 transition-colors">
              <Power className="w-4 h-4" /> Start
            </button>
          )}
          <button onClick={restart} className="flex items-center gap-2 border border-[#1F2937] px-4 py-2 rounded-md text-sm font-medium hover:bg-[#1F2937] transition-colors">
            <RefreshCw className="w-4 h-4" /> Restart
          </button>
          <Link
            href={`/dashboard/bots/${bot.id}/settings`}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 shadow-[inset_0_0_10px_rgba(255,255,255,0.2)]"
          >
            <Settings className="w-4 h-4" /> Settings
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#1F2937]">
        <div className="flex gap-6">
          {['overview', 'logs', 'sessions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium capitalize transition-colors relative ${
                activeTab === tab ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Messages Handled" value={bot.messagesHandled.toLocaleString()} colorHex="#4d8eff" />
            <StatCard title="Active Users" value={bot.activeUsers.toLocaleString()} colorHex="#4ae176" />
            <StatCard title="Ping" value={bot.ping != null ? `${bot.ping}ms` : 'N/A'} colorHex={bot.ping != null && bot.ping < 100 ? '#4ae176' : '#ffb4ab'} trendUp={false} trend={bot.ping != null ? '-2ms' : undefined} />
            <StatCard title="Uptime" value={bot.uptime} colorHex="#bdc7d9" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#111827] border border-[#1F2937] rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Message Activity Today</h3>
                <BarChart className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={events.map((e) => ({ time: new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), messages: 1 }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorBotMsgs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4d8eff" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#4d8eff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" stroke="#8c909f" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1F2937', color: '#dce2f6' }} itemStyle={{ color: '#4d8eff' }} />
                    <Area type="monotone" dataKey="messages" stroke="#4d8eff" strokeWidth={2} fillOpacity={1} fill="url(#colorBotMsgs)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-5">
              <h3 className="font-semibold text-foreground mb-4">Recent Events</h3>
              <div className="space-y-4">
                {events.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recent events.</p>
                ) : (
                  events.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="mt-1 w-2 h-2 rounded-full bg-primary shrink-0" />
                      <div className="text-sm">
                        <span className="text-muted-foreground">{activity.message}</span>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {new Date(activity.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab !== 'overview' && (
        <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-12 text-center text-muted-foreground">
          <p>Content for <span className="font-medium text-foreground capitalize">{activeTab}</span> will appear here.</p>
        </div>
      )}
    </div>
  )
}
