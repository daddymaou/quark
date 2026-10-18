// lib/file-utils.ts
import type { FileNode } from '@/lib/types'

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
