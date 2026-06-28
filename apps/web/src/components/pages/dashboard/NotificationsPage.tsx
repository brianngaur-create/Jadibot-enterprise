'use client'

import { CheckCheck, AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { notificationsApi } from '@/lib/api/services'
import { useResource } from '@/lib/api/hooks'

const NotificationIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'error': return <AlertCircle className="w-5 h-5 text-[#ffb4ab]" />
    case 'success': return <CheckCircle2 className="w-5 h-5 text-[#4ae176]" />
    case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-400" />
    default: return <Info className="w-5 h-5 text-[#4d8eff]" />
  }
}

export function NotificationsPage() {
  const { data: notifications, isLoading, refetch } = useResource(
    () => notificationsApi.list(),
    [],
    [],
  )

  const markAll = async () => {
    await notificationsApi.markAllRead()
    refetch()
  }

  const markOne = async (id: string) => {
    await notificationsApi.markRead(id)
    refetch()
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">Alerts and system updates.</p>
        </div>
        <button onClick={markAll} className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors">
          <CheckCheck className="w-4 h-4" /> Mark all as read
        </button>
      </div>

      <div className="bg-[#111827] border border-[#1F2937] rounded-lg overflow-hidden">
        <div className="divide-y divide-[#1F2937]">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Loading notifications…</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No notifications.</div>
          ) : (
            notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => !notification.read && markOne(notification.id)}
              className={cn(
                'p-4 flex gap-4 transition-colors hover:bg-[#1F2937]/30 cursor-pointer',
                !notification.read ? 'bg-[#19202e]' : 'opacity-70'
              )}
            >
              <div className="mt-1 shrink-0">
                <NotificationIcon type={notification.type} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className={cn('font-medium', !notification.read ? 'text-foreground' : 'text-muted-foreground')}>
                    {notification.title}
                  </h4>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">{notification.time}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
              </div>
              {!notification.read && (
                <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
              )}
            </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
