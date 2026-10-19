// components/ui/CommandPalette.tsx
'use client'

import * as React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Command {
  id: string
  label: string
  hint?: string
  run: () => void
}

const STATIC_ROUTES: Record<string, string> = {
  'nav:explore': '/explore',
  'nav:pricing': '/pricing',
  'nav:docs': '/docs',
  'nav:dashboard': '/dashboard',
  'nav:billing': '/billing',
  'nav:settings': '/settings',
  'nav:home': '/',
}

const STATIC_COMMANDS: Command[] = [
  { id: 'nav:explore', label: 'Explore', hint: 'Browse public pens' },
  { id: 'nav:pricing', label: 'Pricing', hint: 'Plans and limits' },
  { id: 'nav:docs', label: 'Docs', hint: 'Guides and reference' },
  { id: 'nav:dashboard', label: 'Dashboard', hint: 'Your pens' },
  { id: 'nav:billing', label: 'Billing', hint: 'Plan and invoices' },
  { id: 'nav:settings', label: 'Settings', hint: 'Account and danger zone' },
  { id: 'nav:home', label: 'Home', hint: 'Landing page' },
]

export const OPEN_COMMAND_PALETTE_EVENT = 'quark:open-command-palette'

export function CommandPalette() {
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [activeIndex, setActiveIndex] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)

  const toggleRef = React.useRef<(force?: boolean) => void>(() => {})
  React.useEffect(() => {
    toggleRef.current = (force?: boolean) => {
      setIsOpen((current) => force ?? !current)
    }
  })

  React.useEffect(() => {
    if (!isOpen) return
    setQuery('')
    setActiveIndex(0)
  }, [isOpen])

  const commands = React.useMemo(() => {
    const all: Command[] = STATIC_COMMANDS.map((c) => ({
      ...c,
      run: () => router.push(STATIC_ROUTES[c.id] ?? '/'),
    }))
    const q = query.trim().toLowerCase()
    if (!q) return all
    return all.filter((c) => c.label.toLowerCase().includes(q))
  }, [query, router])

  React.useEffect(() => {
    const onOpen = () => toggleRef.current(true)
    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, onOpen)
  }, [])

  React.useEffect(() => {
    // inside the editor Monaco owns Ctrl+K (goto-line chord) — don't shadow it
    if (pathname.startsWith('/pen/')) return
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        toggleRef.current()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [pathname])

  React.useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    inputRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  React.useEffect(() => {
    setActiveIndex(0)
  }, [query])

  React.useEffect(() => {
    if (!isOpen) return
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, isOpen])

  const runCommand = (command: Command) => {
    setIsOpen(false)
    command.run()
  }

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (commands.length === 0 ? 0 : (i + 1) % commands.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (commands.length === 0 ? 0 : (i - 1 + commands.length) % commands.length))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const command = commands[activeIndex]
      if (command) runCommand(command)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-void/80 p-4 pt-[15vh]"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsOpen(false)
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="w-full max-w-lg border border-line bg-surface shadow-snap-blue"
      >
        <div className="border-b border-line px-3">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Type a command..."
            aria-label="Command"
            aria-controls="command-palette-list"
            aria-activedescendant={commands[activeIndex] ? `command-${commands[activeIndex].id}` : undefined}
            className="w-full bg-transparent py-3 font-mono text-sm text-ink placeholder:text-inkFaint focus:outline-none"
          />
        </div>

        <div id="command-palette-list" ref={listRef} role="listbox" aria-label="Commands" className="max-h-72 overflow-y-auto py-1">
          {commands.length === 0 ? (
            <p className="px-3 py-6 text-center font-mono text-xs text-inkFaint">No matching commands.</p>
          ) : (
            commands.map((command, index) => (
              <div
                key={command.id}
                id={`command-${command.id}`}
                data-index={index}
                role="option"
                aria-selected={index === activeIndex}
                onClick={() => runCommand(command)}
                onMouseMove={() => setActiveIndex(index)}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-3 px-3 py-2 font-mono text-sm',
                  index === activeIndex ? 'bg-quarkBlue/10 text-ink' : 'text-inkDim'
                )}
              >
                <span className="truncate">{command.label}</span>
                {command.hint && (
                  <span className="shrink-0 font-mono text-[11px] text-inkFaint">{command.hint}</span>
                )}
              </div>
            ))
          )}
        </div>

        <div className="border-t border-line px-3 py-2 font-mono text-[10px] text-inkFaint">
          <span className="mr-3">↑↓ navigate</span>
          <span className="mr-3">↵ run</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  )
}
