'use client'

import Link from 'next/link'
import { Bell, Search, Menu, Plus } from 'lucide-react'
import { useAuth } from '@/lib/auth/store'
import { sanitizeSearchQuery } from '@/lib/validation/schemas'
import { useState, useId } from 'react'
import { notificationsApi } from '@/lib/api/services'
import { useResource } from '@/lib/api/hooks'

interface TopBarProps {
  onMenuClick: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { user } = useAuth()
  const searchId = useId()
  const [searchValue, setSearchValue] = useState('')
  const { data: notifications } = useResource(() => notificationsApi.list(), [], [])
  const unreadCount = notifications.filter((n) => !n.read).length

  const displayName = user?.name ?? 'User'
  const initials = user?.avatarInitials ?? displayName.slice(0, 2).toUpperCase()

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(sanitizeSearchQuery(e.target.value))
  }

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-1 focus:ring-primary rounded"
          aria-label="Open navigation menu"
          aria-expanded={false}
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="relative hidden sm:block w-64">
          <label htmlFor={searchId} className="sr-only">Search commands and bots</label>
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" aria-hidden="true" />
          <input
            id={searchId}
            type="search"
            value={searchValue}
            onChange={handleSearch}
            placeholder="Search commands, bots..."
            maxLength={200}
            autoComplete="off"
            className="w-full bg-[#0B1220] border border-[#1F2937] rounded-md pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/bots/create"
          className="hidden sm:flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Deploy Bot
        </Link>

        <Link
          href="/dashboard/notifications"
          className="relative p-2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-1 focus:ring-primary rounded"
          aria-label={unreadCount > 0 ? `Notifications — ${unreadCount} unread` : 'Notifications'}
        >
          <Bell className="w-5 h-5" aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ffb4ab] rounded-full border border-card" aria-hidden="true" />
          )}
        </Link>

        <Link
          href="/dashboard/profile"
          className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 text-primary font-bold text-sm cursor-pointer hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label={`Profile — ${displayName}`}
        >
          <span aria-hidden="true">{initials}</span>
        </Link>
      </div>
    </header>
  )
}
