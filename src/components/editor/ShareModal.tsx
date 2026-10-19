// components/editor/ShareModal.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Project } from '@/lib/types'
import { useProjectStore } from '@/lib/store/projectStore'
import { Copy, Check, ExternalLink } from 'lucide-react'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  project: Project
}

const MAX_TAGS = 5
const MAX_TAG_LENGTH = 24

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const { updateVisibility, updateProjectMeta } = useProjectStore()
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedEmbed, setCopiedEmbed] = useState(false)

  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description || '')
  const [tagsInput, setTagsInput] = useState(project.tags.join(', '))
  const [isSaving, setIsSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setName(project.name)
      setDescription(project.description || '')
      setTagsInput(project.tags.join(', '))
      setSaveError('')
      setSavedFlash(false)
    }
    // reset form whenever the modal opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const parseTags = (raw: string): { tags: string[]; error: string | null } => {
    const tags = raw
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
    if (tags.length > MAX_TAGS) return { tags, error: `Maximum ${MAX_TAGS} tags` }
    const tooLong = tags.find((t) => t.length > MAX_TAG_LENGTH)
    if (tooLong) return { tags, error: `Tag "${tooLong}" exceeds ${MAX_TAG_LENGTH} characters` }
    return { tags, error: null }
  }

  const { tags: parsedTags, error: tagError } = parseTags(tagsInput)

  const handleSaveDetails = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      setSaveError('Pen name is required')
      return
    }
    if (tagError) {
      setSaveError(tagError)
      return
    }
    setIsSaving(true)
    setSaveError('')
    const error = await updateProjectMeta({
      name: trimmedName,
      description: description.trim(),
      tags: parsedTags,
    })
    setIsSaving(false)
    if (error) {
      setSaveError(error)
      return
    }
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 2000)
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const publicUrl = `${origin}/p/${project.id}`
  const embedSnippet = `<iframe src="${origin}/embed/${project.id}" width="100%" height="450" frameborder="0" loading="lazy"></iframe>`

  const copyToClipboard = (text: string, type: 'link' | 'embed') => {
    navigator.clipboard.writeText(text)
    if (type === 'link') {
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } else {
      setCopiedEmbed(true)
      setTimeout(() => setCopiedEmbed(false), 2000)
    }
  }

  const visibilityOptions: Array<{ value: 'public' | 'unlisted' | 'private'; label: string }> = [
    { value: 'public', label: 'Public' },
    { value: 'unlisted', label: 'Unlisted' },
    { value: 'private', label: 'Private' },
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-5 font-mono text-sm">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line pb-2">
          <h2 className="font-ui text-lg font-bold text-ink">Pen settings & share</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="font-mono text-base text-inkFaint hover:text-ink transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quarkBlue"
          >
            ✕
          </button>
        </div>

        {/* Details */}
        <div className="flex flex-col gap-3">
          <label className="text-xs uppercase tracking-wider text-inkDim">Pen details</label>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-inkFaint">Name</span>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setSaveError('')
              }}
              maxLength={100}
              placeholder="My awesome pen"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-inkFaint">
              Description
            </span>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                setSaveError('')
              }}
              maxLength={500}
              rows={3}
              placeholder="What does this pen do? Shows up in explore and search."
              className="w-full resize-none border border-line bg-surface2 px-3 py-2 font-mono text-xs text-ink placeholder:text-inkFaint focus:border-quarkBlue focus:outline-none"
            />
            <span className="self-end font-mono text-[10px] text-inkFaint">
              {description.length} / 500
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-inkFaint">
              Tags — comma separated, max {MAX_TAGS}
            </span>
            <Input
              value={tagsInput}
              onChange={(e) => {
                setTagsInput(e.target.value)
                setSaveError('')
              }}
              placeholder="css, animation, landing-page"
            />
            {parsedTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {parsedTags.map((tag) => (
                  <span
                    key={tag}
                    className="border border-quarkBlue px-1.5 py-0.5 text-[10px] text-quarkBlue"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              className="min-h-[36px] px-4 text-xs"
              onClick={handleSaveDetails}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : savedFlash ? '✓ Saved' : 'Save details'}
            </Button>
            {saveError && <span className="text-xs text-quarkRed">{saveError}</span>}
          </div>
        </div>

        {/* Visibility Setting */}
        <div className="flex flex-col gap-2 border-t border-line pt-4">
          <label className="text-xs uppercase tracking-wider text-inkDim">
            Visibility Setting
          </label>
          <div className="flex gap-2">
            {visibilityOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => updateVisibility(option.value)}
                className={`flex-1 py-2 text-xs border uppercase tracking-wider transition-none cursor-pointer ${
                  project.visibility === option.value
                    ? 'bg-surface2 border-quarkBlue text-quarkBlue font-bold'
                    : 'border-line text-inkDim hover:text-ink'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-inkFaint">
            {project.visibility === 'public'
              ? 'Listed in explore, searchable, anyone can view.'
              : project.visibility === 'unlisted'
                ? 'Hidden from explore — only people with the link can view.'
                : 'Only you can view this pen.'}
          </p>
        </div>

        {/* Public Shareable Link */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs uppercase tracking-wider text-inkDim">
            Shareable URL
          </label>
          <div className="flex gap-2">
            <Input value={publicUrl} readOnly className="font-mono text-xs" />
            <Button
              variant="secondary"
              onClick={() => copyToClipboard(publicUrl, 'link')}
              className="shrink-0"
            >
              {copiedLink ? (
                <Check className="w-4 h-4 text-quarkGreen" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Embed Snippet */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs uppercase tracking-wider text-inkDim">
            Embed HTML Code
          </label>
          <div className="flex gap-2">
            <textarea
              value={embedSnippet}
              readOnly
              rows={3}
              className="snap-input px-3 py-2 text-xs font-mono w-full resize-none bg-surface2 border border-line text-inkDim focus:outline-none focus:border-quarkBlue"
            />
            <Button
              variant="secondary"
              onClick={() => copyToClipboard(embedSnippet, 'embed')}
              className="shrink-0 self-start"
            >
              {copiedEmbed ? (
                <Check className="w-4 h-4 text-quarkGreen" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Open Public Page Preview */}
        <div className="pt-2 border-t border-line flex justify-end">
          <a
            href={`/p/${project.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-quarkBlue hover:underline"
          >
            <span>Open public pen page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </Modal>
  )
}
