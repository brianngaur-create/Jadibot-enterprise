'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Bot, RefreshCw, BarChart3,
  ScrollText, Bell, Key, User, LogOut,
  Shield, Server, Users, Settings as SettingsIcon, Wrench, X, Loader2
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth/store'
import { notificationsApi } from '@/lib/api/services'
import { useResource } from '@/lib/api/hooks'
import type { NavLink } from '@/types'

interface SidebarProps {
  mobileOpen: boolean
  onClose: () => void
}

const mainLinks: NavLink[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/bots', icon: Bot, label: 'Bot List' },
  { href: '/dashboard/sessions', icon: RefreshCw, label: 'Session Manager' },
  { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/dashboard/logs', icon: ScrollText, label: 'Logs' },
]

const adminLinks: NavLink[] = [
  { href: '/admin', icon: Shield, label: 'Admin Panel' },
  { href: '/admin/users', icon: Users, label: 'User Management' },
  { href: '/admin/monitoring', icon: Server, label: 'Monitoring' },
  { href: '/admin/settings', icon: SettingsIcon, label: 'Platform Settings' },
  { href: '/admin/maintenance', icon: Wrench, label: 'Maintenance' },
]

function useBottomLinks(): NavLink[] {
  const { data: notifications } = useResource(() => notificationsApi.list(), [], [])
  const unreadCount = notifications.filter((n) => !n.read).length
  return [
    { href: '/dashboard/notifications', icon: Bell, label: 'Notifications', badge: unreadCount },
    { href: '/dashboard/api-keys', icon: Key, label: 'API Keys' },
    { href: '/dashboard/profile', icon: User, label: 'Profile' },
    { href: '/dashboard/settings', icon: SettingsIcon, label: 'Settings' },
  ]
}

function NavItem({ link, onClose }: { link: NavLink; onClose: () => void }) {
  const pathname = usePathname()
  const isActive =
    pathname === link.href ||
    (link.href !== '/dashboard' && link.href !== '/admin' && pathname.startsWith(link.href))
  const Icon = link.icon

  return (
    <Link
      href={link.href}
      onClick={onClose}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-1 focus:ring-primary',
        isActive
          ? 'bg-primary/10 text-primary border-l-2 border-primary pl-[10px]'
          : 'text-muted-foreground hover:bg-[#1F2937] hover:text-foreground'
      )}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
        {link.label}
      </div>
      {link.badge != null && link.badge > 0 && (
        <span
          className="bg-[#ffb4ab] text-[#690005] text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none"
          aria-label={`${link.badge} unread`}
        >
          {link.badge}
        </span>
      )}
    </Link>
  )
}

function SignOutButton({ onClose }: { onClose: () => void }) {
  const { logout } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    onClose()
    try {
      await logout()
      router.replace('/login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      aria-busy={loading}
      className="w-full mt-1 flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-destructive"
    >
      {loading
        ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        : <LogOut className="w-4 h-4" aria-hidden="true" />
      }
      {loading ? 'Signing out…' : 'Sign Out'}
    </button>
  )
}

function SidebarContent({ onClose }: { onClose: () => void }) {
  const pathname = usePathname()
  const { isAdmin } = useAuth()
  const showAdmin = isAdmin && pathname.startsWith('/admin')
  const bottomLinks = useBottomLinks()

  return (
    <>
      <div className="h-16 flex items-center justify-between px-6 border-b border-sidebar-border shrink-0">
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-2 focus:outline-none focus:ring-1 focus:ring-primary rounded"
          aria-label="JadiBot home"
        >
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center" aria-hidden="true">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight">JadiBot</span>
        </Link>
        <button
          onClick={onClose}
          className="md:hidden p-1 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-1 focus:ring-primary rounded"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-8" aria-label="Main navigation">
        <div>
          <h4 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Platform
          </h4>
          <ul className="space-y-1" role="list">
            {mainLinks.map((link) => (
              <li key={link.href}>
                <NavItem link={link} onClose={onClose} />
              </li>
            ))}
          </ul>
        </div>

        {showAdmin && (
          <div>
            <h4 className="px-3 text-xs font-semibold text-amber-500/80 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Shield className="w-3 h-3" aria-hidden="true" /> Administration
            </h4>
            <ul className="space-y-1" role="list">
              {adminLinks.map((link) => (
                <li key={link.href}>
                  <NavItem link={link} onClose={onClose} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>

      <div className="p-3 border-t border-sidebar-border shrink-0">
        <ul className="space-y-1" role="list">
          {bottomLinks.map((link) => (
            <li key={link.href}>
              <NavItem link={link} onClose={onClose} />
            </li>
          ))}
        </ul>
        <SignOutButton onClose={onClose} />
      </div>
    </>
  )
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 w-64 bg-sidebar border-r border-sidebar-border hidden md:flex flex-col z-20">
        <SidebarContent onClose={onClose} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 w-72 bg-sidebar border-r border-sidebar-border flex flex-col z-50">
            <SidebarContent onClose={onClose} />
          </aside>
        </div>
      )}
    </>
  )
}
