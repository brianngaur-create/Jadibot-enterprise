'use client'

import Link from 'next/link'
import { Server, Activity, MessageSquare, Settings } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import type { Bot } from '@/types'

export function BotCard({ bot }: { bot: Bot }) {
  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-5 flex flex-col hover:-translate-y-1 transition-transform duration-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded bg-primary/20 flex items-center justify-center text-primary font-bold">
            {bot.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{bot.name}</h3>
            <p className="text-xs text-muted-foreground font-mono">{bot.id}</p>
          </div>
        </div>
        <StatusBadge status={bot.status} />
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Server className="w-4 h-4 text-primary shrink-0" />
          <span className="truncate">{bot.device}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MessageSquare className="w-4 h-4 text-primary shrink-0" />
          <span>{bot.messagesHandled.toLocaleString()} messages</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Activity className="w-4 h-4 text-primary shrink-0" />
          <span>{bot.ping != null ? `${bot.ping}ms ping` : 'Offline'}</span>
        </div>
      </div>

      <div className="mt-auto flex gap-2">
        <Link
          href={`/dashboard/bots/${bot.id}`}
          className="flex-1 text-center py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Manage Bot
        </Link>
        <Link
          href={`/dashboard/bots/${bot.id}/settings`}
          className="px-3 py-2 border border-[#1F2937] rounded-md text-muted-foreground hover:bg-[#1F2937] transition-colors flex items-center justify-center"
          aria-label="Bot settings"
        >
          <Settings className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
