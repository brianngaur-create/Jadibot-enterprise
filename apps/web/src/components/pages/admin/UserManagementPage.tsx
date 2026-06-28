'use client'

import { useState } from 'react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Search, UserPlus, Edit2, Trash2, Shield } from 'lucide-react'
import { adminApi } from '@/lib/api/services'
import { useResource } from '@/lib/api/hooks'

export function UserManagementPage() {
  const [search, setSearch] = useState('')
  const { data: users, isLoading, refetch } = useResource(() => adminApi.users(), [], [])

  const toggleStatus = async (id: string, status: string) => {
    await adminApi.updateUser(id, { status: status === 'active' ? 'suspended' : 'active' })
    refetch()
  }
  const removeUser = async (id: string) => {
    if (!window.confirm('Delete this user and all their data?')) return
    await adminApi.deleteUser(id)
    refetch()
  }

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">User Management</h1>
          <p className="text-sm text-muted-foreground">Manage all platform users and their permissions.</p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 shadow-[inset_0_0_10px_rgba(255,255,255,0.2)]">
          <UserPlus className="w-4 h-4" /> Invite User
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#111827] border border-[#1F2937] rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="bg-[#111827] border border-[#1F2937] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-[#19202e] uppercase font-semibold">
              <tr>
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4">Plan</th>
                <th className="px-5 py-4">Bots</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Joined</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937]">
              {isLoading ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">Loading users…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">No users found.</td></tr>
              ) : (
              filtered.map((user) => (
                <tr key={user.id} className="hover:bg-[#1F2937]/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
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
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-[#1F2937] rounded transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => toggleStatus(user.id, user.status)} className="p-1.5 text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 rounded transition-colors" title={user.status === 'active' ? 'Suspend' : 'Activate'}>
                        <Shield className="w-4 h-4" />
                      </button>
                      <button onClick={() => removeUser(user.id)} className="p-1.5 text-[#ffb4ab] hover:text-red-400 hover:bg-[#ffb4ab]/10 rounded transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
