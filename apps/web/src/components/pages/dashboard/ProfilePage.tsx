'use client'

import { Camera, Mail, Phone, MapPin, Save } from 'lucide-react'

const mockUser = {
  name: 'Arya Pratama',
  email: 'arya@jadibot.com',
  phone: '+62 812-3456-7890',
  location: 'Jakarta, Indonesia',
  plan: 'Enterprise',
  botsActive: 4,
  joinedAt: 'January 2024',
  initials: 'AP',
}

export function ProfilePage() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert('Profile saved!')
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your personal information and account details.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar Card */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-6 flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-3xl border-2 border-primary/30">
              {mockUser.initials}
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center hover:opacity-90 transition-opacity">
              <Camera className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>
          <h3 className="font-bold text-foreground text-lg">{mockUser.name}</h3>
          <p className="text-sm text-muted-foreground mb-4">{mockUser.email}</p>
          <div className="w-full space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium text-primary">{mockUser.plan}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Active Bots</span>
              <span className="font-medium text-foreground">{mockUser.botsActive}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Member Since</span>
              <span className="font-medium text-foreground">{mockUser.joinedAt}</span>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2 bg-[#111827] border border-[#1F2937] rounded-lg p-6">
          <h3 className="font-semibold text-foreground mb-6">Personal Information</h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Full Name</label>
                <input type="text" defaultValue={mockUser.name} className="w-full bg-[#0B1220] border border-[#1F2937] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="email" defaultValue={mockUser.email} className="w-full bg-[#0B1220] border border-[#1F2937] rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Phone</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" defaultValue={mockUser.phone} className="w-full bg-[#0B1220] border border-[#1F2937] rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Location</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" defaultValue={mockUser.location} className="w-full bg-[#0B1220] border border-[#1F2937] rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Bio</label>
              <textarea rows={3} defaultValue="Building the future of WhatsApp automation." className="w-full bg-[#0B1220] border border-[#1F2937] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>

            <div className="flex justify-end">
              <button type="submit" className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-md text-sm font-medium hover:opacity-90 shadow-[inset_0_0_10px_rgba(255,255,255,0.2)]">
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
