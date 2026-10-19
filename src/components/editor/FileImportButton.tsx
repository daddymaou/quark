// components/editor/FileImportButton.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { Upload, FolderOpen } from 'lucide-react'
import { FileNode } from '@/lib/types'
import {
  inferLanguage,
  newFileId,
  uniqueName,
  MAX_IMPORT_FILE_SIZE,
  MAX_IMPORT_FILES,
} from '@/lib/file-utils'

const ACCEPTED_EXTENSIONS = new Set([
  'html', 'htm', 'css', 'js', 'mjs', 'cjs', 'ts', 'tsx', 'json', 'md', 'markdown',
])

interface FileImportButtonProps {
  onImport: (nodes: FileNode[]) => Promise<void> | void
  onNotice?: (message: string) => void
  disabled?: boolean
}

function insertInto(nodes: FileNode[], segments: string[], leaf: FileNode) {
  let dir = nodes
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i]
    let folder = dir.find((n) => n.type === 'folder' && n.name === seg)
    if (!folder) {
      folder = { id: newFileId(), name: seg, type: 'folder', language: 'html', children: [] }
      dir.push(folder)
    }
    if (!folder.children) folder.children = []
    dir = folder.children
  }
  leaf.name = uniqueName(dir, segments[segments.length - 1])
  dir.push(leaf)
}

export function FileImportButton({ onImport, onNotice, disabled }: FileImportButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dirInputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    // non-standard picker attributes; set imperatively to avoid React prop warnings
    dirInputRef.current?.setAttribute('webkitdirectory', '')
    dirInputRef.current?.setAttribute('directory', '')
  }, [])

  const process = async (list: FileList | null) => {
    if (!list || list.length === 0) return
    setBusy(true)
    try {
      const selected = Array.from(list).slice(0, MAX_IMPORT_FILES)
      const root: FileNode[] = []
      let skipped = 0

      for (const file of selected) {
        const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
        if (!ACCEPTED_EXTENSIONS.has(ext) || file.size > MAX_IMPORT_FILE_SIZE) {
          skipped++
          continue
        }
        const relative =
          (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name
        const segments = relative.split('/').filter(Boolean)
        const content = await file.text()
        const leaf: FileNode = {
          id: newFileId(),
          name: file.name,
          type: 'file',
          language: inferLanguage(file.name),
          content,
        }
        insertInto(root, segments, leaf)
      }

      if (root.length > 0) await onImport(root)
      if (skipped > 0) {
        onNotice?.(
          `Skipped ${skipped} file${skipped === 1 ? '' : 's'} (unsupported type or over ${MAX_IMPORT_FILE_SIZE / 1024}KB)`
        )
      } else if (root.length === 0) {
        onNotice?.('No importable files found')
      }
    } finally {
      setBusy(false)
    }
  }

  const buttonClass =
    'text-inkFaint hover:text-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quarkBlue'

  return (
    <>
      <button
        title="Import files"
        aria-label="Import files"
        className={buttonClass}
        disabled={busy || disabled}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload size={14} aria-hidden="true" />
      </button>
      <button
        title="Import folder"
        aria-label="Import folder"
        className={buttonClass}
        disabled={busy || disabled}
        onClick={() => dirInputRef.current?.click()}
      >
        <FolderOpen size={14} aria-hidden="true" />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        accept=".html,.htm,.css,.js,.mjs,.cjs,.ts,.tsx,.json,.md,.markdown"
        onChange={(e) => {
          void process(e.target.files)
          e.target.value = ''
        }}
      />
      <input
        ref={dirInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          void process(e.target.files)
          e.target.value = ''
        }}
      />
    </>
  )
}
