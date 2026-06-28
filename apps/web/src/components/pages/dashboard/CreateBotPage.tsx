'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft, QrCode, AlertCircle, Loader2 } from 'lucide-react'
import { QRCodeModal } from '@/components/ui/QRCodeModal'
import { createBotSchema, type CreateBotFormValues } from '@/lib/validation/schemas'
import { recordAttempt, checkRateLimit } from '@/lib/rate-limit'
import { botsApi } from '@/lib/api/services'

export function CreateBotPage() {
  const router = useRouter()
  const [step] = useState(1)
  const [showQR, setShowQR] = useState(false)
  const [newBotId, setNewBotId] = useState<string | null>(null)
  const [deployError, setDeployError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateBotFormValues>({
    resolver: zodResolver(createBotSchema),
    defaultValues: {
      name: '',
      prefix: '.',
      ownerNumber: '',
      mode: 'public',
      language: 'id',
      timezone: 'Asia/Jakarta',
      bio: 'Powered by JadiBot Enterprise.',
    },
  })

  const botName = watch('name')

  const handleDeploy = async (data: CreateBotFormValues) => {
    const rateCheck = checkRateLimit('qrGenerate')
    if (!rateCheck.allowed) return
    recordAttempt('qrGenerate')
    setDeployError(null)
    try {
      const bot = await botsApi.create({ name: data.name, prefix: data.prefix, mode: data.mode })
      await botsApi.updateSettings(bot.id, {
        ownerNumber: data.ownerNumber,
        bio: data.bio,
        language: data.language,
        timezone: data.timezone,
      })
      setNewBotId(bot.id)
      setShowQR(true)
    } catch (err) {
      setDeployError(err instanceof Error ? err.message : 'Failed to deploy bot')
    }
  }

  const handleQRClose = () => {
    setShowQR(false)
    router.push('/dashboard/bots')
  }

  const fieldClass = "w-full bg-[#0B1220] border border-[#1F2937] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50 aria-[invalid=true]:border-destructive"

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/bots"
          className="p-2 bg-[#111827] border border-[#1F2937] rounded-md text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
          aria-label="Back to bot list"
        >
          <ChevronLeft className="w-5 h-5" aria-hidden="true" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Deploy New Bot</h1>
          <p className="text-sm text-muted-foreground">Configure and link your WhatsApp bot in minutes.</p>
        </div>
      </div>

      <div className="flex items-center gap-4" role="list" aria-label="Deployment steps">
        {[{ n: 1, label: 'Configure' }, { n: 2, label: 'Link Device' }].map(({ n, label }) => (
          <div key={n} className="flex items-center gap-2" role="listitem">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= n ? 'bg-primary text-primary-foreground' : 'bg-[#1F2937] text-muted-foreground'}`}
              aria-current={step === n ? 'step' : undefined}
            >
              {n}
            </div>
            <span className={`text-sm font-medium ${step >= n ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
            {n < 2 && <div className="w-8 h-0.5 bg-[#1F2937]" aria-hidden="true" />}
          </div>
        ))}
      </div>

      <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-8">
        <form onSubmit={handleSubmit(handleDeploy)} className="space-y-6" noValidate aria-label="Bot configuration form">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label htmlFor="bot-name" className="text-sm font-medium text-foreground">
                Bot Name <span aria-hidden="true">*</span>
              </label>
              <input
                id="bot-name"
                type="text"
                placeholder="e.g. Customer Support Bot"
                disabled={isSubmitting}
                aria-required="true"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'bot-name-error' : undefined}
                className={fieldClass}
                {...register('name')}
              />
              {errors.name && (
                <p id="bot-name-error" role="alert" className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" aria-hidden="true" />{errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="bot-prefix" className="text-sm font-medium text-foreground">Command Prefix</label>
              <input
                id="bot-prefix"
                type="text"
                placeholder="."
                disabled={isSubmitting}
                aria-invalid={!!errors.prefix}
                aria-describedby={errors.prefix ? 'bot-prefix-error' : undefined}
                className={`${fieldClass} font-mono`}
                {...register('prefix')}
              />
              {errors.prefix && (
                <p id="bot-prefix-error" role="alert" className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" aria-hidden="true" />{errors.prefix.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="bot-owner" className="text-sm font-medium text-foreground">Owner Phone Number</label>
              <input
                id="bot-owner"
                type="tel"
                placeholder="628xxxxxxxxx"
                disabled={isSubmitting}
                aria-invalid={!!errors.ownerNumber}
                aria-describedby={errors.ownerNumber ? 'bot-owner-error' : 'bot-owner-hint'}
                className={`${fieldClass} font-mono`}
                {...register('ownerNumber')}
              />
              <p id="bot-owner-hint" className="text-xs text-muted-foreground">International format without spaces or dashes.</p>
              {errors.ownerNumber && (
                <p id="bot-owner-error" role="alert" className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" aria-hidden="true" />{errors.ownerNumber.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="bot-mode" className="text-sm font-medium text-foreground">Operational Mode</label>
              <select
                id="bot-mode"
                disabled={isSubmitting}
                className={fieldClass}
                {...register('mode')}
              >
                <option value="public">Public (Everyone)</option>
                <option value="self">Self (Owner only)</option>
                <option value="group">Group Only</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="bot-language" className="text-sm font-medium text-foreground">Language</label>
              <select
                id="bot-language"
                disabled={isSubmitting}
                className={fieldClass}
                {...register('language')}
              >
                <option value="en">English</option>
                <option value="id">Indonesian</option>
                <option value="es">Spanish</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="bot-timezone" className="text-sm font-medium text-foreground">Timezone</label>
              <select
                id="bot-timezone"
                disabled={isSubmitting}
                className={fieldClass}
                {...register('timezone')}
              >
                <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="bot-bio" className="text-sm font-medium text-foreground">Bot Bio</label>
            <textarea
              id="bot-bio"
              rows={2}
              disabled={isSubmitting}
              aria-invalid={!!errors.bio}
              aria-describedby={errors.bio ? 'bot-bio-error' : 'bot-bio-hint'}
              className={fieldClass}
              {...register('bio')}
            />
            <p id="bot-bio-hint" className="text-xs text-muted-foreground">Max 300 characters. Plain text only.</p>
            {errors.bio && (
              <p id="bot-bio-error" role="alert" className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" aria-hidden="true" />{errors.bio.message}
              </p>
            )}
          </div>

          {deployError && (
            <p role="alert" className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="w-4 h-4" aria-hidden="true" />{deployError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-[#1F2937]">
            <Link
              href="/dashboard/bots"
              className="px-6 py-2 border border-[#1F2937] rounded-md text-sm font-medium text-muted-foreground hover:bg-[#1F2937] transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 shadow-[inset_0_0_10px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[#111827]"
            >
              {isSubmitting
                ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Deploying…</>
                : <><QrCode className="w-4 h-4" aria-hidden="true" /> Deploy &amp; Scan QR</>
              }
            </button>
          </div>
        </form>
      </div>

      <QRCodeModal isOpen={showQR} onClose={handleQRClose} botName={botName || 'New Bot'} botId={newBotId ?? undefined} />
    </div>
  )
}
