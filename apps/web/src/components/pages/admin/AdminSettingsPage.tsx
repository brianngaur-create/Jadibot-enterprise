'use client'

import { useState } from 'react'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'
import { Save, Globe, Zap } from 'lucide-react'

export function AdminSettingsPage() {
  const [features, setFeatures] = useState({
    registration: true,
    publicApi: true,
    maintenanceMode: false,
    debugMode: false,
    rateLimiting: true,
  })

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Platform Settings</h1>
        <p className="text-sm text-muted-foreground">Configure global platform behavior and features.</p>
      </div>

      {/* General Settings */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <Globe className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">General Configuration</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Platform Name</label>
            <input type="text" defaultValue="JadiBot Enterprise" className="w-full bg-[#0B1220] border border-[#1F2937] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Support Email</label>
            <input type="email" defaultValue="support@jadibot.com" className="w-full bg-[#0B1220] border border-[#1F2937] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Max Bots Per User (Pro)</label>
            <input type="number" defaultValue={10} className="w-full bg-[#0B1220] border border-[#1F2937] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Session Timeout (minutes)</label>
            <input type="number" defaultValue={30} className="w-full bg-[#0B1220] border border-[#1F2937] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
          </div>
        </div>
      </div>

      {/* Feature Flags */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <Zap className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Feature Flags</h3>
        </div>
        <div className="space-y-4">
          {([
            { key: 'registration', label: 'Open Registration', desc: 'Allow new users to sign up' },
            { key: 'publicApi', label: 'Public API', desc: 'Enable public API access for developers' },
            { key: 'maintenanceMode', label: 'Maintenance Mode', desc: 'Block all user access (admin only)' },
            { key: 'debugMode', label: 'Debug Mode', desc: 'Enable verbose logging platform-wide' },
            { key: 'rateLimiting', label: 'Rate Limiting', desc: 'Enforce API rate limits per user' },
          ] as const).map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-2">
              <div>
                <div className="font-medium text-sm text-foreground">{label}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
              </div>
              <ToggleSwitch checked={features[key]} onChange={(c) => setFeatures({ ...features, [key]: c })} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-md text-sm font-medium hover:opacity-90 shadow-[inset_0_0_10px_rgba(255,255,255,0.2)]">
          <Save className="w-4 h-4" /> Save Platform Settings
        </button>
      </div>
    </div>
  )
}
