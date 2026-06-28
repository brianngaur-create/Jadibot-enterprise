'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Bot, Eye, EyeOff, AlertCircle, Loader2, ShieldAlert } from 'lucide-react'
import { useAuth } from '@/lib/auth/store'
import { loginSchema, type LoginFormValues } from '@/lib/validation/schemas'
import { recordAttempt, checkRateLimit } from '@/lib/rate-limit'

export function LoginPage() {
  const router = useRouter()
  const { login, isLoading, error, clearError, isAuthenticated } = useAuth()
  const [showPass, setShowPass] = useState(false)
  const [rateLimitMsg, setRateLimitMsg] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  })

  useEffect(() => {
    const check = checkRateLimit('login')
    if (!check.allowed) {
      setRateLimitMsg(`Too many login attempts. Try again in ${check.blockedForLabel}.`)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      const params = new URLSearchParams(window.location.search)
      const returnUrl = params.get('returnUrl')
      const destination = returnUrl && returnUrl.startsWith('/') ? returnUrl : '/dashboard'
      router.replace(destination)
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    return () => { clearError() }
  }, [clearError])

  const onSubmit = async (data: LoginFormValues) => {
    const rateCheck = recordAttempt('login')
    if (!rateCheck.allowed) {
      setRateLimitMsg(`Too many attempts. Try again in ${rateCheck.blockedForLabel}.`)
      return
    }
    setRateLimitMsg(null)
    try {
      await login(data)
    } catch {
      // error is already stored in auth store
    }
  }

  const isDisabled = isLoading || isSubmitting || !!rateLimitMsg

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0c1321] p-4">
      <div className="glow-blob-1" aria-hidden="true" />
      <div className="glow-blob-2" aria-hidden="true" />

      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-4" aria-hidden="true">
            <Bot className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your JadiBot workspace</p>
        </div>

        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-8 shadow-2xl">
          {rateLimitMsg && (
            <div role="alert" className="flex items-start gap-2 mb-5 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{rateLimitMsg}</span>
            </div>
          )}

          {error && !rateLimitMsg && (
            <div role="alert" className="flex items-start gap-2 mb-5 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate aria-label="Sign in form">
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="text-sm font-medium text-foreground">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                aria-required="true"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'login-email-error' : undefined}
                placeholder="you@company.com"
                disabled={isDisabled}
                className="w-full bg-[#0B1220] border border-[#1F2937] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors disabled:opacity-50 aria-[invalid=true]:border-destructive"
                {...register('email')}
              />
              {errors.email && (
                <p id="login-email-error" role="alert" className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" aria-hidden="true" />{errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="login-password" className="text-sm font-medium text-foreground">Password</label>
                <Link href="/forgot-password" className="text-xs text-primary hover:text-primary/80 transition-colors focus:outline-none focus:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  aria-required="true"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'login-password-error' : undefined}
                  placeholder="••••••••"
                  disabled={isDisabled}
                  className="w-full bg-[#0B1220] border border-[#1F2937] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors pr-10 disabled:opacity-50 aria-[invalid=true]:border-destructive"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-1 focus:ring-primary rounded"
                >
                  {showPass ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                </button>
              </div>
              {errors.password && (
                <p id="login-password-error" role="alert" className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" aria-hidden="true" />{errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                id="remember-me"
                type="checkbox"
                disabled={isDisabled}
                className="rounded border-[#1F2937] bg-[#0B1220] text-primary focus:ring-primary focus:ring-offset-0 disabled:opacity-50"
                {...register('rememberMe')}
              />
              <label htmlFor="remember-me" className="text-sm text-muted-foreground cursor-pointer select-none">
                Remember me for 30 days
              </label>
            </div>

            <button
              type="submit"
              disabled={isDisabled}
              aria-busy={isLoading || isSubmitting}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-[inset_0_0_10px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[#111827]"
            >
              {(isLoading || isSubmitting) && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              {(isLoading || isSubmitting) ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary hover:text-primary/80 font-medium transition-colors focus:outline-none focus:underline">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
