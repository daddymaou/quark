// components/editor/FileTree.tsx
'use client'

import { useProjectStore } from '@/lib/store/projectStore'
import { useEditorStore } from '@/lib/store/editorStore'
import {
  addToDir,
  collectFileIds,
  findFileNode,
  findSiblings,
  hasSiblingName,
  inferLanguage,
  newFileId,
  removeFromTree,
  renameInTree,
  uniqueName,
} from '@/lib/file-utils'
import { FileIcon } from '@/components/ui/FileIcon'
import { FileImportButton } from '@/components/editor/FileImportButton'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { FileNode } from '@/lib/types'
import { Folder, FilePlus, FolderPlus, Pencil, Trash2, X } from 'lucide-react'
import { useState } from 'react'

type CreateMode = 'none' | 'file' | 'folder'

function isValidName(name: string): string | null {
  if (!name) return 'Name is required'
  if (name.includes('/') || name.includes('\\')) return 'Name cannot contain slashes'
  return null
}

export function FileTree() {
  const { currentProject, updateFileTree } = useProjectStore()
  const { openFile, closeFile } = useEditorStore()
  const [createMode, setCreateMode] = useState<CreateMode>('none')
  const [newName, setNewName] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [renameError, setRenameError] = useState('')
  const [deletingNode, setDeletingNode] = useState<FileNode | null>(null)
  const [importing, setImporting] = useState(false)

  if (!currentProject) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="font-mono text-xs text-inkFaint">No files</p>
      </div>
    )
  }

  const files = currentProject.files
  const selectedFolder = selectedFolderId ? findFileNode(files, selectedFolderId) : undefined
  const targetNodes = selectedFolder?.children ?? files

  const startCreate = (mode: Exclude<CreateMode, 'none'>) => {
    setCreateMode(createMode === mode ? 'none' : mode)
    setNewName('')
    setError('')
    setNotice('')
  }

  const handleCreate = () => {
    const name = newName.trim()
    const invalid = isValidName(name)
    if (invalid) {
      setError(invalid)
      return
    }
    if (hasSiblingName(targetNodes, name)) {
      setError(`"${name}" already exists here`)
      return
    }

    if (createMode === 'file') {
      const node: FileNode = {
        id: newFileId(),
        name,
        type: 'file',
        language: inferLanguage(name),
        content: '',
      }
      void updateFileTree(addToDir(files, selectedFolderId, node))
      openFile(node.id, '')
    } else {
      const node: FileNode = {
        id: newFileId(),
        name,
        type: 'folder',
        language: 'html',
        children: [],
      }
      void updateFileTree(addToDir(files, selectedFolderId, node))
    }
    setCreateMode('none')
    setNewName('')
    setError('')
  }

  const startRename = (node: FileNode) => {
    setRenamingId(node.id)
    setRenameValue(node.name)
    setRenameError('')
    setNotice('')
  }

  const handleRenameConfirm = (node: FileNode) => {
    const name = renameValue.trim()
    const invalid = isValidName(name)
    if (invalid) {
      setRenameError(invalid)
      return
    }
    const siblings = findSiblings(files, node.id)
    if (hasSiblingName(siblings, name, node.id)) {
      setRenameError(`"${name}" already exists in this folder`)
      return
    }
    const language = node.type === 'file' ? inferLanguage(name) : node.language
    void updateFileTree(renameInTree(files, node.id, name, language))
    setRenamingId(null)
    setRenameValue('')
    setRenameError('')
  }

  const confirmDelete = () => {
    if (!deletingNode) return
    const ids = collectFileIds(deletingNode)
    ids.forEach((id) => closeFile(id))
    void updateFileTree(removeFromTree(files, deletingNode.id))
    if (selectedFolderId && ids.includes(selectedFolderId)) {
      setSelectedFolderId(null)
    }
    setDeletingNode(null)
  }

  const handleImport = async (nodes: FileNode[]) => {
    setImporting(true)
    setNotice('')
    setCreateMode('none')
    let tree = files
    const taken = [...targetNodes]
    for (const node of nodes) {
      node.name = uniqueName(taken, node.name)
      taken.push(node)
      tree = addToDir(tree, selectedFolderId, node)
    }
    const saveError = await updateFileTree(tree)
    setImporting(false)
    if (saveError) {
      setNotice(saveError)
    } else if (nodes.length > 0) {
      setNotice(`Imported ${nodes.length} item${nodes.length === 1 ? '' : 's'}`)
    }
  }

  const renderNode = (node: FileNode, depth: number) => {
    const isSelected = node.type === 'folder' && node.id === selectedFolderId
    const isRenaming = renamingId === node.id

    return (
      <div key={node.id} style={{ paddingLeft: `${depth * 12 + 4}px` }}>
        <div
          className={`group/row flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 font-mono text-xs transition-colors ${
            isSelected
              ? 'bg-quarkBlue/10 text-quarkBlue'
              : node.type === 'file'
                ? 'text-inkDim hover:bg-surface hover:text-ink'
                : 'font-semibold text-inkFaint hover:text-ink'
          }`}
          onClick={() => {
            if (node.type === 'file') {
              openFile(node.id, node.content)
            } else {
              setSelectedFolderId(isSelected ? null : node.id)
            }
          }}
        >
          {node.type === 'folder' ? (
            <Folder size={14} className="shrink-0 text-quarkBlue" />
          ) : (
            <FileIcon name={node.name} language={node.language} />
          )}

          {isRenaming ? (
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => {
                setRenameValue(e.target.value)
                setRenameError('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameConfirm(node)
                if (e.key === 'Escape') {
                  setRenamingId(null)
                  setRenameError('')
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="min-w-0 flex-1 border border-quarkBlue bg-surface2 px-1 py-0.5 font-mono text-xs text-ink focus:outline-none"
            />
          ) : (
            <span className="truncate">{node.name}</span>
          )}

          {!isRenaming && (
            <span className="ml-auto hidden shrink-0 items-center gap-1 group-hover/row:flex">
              <button
                title="Rename"
                className="text-inkFaint transition-colors hover:text-ink"
                onClick={(e) => {
                  e.stopPropagation()
                  startRename(node)
                }}
              >
                <Pencil size={12} />
              </button>
              <button
                title="Delete"
                className="text-inkFaint transition-colors hover:text-quarkRed"
                onClick={(e) => {
                  e.stopPropagation()
                  setDeletingNode(node)
                }}
              >
                <Trash2 size={12} />
              </button>
            </span>
          )}
        </div>

        {isRenaming && renameError && (
          <p className="pl-6 pt-0.5 font-mono text-[10px] text-quarkRed">{renameError}</p>
        )}

        {node.type === 'folder' && node.children && node.children.length > 0 && (
          <div>{node.children.map((child) => renderNode(child, depth + 1))}</div>
        )}
      </div>
    )
  }

  const iconButton =
    'text-inkFaint transition-colors hover:text-ink cursor-pointer disabled:opacity-50'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between border-b border-line pb-2">
        <span className="font-mono text-xs uppercase tracking-wider text-inkFaint">Files</span>
        <div className="flex items-center gap-2">
          <FileImportButton
            onImport={handleImport}
            onNotice={setNotice}
            disabled={importing}
          />
          <span className="h-3 w-px bg-line" />
          <button title="New file" className={iconButton} onClick={() => startCreate('file')}>
            <FilePlus size={14} />
          </button>
          <button title="New folder" className={iconButton} onClick={() => startCreate('folder')}>
            <FolderPlus size={14} />
          </button>
        </div>
      </div>

      {selectedFolder && (
        <p className="px-2 font-mono text-[10px] text-inkFaint">
          creating inside <span className="text-quarkBlue">/{selectedFolder.name}</span> — click the
          folder again to deselect
        </p>
      )}

      {createMode !== 'none' && (
        <div className="px-2">
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value)
                setError('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate()
                if (e.key === 'Escape') {
                  setCreateMode('none')
                  setError('')
                  setNewName('')
                }
              }}
              placeholder={createMode === 'folder' ? 'components' : 'file.html'}
              className="flex-1 border border-line bg-surface2 px-2 py-1 font-mono text-xs text-ink placeholder:text-inkFaint focus:border-quarkBlue focus:outline-none"
              autoFocus
            />
            <button
              onClick={handleCreate}
              className="font-mono text-xs text-quarkBlue hover:underline"
            >
              Add
            </button>
            <button
              onClick={() => {
                setCreateMode('none')
                setError('')
                setNewName('')
              }}
              className="text-inkFaint transition-colors hover:text-ink"
            >
              <X size={14} />
            </button>
          </div>
          {error && <p className="mt-1 font-mono text-xs text-quarkRed">{error}</p>}
        </div>
      )}

      {notice && <p className="px-2 font-mono text-[10px] text-quarkGreen">{notice}</p>}

      <div className="space-y-0.5">{files.map((file) => renderNode(file, 0))}</div>

      <ConfirmModal
        isOpen={!!deletingNode}
        onClose={() => setDeletingNode(null)}
        onConfirm={confirmDelete}
        title={`Delete ${deletingNode?.type === 'folder' ? 'folder' : 'file'}`}
        description={
          deletingNode?.type === 'folder'
            ? `Folder "${deletingNode.name}" and everything inside it will be removed. This cannot be undone.`
            : `File "${deletingNode?.name}" will be removed. This cannot be undone.`
        }
        confirmLabel="Delete"
      />
    </div>
  )
}
