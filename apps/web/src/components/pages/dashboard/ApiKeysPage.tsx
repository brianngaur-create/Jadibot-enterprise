'use client'

import { Key, Copy, Plus, Trash2 } from 'lucide-react'
import { apiKeysApi } from '@/lib/api/services'
import { useResource } from '@/lib/api/hooks'

export function ApiKeysPage() {
  const { data: keys, isLoading, refetch } = useResource(() => apiKeysApi.list(), [], [])

  const createKey = async () => {
    const name = window.prompt('Name for this API key?')
    if (!name) return
    const created = await apiKeysApi.create({ name })
    window.alert(`Copy your key now — it will not be shown again:\n\n${created.key}`)
    refetch()
  }

  const revokeKey = async (id: string) => {
    if (!window.confirm('Revoke this API key? This cannot be undone.')) return
    await apiKeysApi.revoke(id)
    refetch()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">API Keys</h1>
          <p className="text-sm text-muted-foreground">Manage your developer keys for programmatic access.</p>
        </div>
        <button onClick={createKey} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 shadow-[inset_0_0_10px_rgba(255,255,255,0.2)]">
          <Plus className="w-4 h-4" /> Create Key
        </button>
      </div>

      <div className="bg-[#111827] border border-[#1F2937] rounded-lg overflow-hidden">
        <div className="p-5 border-b border-[#1F2937] bg-[#19202e]/50 flex items-start gap-3">
          <Key className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <strong className="text-foreground">Keep your keys secret.</strong> Never expose them in client-side code or public repositories.
            These keys provide full access to your JadiBot account and deployed instances.
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-[#19202e] uppercase font-semibold">
              <tr>
                <th className="px-5 py-4">Name</th>
                <th className="px-5 py-4">Key</th>
                <th className="px-5 py-4">Scope</th>
                <th className="px-5 py-4">Last Used</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937]">
              {isLoading ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">Loading API keys…</td></tr>
              ) : keys.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">No API keys yet.</td></tr>
              ) : (
              keys.map((key) => (
                <tr key={key.id} className="hover:bg-[#1F2937]/30 transition-colors">
                  <td className="px-5 py-4 font-medium text-foreground">{key.name}</td>
                  <td className="px-5 py-4 font-mono text-muted-foreground">
                    <div className="flex items-center gap-2">
                      {key.maskedKey}
                      <button
                        className="p-1 hover:bg-[#1F2937] rounded text-primary transition-colors"
                        title="Copy to clipboard"
                        onClick={() => navigator.clipboard.writeText(key.maskedKey)}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1">
                      {key.scope.map((s) => (
                        <span key={s} className="text-[10px] uppercase tracking-wider font-mono px-1.5 py-0.5 bg-[#19202e] rounded border border-[#1F2937]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{key.lastUsed}</td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={() => revokeKey(key.id)} className="text-[#ffb4ab] hover:text-red-400 p-1 transition-colors" title="Revoke">
                      <Trash2 className="w-4 h-4" />
                    </button>
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
