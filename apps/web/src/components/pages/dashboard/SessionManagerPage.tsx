'use client'

import { useState } from 'react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { QRCodeModal } from '@/components/ui/QRCodeModal'
import { QrCode, Power, RefreshCw, Trash2 } from 'lucide-react'
import { botsApi, sessionsApi } from '@/lib/api/services'
import { useResource } from '@/lib/api/hooks'

export function SessionManagerPage() {
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null)
  const [showQR, setShowQR] = useState(false)
  const { data: bots, refetch } = useResource(() => botsApi.list(), [], [])

  const handleShowQR = (id: string, name: string) => {
    setSelected({ id, name })
    setShowQR(true)
  }

  const restart = async (id: string) => {
    await sessionsApi.reconnect(id)
    refetch()
  }

  const toggle = async (id: string, online: boolean) => {
    await (online ? sessionsApi.disconnect(id) : sessionsApi.reconnect(id))
    refetch()
  }

  const remove = async (id: string) => {
    if (!window.confirm('Log out and remove this session?')) return
    await sessionsApi.logout(id)
    refetch()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Session Manager</h1>
        <p className="text-sm text-muted-foreground">Manage active WhatsApp sessions and device links.</p>
      </div>

      <div className="bg-[#111827] border border-[#1F2937] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[#1F2937] flex items-center justify-between">
          <h3 className="font-medium text-foreground">Active Sessions ({bots.filter((b) => b.status === 'online').length})</h3>
          <span className="text-xs text-muted-foreground">{bots.length} total sessions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-[#19202e] uppercase font-semibold">
              <tr>
                <th className="px-5 py-4">Bot</th>
                <th className="px-5 py-4">Device</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Uptime</th>
                <th className="px-5 py-4">Ping</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937]">
              {bots.map((bot) => (
                <tr key={bot.id} className="hover:bg-[#1F2937]/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                        {bot.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{bot.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{bot.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground text-xs">{bot.device}</td>
                  <td className="px-5 py-4"><StatusBadge status={bot.status} /></td>
                  <td className="px-5 py-4 text-muted-foreground">{bot.uptime || '—'}</td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {bot.ping != null ? (
                      <span className={bot.ping < 100 ? 'text-[#4ae176]' : 'text-amber-400'}>
                        {bot.ping}ms
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleShowQR(bot.id, bot.name)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors" title="Link Device">
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button onClick={() => restart(bot.id)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-[#1F2937] rounded transition-colors" title="Restart">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button onClick={() => toggle(bot.id, bot.status === 'online')} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-[#1F2937] rounded transition-colors" title="Toggle">
                        <Power className="w-4 h-4" />
                      </button>
                      <button onClick={() => remove(bot.id)} className="p-1.5 text-[#ffb4ab] hover:text-red-400 hover:bg-[#ffb4ab]/10 rounded transition-colors" title="Delete">
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

      <QRCodeModal
        isOpen={showQR}
        onClose={() => {
          setShowQR(false)
          refetch()
        }}
        botName={selected?.name ?? ''}
        botId={selected?.id}
      />
    </div>
  )
}
