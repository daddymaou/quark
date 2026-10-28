'use client'
import { useState, useEffect } from 'react'
import { useProjectStore } from '@/lib/store/projectStore'
import { useEditorStore } from '@/lib/store/editorStore'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { AlertCircle, Loader2, RefreshCcw } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export interface VersionMeta {
  id: string
  summary: string | null
  createdAt: string
  fileCount: number
}

export function VersionHistoryModal({
  projectId,
  isOpen,
  onClose,
}: {
  projectId: string
  isOpen: boolean
  onClose: () => void
}) {
  const { currentProject, setCurrentProject } = useProjectStore()
  const { fileContents, openFiles, activeFileId, markClean } = useEditorStore()
  const [versions, setVersions] = useState<VersionMeta[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [restoring, setRestoring] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (!projectId) return
    fetch(`/api/projects/${projectId}/versions`, {
      cache: 'no-store',
    })
      .then((r) => r.json())
      .then((data) => setVersions(data ?? []))
      .catch((e) => {
        console.error(e)
        setError('Failed to load versions')
        toast({ title: 'Error', description: 'Could not load version history', variant: 'destructive' })
      })
      .finally(() => setIsLoading(false))
  }, [projectId])

  const handleRestore = async (versionId: string) => {
    setRestoring(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/projects/${projectId}/versions/${versionId}/restore`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        }
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Restore failed')
      }
      const restored = (await res.json()) as {
        id: string
        name: string
        description: string
        visibility: string
        files: any[]
        dependencies: any[]
        tags: string[]
        ownerId: string
        createdAt: string
        updatedAt: string
        publishedAt: string | null
      }
      setCurrentProject({
        id: restored.id,
        name: restored.name,
        description: restored.description,
        visibility: restored.visibility,
        files: restored.files,
        dependencies: restored.dependencies,
        tags: restored.tags,
        ownerId: restored.ownerId,
        createdAt: new Date(restored.createdAt),
        updatedAt: new Date(restored.updatedAt),
        publishedAt: restored.publishedAt ? new Date(restored.publishedAt) : null,
      })

      // reset editor buffers to restored content
      const restoredIds = new Set(restored.files.map((f: any) => f.id))
      const nextOpen =
        openFiles.filter((id) => restoredIds.has(id)) ?? []
      if (nextOpen.length === 0 && restored.files.length > 0) {
        nextOpen.push(restored.files[0].id)
      }
      const nextActive =
        nextActive ?? (nextOpen.length > 0 ? nextOpen[0] : null)

      // @ts-ignore — content may be undefined
      const contents: Record<string, string> = {}
      restored.files.forEach((f: any) => {
        contents[f.id] = f.content ?? ''
      })

      markClean?.(restored.id)

      useEditorStore.setState({
        openFiles: nextOpen,
        activeFileId: nextActive ?? null,
        fileContents: contents,
        dirtyFiles: {},
      })

      toast({
        title: 'Restored',
        description: 'Project restored from version history.',
      })
    } catch (e: any) {
      console.error(e)
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setRestoring(false)
    }
  }

  if (isLoading) {
    return (
      <Modal
        title="Loading versions…"
        isOpen
        onClose={() => {}}
        className="max-w-lg"
      >
        <Loader2 className="h-6 w-6" />
      </Modal>
    )
  }

  if (error) {
    return (
      <Modal
        title="Error"
        isOpen
        onClose={() => {}}
        className="max-w-lg"
      >
        <AlertCircle className="text-quarkRed h-6 w-6" />
        <p className="mt-2 text-sm text-quarkRed">{error}</p>
      </Modal>
    )
  }

  if (versions.length === 0) {
    return (
      <Modal
        title="Version history"
        isOpen
        onClose={() => {}}
        className="max-w-lg"
      >
        <p className="mt-2 text-inkFaint">
          No versions yet — save the project (Ctrl+S) to create the first one.
        </p>
      </Modal>
    )
  }

  return (
    <Modal
        title="Version history"
        isOpen={isOpen}
        onClose={onClose}
        className="max-w-lg"
      >
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {versions.map((v) => (
          <div
            key={v.id}
            className="flex items-center justify-between rounded-md p-2 cursor-pointer hover:bg-surface/50 transition-colors"
          >
            <span className="text-sm text-inkFaint">
              {v.summary || ' unnamed'}
            </span>
            <span className="text-xs text-inkFaint">
              {new Date(v.createdAt).toLocaleString()} ({v.fileCount} file{'s'.replace(
                v.fileCount === 1 ? '' : 's'
              )})
            </span>
            <Button
              variant="outline"
              size="icon"
              aria-label={`Restore version ${v.id}`}
              onClick={() => handleRestore(v.id)}
              disabled={restoring}
            >
              {restoring ? (
                <span className="animate-pulse" />
              ) : (
                <RefreshCcw size={14} />
              )}
            </Button>
          </div>
        ))}
      </div>
    </Modal>
  )
}