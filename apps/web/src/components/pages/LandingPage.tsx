'use client'

import Link from 'next/link'
import { Bot, ArrowRight, Shield, Zap, Globe, Check } from 'lucide-react'
import { PLANS } from '@/constants'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0c1321] text-foreground overflow-x-hidden">
      <div className="glow-blob-1" />
      <div className="glow-blob-2" />
      <div className="glow-blob-3" />

      {/* Nav */}
      <nav className="border-b border-[#1a2540] sticky top-0 z-50 bg-[#0c1321]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">JadiBot</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-[#adc6ff]/70 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-[#adc6ff]/70 hover:text-white transition-colors">Pricing</a>
            <a href="#enterprise" className="text-sm text-[#adc6ff]/70 hover:text-white transition-colors">Enterprise</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-[#adc6ff]/80 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary rounded-full px-4 py-1.5 text-xs font-semibold mb-8 tracking-wider uppercase">
          <Zap className="w-3 h-3" />
          Next.js 15 Powered Platform
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight mb-6 leading-tight">
          Mission Control for<br />
          <span className="text-primary">WhatsApp Bots</span>
        </h1>

        <p className="text-xl text-[#adc6ff]/70 max-w-3xl mx-auto mb-12 leading-relaxed">
          Deploy, manage, and scale AI-powered WhatsApp bots without writing a single line of code.
          Built for developers, designed for serious operators.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register" className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-xl text-base font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/25 w-full sm:w-auto justify-center">
            Deploy Your First Bot <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/dashboard" className="flex items-center gap-2 border border-[#2a3a5a] text-[#adc6ff] px-8 py-3.5 rounded-xl text-base font-semibold hover:border-primary/50 hover:text-primary transition-colors w-full sm:w-auto justify-center">
            View Dashboard
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto mt-20 pt-12 border-t border-[#1a2540]">
          {[
            { label: 'Active Bots', value: '142+' },
            { label: 'Messages/Day', value: '2.4M' },
            { label: 'Uptime SLA', value: '99.9%' },
            { label: 'Global Users', value: '45K+' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-[#adc6ff]/60">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-4">Everything You Need</h2>
        <p className="text-center text-[#adc6ff]/60 mb-12">Production-ready infrastructure for WhatsApp automation at scale.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Bot,
              title: 'Multi-Bot Fleet',
              desc: 'Manage hundreds of WhatsApp bot instances from one dashboard. Deploy, start, stop, and monitor in real-time.',
              color: '#4d8eff',
            },
            {
              icon: Shield,
              title: 'Enterprise Security',
              desc: 'End-to-end encryption, IP whitelisting, role-based access control, and comprehensive audit logging.',
              color: '#4ae176',
            },
            {
              icon: Globe,
              title: 'Global Scale',
              desc: 'Deploy across multiple regions. Auto-reconnect, health checks, and 99.9% uptime guarantee for critical bots.',
              color: '#ffb4ab',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-[#111827] border border-[#1F2937] rounded-xl p-8 hover:border-primary/40 transition-colors"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                style={{ backgroundColor: `${feature.color}15` }}
              >
                <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-[#adc6ff]/60 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-4">Simple Pricing</h2>
        <p className="text-center text-[#adc6ff]/60 mb-12">Scale your bot infrastructure without surprises.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`bg-[#111827] border rounded-xl p-8 flex flex-col ${'highlight' in plan && plan.highlight
                  ? 'border-primary shadow-lg shadow-primary/20 relative'
                  : 'border-[#1F2937]'
                }`}
            >
              {'highlight' in plan && plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Most Popular
                  </span>
                </div>
              )}
              <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
              <div className="text-3xl font-extrabold text-white mb-1">
                {plan.price}
                {plan.price !== 'Free' && plan.price !== 'Custom' && (
                  <span className="text-sm font-normal text-[#adc6ff]/60">/mo</span>
                )}
              </div>
              <div className="text-sm text-[#adc6ff]/60 mb-6">
                {plan.bots} · {plan.msgs}
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-[#adc6ff]/80">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={`text-center py-3 rounded-xl font-semibold text-sm transition-all ${'highlight' in plan && plan.highlight
                    ? 'bg-primary text-primary-foreground hover:opacity-90'
                    : 'border border-[#2a3a5a] text-[#adc6ff] hover:border-primary/50'
                  }`}
              >
                {plan.price === 'Custom' ? 'Contact Sales' : 'Get Started'}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="enterprise" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-primary/10 to-[#4ae176]/10 border border-primary/20 rounded-2xl p-12 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Deploy?</h2>
          <p className="text-[#adc6ff]/60 mb-8 max-w-2xl mx-auto">
            Join 45,000+ businesses using JadiBot to automate their WhatsApp operations at scale.
          </p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition-opacity">
            Start Free Today <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1a2540] mt-8 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#adc6ff]/40">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-primary" />
            <span>© 2024 JadiBot Enterprise. All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Docs</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
