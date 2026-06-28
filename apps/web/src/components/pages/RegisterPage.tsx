'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Bot, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth/store'
import { registerSchema, type RegisterFormValues } from '@/lib/validation/schemas'
import { recordAttempt, checkRateLimit } from '@/lib/rate-limit'

export function RegisterPage() {
  const router = useRouter()
  const { register: registerUser, isLoading, error, clearError, isAuthenticated } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      plan: 'starter',
      acceptTerms: true,
    },
  })

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard')
  }, [isAuthenticated, router])

  useEffect(() => {
    return () => { clearError() }
  }, [clearError])

  const onSubmit = async (data: RegisterFormValues) => {
    const rateCheck = checkRateLimit('register')
    if (!rateCheck.allowed) return
    recordAttempt('register')

    try {
      await registerUser(data)
    } catch {
      // error is already stored in auth store
    }
  }

  const isDisabled = isLoading || isSubmitting
  const fieldClass = "w-full bg-[#0B1220] border border-[#1F2937] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors disabled:opacity-50 aria-[invalid=true]:border-destructive"

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0c1321] p-4">
      <div className="glow-blob-1" aria-hidden="true" />
      <div className="glow-blob-2" aria-hidden="true" />

      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-4" aria-hidden="true">
            <Bot className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create your workspace</h1>
          <p className="text-sm text-muted-foreground mt-1">Start deploying WhatsApp bots in minutes</p>
        </div>

        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-8 shadow-2xl">
          {error && (
            <div role="alert" className="flex items-start gap-2 mb-5 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate aria-label="Create account form">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="reg-firstname" className="text-sm font-medium text-foreground">First Name</label>
                <input
                  id="reg-firstname"
                  type="text"
                  autoComplete="given-name"
                  placeholder="Arya"
                  disabled={isDisabled}
                  aria-invalid={!!errors.firstName}
                  aria-describedby={errors.firstName ? 'reg-firstname-error' : undefined}
                  className={fieldClass}
                  {...register('firstName')}
                />
                {errors.firstName && (
                  <p id="reg-firstname-error" role="alert" className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" aria-hidden="true" />{errors.firstName.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="reg-lastname" className="text-sm font-medium text-foreground">Last Name</label>
                <input
                  id="reg-lastname"
                  type="text"
                  autoComplete="family-name"
                  placeholder="Pratama"
                  disabled={isDisabled}
                  aria-invalid={!!errors.lastName}
                  aria-describedby={errors.lastName ? 'reg-lastname-error' : undefined}
                  className={fieldClass}
                  {...register('lastName')}
                />
                {errors.lastName && (
                  <p id="reg-lastname-error" role="alert" className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" aria-hidden="true" />{errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="reg-email" className="text-sm font-medium text-foreground">Work Email</label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                placeholder="arya@company.com"
                disabled={isDisabled}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'reg-email-error' : undefined}
                className={fieldClass}
                {...register('email')}
              />
              {errors.email && (
                <p id="reg-email-error" role="alert" className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" aria-hidden="true" />{errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="reg-password" className="text-sm font-medium text-foreground">Password</label>
              <input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                placeholder="Min. 8 characters with upper, lower, number, symbol"
                disabled={isDisabled}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'reg-password-error' : 'reg-password-hint'}
                className={fieldClass}
                {...register('password')}
              />
              <p id="reg-password-hint" className="text-xs text-muted-foreground">
                Must include uppercase, lowercase, number, and special character.
              </p>
              {errors.password && (
                <p id="reg-password-error" role="alert" className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" aria-hidden="true" />{errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="reg-confirm-password" className="text-sm font-medium text-foreground">Confirm Password</label>
              <input
                id="reg-confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter password"
                disabled={isDisabled}
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? 'reg-confirm-error' : undefined}
                className={fieldClass}
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p id="reg-confirm-error" role="alert" className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" aria-hidden="true" />{errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="reg-plan" className="text-sm font-medium text-foreground">Select Plan</label>
              <select
                id="reg-plan"
                disabled={isDisabled}
                className={fieldClass}
                {...register('plan')}
              >
                <option value="starter">Starter (Free)</option>
                <option value="pro">Pro ($29/mo)</option>
                <option value="enterprise">Enterprise (Contact us)</option>
              </select>
            </div>

            <div className="flex items-start gap-2">
              <input
                id="accept-terms"
                type="checkbox"
                disabled={isDisabled}
                aria-required="true"
                aria-describedby={errors.acceptTerms ? 'terms-error' : undefined}
                className="mt-0.5 rounded border-[#1F2937] bg-[#0B1220] text-primary focus:ring-primary focus:ring-offset-0 disabled:opacity-50"
                {...register('acceptTerms')}
              />
              <label htmlFor="accept-terms" className="text-sm text-muted-foreground cursor-pointer select-none">
                I agree to the{' '}
                <a href="/terms" className="text-primary hover:underline focus:outline-none focus:underline">Terms of Service</a>{' '}
                and{' '}
                <a href="/privacy" className="text-primary hover:underline focus:outline-none focus:underline">Privacy Policy</a>
              </label>
            </div>
            {errors.acceptTerms && (
              <p id="terms-error" role="alert" className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" aria-hidden="true" />{errors.acceptTerms.message}
              </p>
            )}

            <button
              type="submit"
              disabled={isDisabled}
              aria-busy={isDisabled}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-[inset_0_0_10px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[#111827]"
            >
              {isDisabled && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              {isDisabled ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors focus:outline-none focus:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
