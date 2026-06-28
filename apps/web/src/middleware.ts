import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_ROUTES = [
  '/dashboard',
  '/dashboard/bots',
  '/dashboard/sessions',
  '/dashboard/analytics',
  '/dashboard/logs',
  '/dashboard/notifications',
  '/dashboard/api-keys',
  '/dashboard/profile',
  '/dashboard/settings',
]

const ADMIN_ROUTES = [
  '/admin',
  '/admin/users',
  '/admin/monitoring',
  '/admin/settings',
  '/admin/maintenance',
]

const PUBLIC_AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password']

const AUTH_COOKIE_NAME = 'jb_auth'

function isProtected(pathname: string): boolean {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )
}

function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )
}

function isPublicAuthRoute(pathname: string): boolean {
  return PUBLIC_AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'))
}

function buildSecurityHeaders(response: NextResponse): NextResponse {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' https://fonts.gstatic.com",
    `connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL ?? ''} ${process.env.NEXT_PUBLIC_SOCKET_URL ?? 'ws://localhost:3001'} wss:`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-DNS-Prefetch-Control', 'off')
  response.headers.set('X-Download-Options', 'noopen')
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()'
  )
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp')
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin')

  response.headers.delete('X-Powered-By')
  response.headers.delete('Server')

  return response
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const response = NextResponse.next()
  buildSecurityHeaders(response)

  const authCookie = request.cookies.get(AUTH_COOKIE_NAME)
  let sessionData: { role?: string } | null = null

  if (authCookie?.value) {
    try {
      sessionData = JSON.parse(Buffer.from(authCookie.value, 'base64').toString('utf-8')) as {
        role?: string
      }
    } catch {
      sessionData = null
    }
  }

  const isAuthenticated = !!sessionData

  if (isPublicAuthRoute(pathname) && isAuthenticated) {
    const returnUrl = request.nextUrl.searchParams.get('returnUrl')
    const destination = returnUrl && returnUrl.startsWith('/') ? returnUrl : '/dashboard'
    return buildSecurityHeaders(NextResponse.redirect(new URL(destination, request.url)))
  }

  if (isAdminRoute(pathname)) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('returnUrl', pathname)
      return buildSecurityHeaders(NextResponse.redirect(loginUrl))
    }

    const role = sessionData?.role
    if (role !== 'admin' && role !== 'super_admin') {
      return buildSecurityHeaders(NextResponse.redirect(new URL('/dashboard', request.url)))
    }

    return response
  }

  if (isProtected(pathname)) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('returnUrl', pathname)
      return buildSecurityHeaders(NextResponse.redirect(loginUrl))
    }
    return response
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|eot)).*)',
  ],
}
