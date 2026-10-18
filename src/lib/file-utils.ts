// lib/file-utils.ts
import type { FileNode } from '@/lib/types'

export const MAX_IMPORT_FILE_SIZE = 500 * 1024
export const MAX_IMPORT_FILES = 100

const EXTENSION_LANGUAGES: Record<string, FileNode['language']> = {
  html: 'html',
  htm: 'html',
  css: 'css',
  js: 'js',
  mjs: 'js',
  cjs: 'js',
  ts: 'ts',
  tsx: 'ts',
  json: 'json',
  md: 'markdown',
  markdown: 'markdown',
}

export function inferLanguage(name: string): FileNode['language'] {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  return EXTENSION_LANGUAGES[ext] ?? 'html'
}

export function newFileId(): string {
  return `file-${crypto.randomUUID()}`
}

export function findFileNode(nodes: FileNode[], id: string): FileNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const found = findFileNode(node.children, id)
      if (found) return found
    }
  }
  return undefined
}

export function findSiblings(files: FileNode[], id: string): FileNode[] {
  for (const node of files) {
    if (node.id === id) return files
    if (node.children) {
      const found = findSiblings(node.children, id)
      if (found !== files) return found
    }
  }
  return files
}

export function hasSiblingName(
  nodes: FileNode[],
  name: string,
  excludeId?: string
): boolean {
  const target = name.trim().toLowerCase()
  return nodes.some((n) => n.id !== excludeId && n.name.trim().toLowerCase() === target)
}

export function uniqueName(nodes: FileNode[], name: string): string {
  if (!hasSiblingName(nodes, name)) return name
  const dot = name.lastIndexOf('.')
  const base = dot > 0 ? name.slice(0, dot) : name
  const ext = dot > 0 ? name.slice(dot) : ''
  let i = 1
  while (hasSiblingName(nodes, `${base} (${i})${ext}`)) i++
  return `${base} (${i})${ext}`
}

export function addToDir(files: FileNode[], dirId: string | null, node: FileNode): FileNode[] {
  if (!dirId) return [...files, node]
  return files.map((n) => {
    if (n.id === dirId) return { ...n, children: [...(n.children ?? []), node] }
    if (n.children) return { ...n, children: addToDir(n.children, dirId, node) }
    return n
  })
}

export function removeFromTree(files: FileNode[], id: string): FileNode[] {
  return files
    .filter((n) => n.id !== id)
    .map((n) => (n.children ? { ...n, children: removeFromTree(n.children, id) } : n))
}

export function renameInTree(
  files: FileNode[],
  id: string,
  name: string,
  language?: FileNode['language']
): FileNode[] {
  return files.map((n) => {
    if (n.id === id) {
      const updated = { ...n, name }
      if (n.type === 'file' && language) updated.language = language
      return updated
    }
    if (n.children) return { ...n, children: renameInTree(n.children, id, name, language) }
    return n
  })
}

export function collectFileIds(node: FileNode): string[] {
  if (node.type === 'file') return [node.id]
  return (node.children ?? []).flatMap(collectFileIds)
}
