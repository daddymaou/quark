// components/ui/NotificationBell.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Bell, GitFork, MessageSquare, CreditCard, Info, CheckCheck } from 'lucide-react'
import type { Notification } from '@/lib/types'

const TYPE_STYLES: Record<Notification['type'], { icon: typeof Bell; color: string }> = {
  fork: { icon: GitFork, color: 'text-quarkBlue' },
  comment: { icon: MessageSquare, color: 'text-quarkGreen' },
  billing: { icon: CreditCard, color: 'text-amber-400' },
  system: { icon: Info, color: 'text-inkDim' },
}

function timeAgo(dateString: string): string {
  const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000)
  if (diff < 1) return 'just now'
  if (diff < 60) return `${diff}m ago`
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
  return `${Math.floor(diff / 1440)}d ago`
}

export function NotificationBell() {
  const { isSignedIn } = useUser()
  const router = useRouter()
  const [items, setItems] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isSignedIn) return
    let cancelled = false
    fetch('/api/notifications')
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json.success && Array.isArray(json.data)) setItems(json.data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [isSignedIn])

  useEffect(() => {
    if (!isOpen) return
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [isOpen])

  if (!isSignedIn) return null

  const unreadCount = items.filter((n) => !n.read).length

  const handleOpenItem = (notification: Notification) => {
    if (!notification.read) {
      setItems((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      )
      fetch(`/api/notifications/${notification.id}`, { method: 'PATCH' }).catch(() => {})
    }
    setIsOpen(false)
    if (notification.link) router.push(notification.link)
  }

  const handleMarkAll = () => {
    const unread = items.filter((n) => !n.read)
    if (unread.length === 0) return
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    Promise.all(
      unread.map((n) =>
        fetch(`/api/notifications/${n.id}`, { method: 'PATCH' }).catch(() => {})
      )
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        title="Notifications"
        onClick={() => setIsOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center border border-line text-inkDim transition-colors hover:border-ink hover:text-ink"
      >
        <Bell size={15} />
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center bg-quarkRed px-1 font-mono text-[9px] font-bold leading-none text-void">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-11 z-50 w-80 border border-line bg-surface shadow-snap-blue">
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <span className="font-mono text-xs uppercase tracking-wider text-inkFaint">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                title="Mark all as read"
                className="flex items-center gap-1 font-mono text-[10px] text-quarkBlue hover:underline"
              >
                <CheckCheck size={11} />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-3 py-6 text-center font-mono text-xs text-inkFaint">
                Nothing yet. Forks, comments, and billing alerts land here.
              </p>
            ) : (
              items.map((notification) => {
                const style = TYPE_STYLES[notification.type] ?? TYPE_STYLES.system
                const Icon = style.icon
                return (
                  <button
                    key={notification.id}
                    onClick={() => handleOpenItem(notification)}
                    className={`flex w-full items-start gap-2.5 border-b border-line px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-surface2 ${
                      notification.read ? 'opacity-60' : ''
                    }`}
                  >
                    <Icon size={14} className={`mt-0.5 shrink-0 ${style.color}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-mono text-xs leading-snug text-ink">
                        {notification.message}
                      </span>
                      <span className="mt-0.5 block font-mono text-[10px] text-inkFaint">
                        {timeAgo(notification.createdAt)}
                      </span>
                    </span>
                    {!notification.read && (
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 bg-quarkBlue" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
