// components/editor/EditorTopBar.tsx
'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { useProjectStore } from '@/lib/store/projectStore'
import { useEditorStore } from '@/lib/store/editorStore'
import { Share2, Save, Upload, Terminal, Check } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { UserButton } from '@clerk/nextjs'
import { NotificationBell } from '@/components/ui/NotificationBell'
import { FileNode } from '@/lib/types'

const AUTOSAVE_DELAY_MS = 1500

export function EditorTopBar() {
  const { currentProject, updateProject } = useProjectStore()
  const { dirtyFiles, fileContents, markClean, toggleConsole, isConsoleOpen } = useEditorStore()
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isClerkEnabled] = useState(() => {
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    return !!(publishableKey && publishableKey.startsWith('pk_'))
  })

  const hasUnsavedChanges = Object.keys(dirtyFiles).length > 0

  // walk the file tree and flush editorStore buffers into the project
  const flushFiles = (nodes: FileNode[]): FileNode[] => {
    return nodes.map((node) => {
      if (node.type === 'file') {
        const edited = fileContents[node.id]
        return {
          ...node,
          content: edited !== undefined ? edited : node.content,
        }
      } else if (node.type === 'folder' && node.children) {
        return {
          ...node,
          children: flushFiles(node.children),
        }
      }
      return node
    })
  }

  const handleSave = async () => {
    if (!currentProject) return
    setIsSaving(true)
    setActionError(null)

    const updatedProject = {
      ...currentProject,
      files: flushFiles(currentProject.files),
      updatedAt: new Date().toISOString(),
    }

    const error = await updateProject(updatedProject)
    if (error) {
      setActionError(error)
    } else {
      Object.keys(dirtyFiles).forEach((id) => markClean(id))
    }
    setIsSaving(false)
  }

  const handlePublish = async () => {
    if (!currentProject) return
    setIsPublishing(true)
    setActionError(null)

    const updatedProject = {
      ...currentProject,
      files: flushFiles(currentProject.files),
      visibility: 'public' as const,
      updatedAt: new Date().toISOString(),
    }

    const error = await updateProject(updatedProject)
    if (error) {
      setActionError(error)
    } else {
      Object.keys(dirtyFiles).forEach((id) => markClean(id))
    }
    setIsPublishing(false)
  }

  // keep the latest save handler in a ref so the autosave timer never
  // captures a stale closure over fileContents / currentProject
  const saveRef = useRef(handleSave)
  useEffect(() => {
    saveRef.current = handleSave
  })

  // debounced autosave: every editor change resets the timer
  useEffect(() => {
    if (!hasUnsavedChanges || isSaving || isPublishing) return
    const timer = setTimeout(() => {
      void saveRef.current()
    }, AUTOSAVE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [hasUnsavedChanges, isSaving, isPublishing, fileContents])

  return (
    <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-2 select-none z-20">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Logo variant="white" width={24} height={24} />
          <span className="font-mono text-sm font-bold text-ink">Quark</span>
        </Link>
        <span className="font-mono text-sm text-inkFaint">/</span>
        <span className="font-mono text-sm text-ink">{currentProject?.name || 'Untitled'}</span>
        <Badge variant={currentProject?.visibility === 'public' ? 'live' : 'faint'}>
          {currentProject?.visibility || 'private'}
        </Badge>
        {hasUnsavedChanges && (
          <span className="font-mono text-xs text-quarkRed">● unsaved</span>
        )}
        {actionError && (
          <span
            className="max-w-[280px] truncate font-mono text-xs text-quarkRed"
            title={actionError}
          >
            {actionError}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Console drawer toggle */}
        <button
          onClick={toggleConsole}
          className={`font-mono text-xs px-3 py-1.5 border flex items-center gap-1.5 transition-none cursor-pointer ${
            isConsoleOpen
              ? 'bg-surface2 border-quarkBlue text-quarkBlue'
              : 'border-line text-inkDim hover:text-ink hover:border-ink'
          }`}
        >
          <Terminal size={14} />
          <span className="hidden md:inline">Console</span>
        </button>

        {/* Save button */}
        <Button
          variant="secondary"
          className="min-h-[32px] px-4 text-xs flex items-center gap-1.5"
          onClick={handleSave}
          disabled={isSaving || !hasUnsavedChanges}
        >
          {isSaving ? (
            <span className="animate-pulse">Saving...</span>
          ) : hasUnsavedChanges ? (
            <>
              <Save size={14} />
              Save
            </>
          ) : (
            <>
              <Check size={14} className="text-quarkGreen" />
              Saved
            </>
          )}
        </Button>

        {/* Publish button */}
        <Button
          variant="primary"
          className="min-h-[32px] px-4 text-xs flex items-center gap-1.5"
          onClick={handlePublish}
          disabled={isPublishing || currentProject?.visibility === 'public'}
        >
          <Upload size={14} />
          {isPublishing ? 'Publishing...' : currentProject?.visibility === 'public' ? 'Published' : 'Publish'}
        </Button>

        {/* Share read-only link */}
        <Link href={`/p/${currentProject?.id}`} target="_blank">
          <Button variant="secondary" className="min-h-[32px] px-4 text-xs flex items-center gap-1.5">
            <Share2 size={14} />
            Share
          </Button>
        </Link>

        {isClerkEnabled && (
          <>
            <div className="h-4 w-px bg-line mx-1" />
            <NotificationBell />
            <UserButton />
          </>
        )}
      </div>
    </header>
  )
}

function Badge({ children, variant }: { children: React.ReactNode; variant: 'live' | 'faint' }) {
  return (
    <span
      className={`font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 border ${
        variant === 'live' ? 'border-quarkGreen text-quarkGreen bg-quarkGreen/5' : 'border-line text-inkFaint'
      }`}
    >
      {children}
    </span>
  )
}