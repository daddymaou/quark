// components/marketing/Nav.tsx
'use client'

import { Wordmark } from '@/components/ui/Wordmark'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, FormEvent } from 'react'
import { Search } from 'lucide-react'
import { OPEN_COMMAND_PALETTE_EVENT } from '@/components/ui/CommandPalette'

export function Nav() {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const router = useRouter()

  const openPalette = () => {
    window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE_EVENT))
  }

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    const q = search.trim()
    if (!q) return
    setIsOpen(false)
    router.push(`/explore?q=${encodeURIComponent(q)}`)
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-line bg-void/90 backdrop-blur-md px-4 py-3 md:px-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Wordmark variant="white" width={120} height={32} />
        </Link>

        <div className="hidden items-center gap-6 font-mono text-sm text-inkDim md:flex">
          <form onSubmit={handleSearch} className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-inkFaint"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search pens..."
              aria-label="Search pens"
              className="w-40 border border-line bg-surface2 py-1.5 pl-8 pr-2 font-mono text-xs text-ink placeholder:text-inkFaint focus:border-quarkBlue focus:outline-none"
            />
          </form>
          <button
            type="button"
            onClick={openPalette}
            aria-label="Open command palette"
            className="flex items-center gap-1.5 border border-line bg-surface2 px-2 py-1.5 font-mono text-xs text-inkFaint transition-colors hover:border-ink hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quarkBlue"
          >
            <span aria-hidden="true">Ctrl</span>
            <span aria-hidden="true">K</span>
          </button>
          <Link href="/explore" className="hover:text-ink transition-colors">
            Explore
          </Link>
          <Link href="/pricing" className="hover:text-ink transition-colors">
            Pricing
          </Link>
          <Link href="/docs" className="hover:text-ink transition-colors">
            Docs
          </Link>
          <Link href="/sign-in">
            <Button variant="secondary" className="min-h-[36px] px-4 text-xs">
              Sign in
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button variant="primary" className="min-h-[36px] px-4 text-xs">
              Get started
            </Button>
          </Link>
        </div>

        <button
          className="flex flex-col gap-1.5 md:hidden"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          <span className={`block h-0.5 w-6 bg-ink transition-all ${isOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
          <span className={`block h-0.5 w-6 bg-ink transition-all ${isOpen ? 'opacity-0' : ''}`} />
          <span className={`block h-0.5 w-6 bg-ink transition-all ${isOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 flex flex-col gap-4 border-t border-line pt-4 font-mono text-sm text-inkDim md:hidden">
          <form onSubmit={handleSearch} className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-inkFaint"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search pens..."
              aria-label="Search pens"
              className="w-full border border-line bg-surface2 py-2.5 pl-9 pr-3 font-mono text-sm text-ink placeholder:text-inkFaint focus:border-quarkBlue focus:outline-none"
            />
          </form>
          <Link href="/explore" className="hover:text-ink transition-colors">
            Explore
          </Link>
          <Link href="/pricing" className="hover:text-ink transition-colors">
            Pricing
          </Link>
          <Link href="/docs" className="hover:text-ink transition-colors">
            Docs
          </Link>
          <div className="flex flex-col gap-3 pt-2">
            <Link href="/sign-in">
              <Button variant="secondary" className="w-full min-h-[44px]">
                Sign in
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button variant="primary" className="w-full min-h-[44px]">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}