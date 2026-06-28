# JadiBot Enterprise — Next.js 15

> Platform SaaS untuk mengelola, memantau, dan men-deploy WhatsApp Bot secara enterprise.

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| React | React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 |
| State | Zustand + TanStack Query |
| Charts | Recharts |
| Icons | Lucide React |
| Animation | Framer Motion |
| Forms | React Hook Form + Zod |
| Realtime | Socket.IO Client |

## 📁 Struktur Proyek

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Route Group: Login, Register, Forgot Password
│   ├── (dashboard)/       # Route Group: Dashboard pages
│   │   └── dashboard/
│   │       ├── bots/      # Bot management
│   │       ├── sessions/  # Session manager
│   │       ├── analytics/ # Analytics
│   │       ├── logs/      # System logs
│   │       └── ...
│   ├── (admin)/           # Route Group: Admin pages
│   │   └── admin/
│   │       ├── users/
│   │       ├── monitoring/
│   │       └── ...
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page (/)
│
├── components/
│   ├── layout/            # Sidebar, TopBar, AppLayout
│   ├── ui/                # Custom UI components
│   └── pages/             # Page-level components
│
├── mock/                  # Mock data (replace with real API)
├── types/                 # TypeScript interfaces
├── lib/                   # Utilities (cn, etc.)
├── hooks/                 # Custom React hooks
├── providers/             # App providers (QueryClient, etc.)
└── constants/             # App constants
```

## 🛠️ Cara Menjalankan

### Prerequisites
- Node.js 20+ 
- npm / yarn / pnpm

### Instalasi

```bash
# Clone atau extract project
cd jadibot-enterprise

# Install dependencies
npm install
# atau
pnpm install

# Salin environment variables
cp .env.example .env.local

# Jalankan development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## 📄 Halaman yang Tersedia

| URL | Deskripsi |
|-----|-----------|
| `/` | Landing page |
| `/login` | Sign in |
| `/register` | Create account |
| `/forgot-password` | Reset password |
| `/dashboard` | Overview dashboard |
| `/dashboard/bots` | Daftar semua bot |
| `/dashboard/bots/create` | Deploy bot baru |
| `/dashboard/bots/[id]` | Detail bot |
| `/dashboard/bots/[id]/settings` | Pengaturan bot |
| `/dashboard/sessions` | Session manager + QR link |
| `/dashboard/analytics` | Analitik platform |
| `/dashboard/logs` | System logs |
| `/dashboard/notifications` | Notifikasi |
| `/dashboard/api-keys` | API key management |
| `/dashboard/profile` | Profil pengguna |
| `/dashboard/settings` | Pengaturan workspace |
| `/admin` | Admin dashboard |
| `/admin/users` | Manajemen pengguna |
| `/admin/monitoring` | Infrastructure monitoring |
| `/admin/settings` | Platform settings |
| `/admin/maintenance` | Maintenance tasks |

## 🔧 Scripts

```bash
npm run dev          # Development server (localhost:3000)
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint check
npm run type-check   # TypeScript typecheck
```

## 🌐 Deploy ke Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deploy
vercel --prod
```

## 📝 Migrasi dari Vite

File ini adalah hasil migrasi dari Vite + React ke Next.js 15 App Router:

- `wouter` → `next/link` + `useRouter` + `usePathname`
- `React.lazy` → Next.js automatic code splitting
- `src/data/mock.ts` → `src/mock/data.ts`
- Route-based files → Next.js App Router conventions
- `@/data/mock` → `@/mock/data`
- `@/components/ui/StatusBadge` (cn export) → `@/lib/utils` (cn)

---

Made with ❤️ by JadiBot Enterprise Team
