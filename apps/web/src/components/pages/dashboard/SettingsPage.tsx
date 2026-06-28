'use client'

import { useState } from 'react'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'
import { Bell, Shield, Globe, Save } from 'lucide-react'

export function SettingsPage() {
  const [notifs, setNotifs] = useState({ email: true, slack: false, webhook: true, botOffline: true, highTraffic: false })
  const [security, setSecurity] = useState({ twoFactor: false, sessionTimeout: true, ipWhitelist: false })

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your workspace preferences.</p>
      </div>

      {/* Notifications */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Notification Preferences</h3>
        </div>
        <div className="space-y-4">
          {([
            { key: 'email', label: 'Email Alerts', desc: 'Receive notifications via email' },
            { key: 'slack', label: 'Slack Integration', desc: 'Post alerts to Slack channels' },
            { key: 'webhook', label: 'Webhook', desc: 'Send events to custom endpoint' },
            { key: 'botOffline', label: 'Bot Offline Alert', desc: 'Alert when a bot disconnects' },
            { key: 'highTraffic', label: 'High Traffic Alert', desc: 'Alert when traffic exceeds threshold' },
          ] as const).map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-2">
              <div>
                <div className="font-medium text-sm text-foreground">{label}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
              </div>
              <ToggleSwitch checked={notifs[key]} onChange={(c) => setNotifs({ ...notifs, [key]: c })} />
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Security</h3>
        </div>
        <div className="space-y-4">
          {([
            { key: 'twoFactor', label: 'Two-Factor Authentication', desc: 'Require 2FA for all logins' },
            { key: 'sessionTimeout', label: 'Auto Session Timeout', desc: 'Sign out after 30 min of inactivity' },
            { key: 'ipWhitelist', label: 'IP Whitelist', desc: 'Restrict access to specific IPs' },
          ] as const).map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-2">
              <div>
                <div className="font-medium text-sm text-foreground">{label}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
              </div>
              <ToggleSwitch checked={security[key]} onChange={(c) => setSecurity({ ...security, [key]: c })} />
            </div>
          ))}
        </div>
        <div className="mt-6 pt-6 border-t border-[#1F2937]">
          <button className="text-sm text-[#ffb4ab] hover:text-red-400 font-medium transition-colors">
            Change Password
          </button>
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <Globe className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Workspace</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Timezone</label>
            <select defaultValue="Asia/Jakarta" className="w-full bg-[#0B1220] border border-[#1F2937] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary">
              <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Language</label>
            <select defaultValue="en" className="w-full bg-[#0B1220] border border-[#1F2937] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary">
              <option value="en">English</option>
              <option value="id">Indonesian</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-md text-sm font-medium hover:opacity-90 shadow-[inset_0_0_10px_rgba(255,255,255,0.2)]">
          <Save className="w-4 h-4" /> Save All Settings
        </button>
      </div>
    </div>
  )
}
