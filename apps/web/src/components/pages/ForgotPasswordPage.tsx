'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Bot, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth/store'
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/lib/validation/schemas'
import { recordAttempt, checkRateLimit } from '@/lib/rate-limit'

export function ForgotPasswordPage() {
  const { forgotPassword, isLoading, error } = useAuth()
  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    const rateCheck = checkRateLimit('forgotPassword')
    if (!rateCheck.allowed) return
    recordAttempt('forgotPassword')

    try {
      await forgotPassword(data.email)
      setSentEmail(data.email)
      setSent(true)
    } catch {
      // error shown via auth store
    }
  }

  const isDisabled = isLoading || isSubmitting

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0c1321] p-4">
      <div className="glow-blob-1" aria-hidden="true" />

      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-4" aria-hidden="true">
            <Bot className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-white">Reset your password</h1>
          <p className="text-sm text-muted-foreground mt-1 text-center">
            We&apos;ll send recovery instructions to your email
          </p>
        </div>

        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-8 shadow-2xl">
          {sent ? (
            <div className="text-center py-4" role="status" aria-live="polite">
              <CheckCircle className="w-12 h-12 text-[#4ae176] mx-auto mb-4" aria-hidden="true" />
              <h3 className="font-semibold text-foreground mb-2">Check your email</h3>
              <p className="text-sm text-muted-foreground">
                If an account exists for <strong>{sentEmail}</strong>, we&apos;ve sent a password reset link.
                It will expire in 1 hour.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div role="alert" className="flex items-start gap-2 mb-5 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate aria-label="Password reset form">
                <div className="space-y-1.5">
                  <label htmlFor="forgot-email" className="text-sm font-medium text-foreground">Email Address</label>
                  <input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    disabled={isDisabled}
                    aria-required="true"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'forgot-email-error' : undefined}
                    className="w-full bg-[#0B1220] border border-[#1F2937] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors disabled:opacity-50 aria-[invalid=true]:border-destructive"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p id="forgot-email-error" role="alert" className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" aria-hidden="true" />{errors.email.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isDisabled}
                  aria-busy={isDisabled}
                  className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[#111827]"
                >
                  {isDisabled && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                  {isDisabled ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}

          <div className="text-center mt-6">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:underline"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
