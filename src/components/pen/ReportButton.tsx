// components/pen/ReportButton.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { Flag } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

interface ReportButtonProps {
  penId: string
}

export function ReportButton({ penId }: ReportButtonProps) {
  const { isSignedIn } = useUser()
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [error, setError] = useState('')

  if (!isSignedIn) {
    return (
      <Link
        href="/sign-in"
        title="Sign in to report this pen"
        className="flex min-h-[40px] items-center gap-1.5 border border-line px-4 font-mono text-xs text-inkFaint transition-colors hover:border-quarkRed hover:text-quarkRed"
      >
        <Flag size={14} />
        Report
      </Link>
    )
  }

  const handleSubmit = async () => {
    const trimmed = reason.trim()
    if (!trimmed || trimmed.length > 500) {
      setError('Reason must be 1-500 characters')
      return
    }
    setIsSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/projects/${penId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: trimmed }),
      })
      const json = await res.json()
      if (!json.success) {
        setError(json.error || 'Failed to submit report')
        return
      }
      setIsDone(true)
      setReason('')
      setIsOpen(false)
    } catch {
      setError('Failed to submit report')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <button
        title={isDone ? 'You already reported this pen' : 'Report this pen'}
        disabled={isDone}
        onClick={() => setIsOpen(true)}
        className={`flex min-h-[40px] items-center gap-1.5 border px-4 font-mono text-xs transition-colors ${
          isDone
            ? 'cursor-default border-quarkRed/40 text-quarkRed/70'
            : 'border-line text-inkFaint hover:border-quarkRed hover:text-quarkRed'
        }`}
      >
        <Flag size={14} className={isDone ? 'fill-quarkRed text-quarkRed' : ''} />
        {isDone ? 'Reported' : 'Report'}
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div className="space-y-4">
          <div>
            <h3 className="font-ui text-xl font-bold text-quarkRed">Report this pen</h3>
            <p className="mt-2 font-mono text-sm text-inkDim">
              Tell the moderators what&apos;s wrong. Reports are reviewed by the admin team.
            </p>
          </div>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value)
              setError('')
            }}
            maxLength={500}
            rows={4}
            autoFocus
            placeholder="Describe the issue (spam, offensive content, stolen code...)"
            className="w-full resize-none border border-line bg-surface2 px-3 py-2 font-mono text-sm text-ink placeholder:text-inkFaint focus:border-quarkRed focus:outline-none"
          />
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-inkFaint">{reason.length} / 500</span>
            {error && <span className="font-mono text-xs text-quarkRed">{error}</span>}
          </div>
          <div className="flex gap-3 border-t border-line pt-4">
            <Button
              variant="secondary"
              className="min-h-[40px] flex-1"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="min-h-[40px] flex-1"
              onClick={handleSubmit}
              disabled={isSubmitting || !reason.trim()}
            >
              {isSubmitting ? 'Submitting...' : 'Submit report'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
