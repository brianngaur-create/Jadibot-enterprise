'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Save, Upload, RotateCcw } from 'lucide-react'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'
import { botsApi } from '@/lib/api/services'
import { useResource } from '@/lib/api/hooks'
import type { Bot } from '@/types'

export function BotSettingsPage({ id }: { id: string }) {
  const { data: bot, isLoading, refetch } = useResource<Bot | null>(() => botsApi.get(id), null, [id])
  const [form, setForm] = useState<Bot | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (bot) setForm(bot)
  }, [bot])

  const set = <K extends keyof Bot>(key: K, value: Bot[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return
    setSaving(true)
    try {
      await botsApi.update(id, {
        name: form.name,
        prefix: form.prefix,
        mode: form.mode,
        autoRead: form.autoRead,
        autoTyping: form.autoTyping,
        autoRecording: form.autoRecording,
        autoReact: form.autoReact,
      })
      await botsApi.updateSettings(id, {
        ownerName: form.ownerName,
        ownerNumber: form.ownerNumber,
        bio: form.bio,
        footer: form.footer,
        language: form.language,
        timezone: form.timezone,
      })
      refetch()
      alert('Settings saved successfully!')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading || !form) {
    return <div className="py-24 text-center text-muted-foreground">Loading settings…</div>
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24">
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/bots/${form.id}`}
          className="p-2 bg-[#111827] border border-[#1F2937] rounded-md text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Bot Settings</h1>
          <p className="text-sm text-muted-foreground">Configure {form.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* General */}
            <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-6">General Information</h3>
              <div className="flex flex-col sm:flex-row gap-6 items-start mb-6">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-24 h-24 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-3xl border-2 border-dashed border-primary/30">
                    {form.name.substring(0, 2).toUpperCase()}
                  </div>
                  <button type="button" className="text-xs bg-[#1F2937] hover:bg-[#1F2937]/80 text-foreground px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors">
                    <Upload className="w-3 h-3" /> Avatar
                  </button>
                </div>
                <div className="flex-1 space-y-4 w-full">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Bot Name</label>
                    <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} className="w-full bg-[#0B1220] border border-[#1F2937] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Bio / About</label>
                    <textarea value={form.bio} onChange={(e) => set('bio', e.target.value)} rows={3} className="w-full bg-[#0B1220] border border-[#1F2937] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#1F2937] pt-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Owner Name</label>
                  <input type="text" value={form.ownerName} onChange={(e) => set('ownerName', e.target.value)} className="w-full bg-[#0B1220] border border-[#1F2937] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Owner Phone</label>
                  <input type="text" value={form.ownerNumber} onChange={(e) => set('ownerNumber', e.target.value)} className="w-full bg-[#0B1220] border border-[#1F2937] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono" />
                </div>
              </div>
            </div>

            {/* Advanced */}
            <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-4">Advanced Settings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {([
                  { label: 'Command Prefix', key: 'prefix' as const, mono: true },
                  { label: 'Footer Text', key: 'footer' as const, mono: false },
                ]).map(({ label, key, mono }) => (
                  <div key={label} className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{label}</label>
                    <input type="text" value={form[key]} onChange={(e) => set(key, e.target.value)} className={`w-full bg-[#0B1220] border border-[#1F2937] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary ${mono ? 'font-mono' : ''}`} />
                  </div>
                ))}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Language</label>
                  <select value={form.language} onChange={(e) => set('language', e.target.value)} className="w-full bg-[#0B1220] border border-[#1F2937] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary">
                    <option value="en">English</option>
                    <option value="id">Indonesian</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Timezone</label>
                  <select value={form.timezone} onChange={(e) => set('timezone', e.target.value)} className="w-full bg-[#0B1220] border border-[#1F2937] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary">
                    <option value="Asia/Jakarta">Asia/Jakarta</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-6 lg:sticky lg:top-24">
              <h3 className="font-semibold text-foreground mb-4">Automation &amp; Mode</h3>
              <div className="space-y-1.5 mb-6">
                <label className="text-sm font-medium text-foreground">Operational Mode</label>
                <select value={form.mode} onChange={(e) => set('mode', e.target.value as Bot['mode'])} className="w-full bg-[#0B1220] border border-[#1F2937] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary">
                  <option value="public">Public (Everyone)</option>
                  <option value="self">Self (Owner only)</option>
                  <option value="group">Group Only</option>
                </select>
              </div>
              <div className="space-y-4">
                {[
                  { key: 'autoRead' as const, label: 'Auto Read', desc: 'Mark incoming messages as read' },
                  { key: 'autoTyping' as const, label: 'Auto Typing', desc: 'Show typing status before replying' },
                  { key: 'autoRecording' as const, label: 'Auto Recording', desc: 'Show recording status on voice' },
                  { key: 'autoReact' as const, label: 'Auto React', desc: 'React to messages automatically' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm text-foreground">{label}</div>
                      <div className="text-[11px] text-muted-foreground">{desc}</div>
                    </div>
                    <ToggleSwitch
                      checked={form[key]}
                      onChange={(c) => set(key, c)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky bottom bar */}
        <div className="fixed bottom-0 left-0 md:left-64 right-0 p-4 bg-[#111827]/80 backdrop-blur-md border-t border-[#1F2937] z-20 flex justify-between items-center px-4 md:px-8">
          <button type="button" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <RotateCcw className="w-4 h-4" /> Reset to Defaults
          </button>
          <button type="submit" disabled={saving} className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-60 shadow-[inset_0_0_10px_rgba(255,255,255,0.2)]">
            <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
