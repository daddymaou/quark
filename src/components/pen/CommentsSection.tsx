// components/pen/CommentsSection.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { get as apiGet } from '@/lib/api-client'
import { Button } from '@/components/ui/Button'
import { MessageSquare, Trash2 } from 'lucide-react'

interface CommentItem {
  id: string
  userId: string
  content: string
  createdAt: string
  author: string | null
  authorAvatar: string | null
}

function timeAgo(dateString: string): string {
  const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000)
  if (diff < 1) return 'just now'
  if (diff < 60) return `${diff}m ago`
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
  return `${Math.floor(diff / 1440)}d ago`
}

export function CommentsSection({ penId }: { penId: string }) {
  const { isSignedIn, user } = useUser()
  const [comments, setComments] = useState<CommentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [myId, setMyId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/projects/${penId}/comments`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return
        if (json.success && Array.isArray(json.data)) setComments(json.data)
        setIsLoading(false)
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [penId])

  useEffect(() => {
    if (!isSignedIn) return
    apiGet<{ id: string } | null>('/api/me').then(({ data }) => {
      if (data) setMyId(data.id)
    })
  }, [isSignedIn])

  const handlePost = async () => {
    const content = draft.trim()
    if (!content || content.length > 1000 || isPosting) return
    setIsPosting(true)
    setError('')
    try {
      const res = await fetch(`/api/projects/${penId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const json = await res.json()
      if (!json.success || !json.data) {
        setError(json.error || 'Failed to post comment')
        return
      }
      const row = json.data
      setComments((prev) => [
        ...prev,
        {
          id: row.id,
          userId: row.userId,
          content: row.content,
          createdAt: row.createdAt,
          author: user?.username || 'you',
          authorAvatar: user?.imageUrl || null,
        },
      ])
      setDraft('')
    } catch {
      setError('Failed to post comment')
    } finally {
      setIsPosting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (deletingId) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/comments/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setComments((prev) => prev.filter((c) => c.id !== id))
      }
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="mt-12 border-t border-line pt-8">
      <div className="flex items-center gap-2">
        <MessageSquare size={16} className="text-quarkBlue" />
        <h2 className="font-ui text-xl font-bold text-ink">Comments</h2>
        <span className="font-mono text-xs text-inkFaint">({comments.length})</span>
      </div>

      {/* Comment form */}
      {isSignedIn ? (
        <div className="mt-4 border border-line bg-surface p-4">
          <textarea
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              setError('')
            }}
            maxLength={1000}
            rows={3}
            placeholder="Say something about this pen..."
            aria-label="Write a comment"
            className="w-full resize-none border border-line bg-surface2 px-3 py-2 font-mono text-sm text-ink placeholder:text-inkFaint focus:border-quarkBlue focus:outline-none"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="font-mono text-[10px] text-inkFaint">
              {draft.length} / 1000
            </span>
            <Button
              variant="primary"
              className="min-h-[36px] px-4 text-xs"
              onClick={handlePost}
              disabled={isPosting || !draft.trim()}
            >
              {isPosting ? 'Posting...' : 'Post'}
            </Button>
          </div>
          {error && <p className="mt-2 font-mono text-xs text-quarkRed">{error}</p>}
        </div>
      ) : (
        <div className="mt-4 flex items-center justify-between border border-line bg-surface px-4 py-3">
          <p className="font-mono text-sm text-inkDim">Sign in to join the discussion.</p>
          <Link href="/sign-in">
            <Button variant="secondary" className="min-h-[36px] px-4 text-xs">
              Sign in
            </Button>
          </Link>
        </div>
      )}

      {/* Comment list */}
      {isLoading ? (
        <p className="mt-6 font-mono text-sm text-inkFaint animate-pulse">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="mt-6 font-mono text-sm text-inkFaint">
          No comments yet. Be the first to say something.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 border border-line bg-surface p-4">
              {comment.authorAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={comment.authorAvatar}
                  alt=""
                  className="h-8 w-8 shrink-0 border border-line object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-line bg-surface2 font-mono text-xs font-bold text-quarkBlue">
                  {(comment.author || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-ink">
                    @{comment.author || 'unknown'}
                  </span>
                  <span className="font-mono text-[10px] text-inkFaint">
                    {timeAgo(comment.createdAt)}
                  </span>
                  {myId && comment.userId === myId && (
                    <button
                      title="Delete comment"
                      aria-label={`Delete comment by @${comment.author || 'unknown'}`}
                      className="ml-auto text-inkFaint transition-colors hover:text-quarkRed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quarkRed"
                      disabled={deletingId === comment.id}
                      onClick={() => handleDelete(comment.id)}
                    >
                      <Trash2 size={13} aria-hidden="true" />
                    </button>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap font-mono text-sm text-inkDim">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
