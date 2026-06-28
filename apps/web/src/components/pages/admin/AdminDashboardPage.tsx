'use client'

import { StatCard } from '@/components/ui/StatCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Shield, Users } from 'lucide-react'
import { adminApi, type AdminDashboard } from '@/lib/api/services'
import { useResource } from '@/lib/api/hooks'

export function AdminDashboardPage() {
  const { data: dashboard } = useResource<AdminDashboard | null>(
    () => adminApi.dashboard(),
    null,
    [],
  )
  const { data: users } = useResource(() => adminApi.users(), [], [])
  const totals = dashboard?.totals

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-500/10 rounded-lg">
          <Shield className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Platform administration overview.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={totals?.users ?? 0} colorHex="#4d8eff" />
        <StatCard title="Live Sessions" value={totals?.liveSessions ?? 0} colorHex="#4ae176" />
        <StatCard title="Total Bots" value={totals?.bots ?? 0} colorHex="#bdc7d9" />
        <StatCard title="Online Bots" value={totals?.onlineBots ?? 0} colorHex="#4ae176" />
      </div>

      {/* Recent Users */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[#1F2937] flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <h3 className="font-medium text-foreground">Recent Users</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-[#19202e] uppercase font-semibold">
              <tr>
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4">Plan</th>
                <th className="px-5 py-4">Bots</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937]">
              {users.slice(0, 5).map((user) => (
                <tr key={user.id} className="hover:bg-[#1F2937]/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                        {user.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{user.name}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                      {user.plan}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{user.bots}</td>
                  <td className="px-5 py-4"><StatusBadge status={user.status} /></td>
                  <td className="px-5 py-4 text-muted-foreground">{user.joinedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
