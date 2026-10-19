// app/(app)/layout.tsx
'use client'

import { useEffect } from 'react'
import { useProjectStore } from '@/lib/store/projectStore'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { NotificationBell } from '@/components/ui/NotificationBell'
import { CommandPalette, OPEN_COMMAND_PALETTE_EVENT } from '@/components/ui/CommandPalette'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Load mock projects when the app mounts
  useEffect(() => {
    useProjectStore.getState().loadProjects()
  }, [])

  return (
    <div className="min-h-screen bg-void">
      {/* App Top Bar */}
      <header className="sticky top-0 z-50 border-b border-line bg-void/90 backdrop-blur-md px-4 py-3 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          {/* Left — Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 flex-shrink-0">
            <Logo variant="white" width={28} height={28} />
            <span className="font-mono text-sm font-bold text-ink">Quark</span>
          </Link>

          {/* Right — Navigation */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE_EVENT))}
              aria-label="Open command palette"
              className="flex items-center gap-1.5 border border-line bg-surface2 px-2 py-1.5 font-mono text-[11px] text-inkFaint transition-colors hover:border-ink hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quarkBlue"
            >
              <span aria-hidden="true">Ctrl</span>
              <span aria-hidden="true">K</span>
            </button>
            <NotificationBell />
            <Link href="/dashboard">
              <Button variant="secondary" className="min-h-[36px] px-3 text-xs sm:px-4">
                Dashboard
              </Button>
            </Link>
            <Link href="/billing">
              <Button variant="secondary" className="min-h-[36px] px-3 text-xs sm:px-4">
                Billing
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="secondary" className="min-h-[36px] px-3 text-xs sm:px-4">
                Settings
              </Button>
            </Link>
            <Link href="/sign-out">
              <Button variant="destructive" className="min-h-[36px] px-3 text-xs sm:px-4">
                Sign out
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8">
        {children}
      </main>

      <CommandPalette />
    </div>
  )
}