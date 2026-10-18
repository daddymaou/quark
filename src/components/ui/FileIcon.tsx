// components/ui/FileIcon.tsx
'use client'

import { File } from 'lucide-react'
import type { FileNode } from '@/lib/types'

type Badge = {
  label: string
  color: string
  title: string
}

const EXTENSION_BADGES: Record<string, Badge> = {
  html: { label: '<>', color: '#E44D26', title: 'HTML' },
  htm: { label: '<>', color: '#E44D26', title: 'HTML' },
  css: { label: '#', color: '#4D8DFF', title: 'CSS' },
  js: { label: 'JS', color: '#F7DF1E', title: 'JavaScript' },
  mjs: { label: 'JS', color: '#F7DF1E', title: 'JavaScript' },
  cjs: { label: 'JS', color: '#F7DF1E', title: 'JavaScript' },
  ts: { label: 'TS', color: '#64B5F6', title: 'TypeScript' },
  tsx: { label: 'TS', color: '#64B5F6', title: 'TypeScript' },
  json: { label: '{}', color: '#FFCA28', title: 'JSON' },
  md: { label: 'M', color: '#BCBCBC', title: 'Markdown' },
  markdown: { label: 'M', color: '#BCBCBC', title: 'Markdown' },
}

const LANGUAGE_BADGES: Record<FileNode['language'], Badge> = {
  html: EXTENSION_BADGES.html,
  css: EXTENSION_BADGES.css,
  js: EXTENSION_BADGES.js,
  ts: EXTENSION_BADGES.ts,
  json: EXTENSION_BADGES.json,
  markdown: EXTENSION_BADGES.md,
}

interface FileIconProps {
  name: string
  language?: FileNode['language']
  size?: number
}

export function FileIcon({ name, language, size = 14 }: FileIconProps) {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  const badge = EXTENSION_BADGES[ext] ?? (language ? LANGUAGE_BADGES[language] : undefined)

  if (!badge) {
    return <File size={size} className="shrink-0 text-inkFaint" />
  }

  return (
    <span
      title={badge.title}
      className={`inline-flex shrink-0 items-center justify-center font-mono font-bold leading-none ${
        badge.label.length > 2 ? 'min-w-[20px]' : 'min-w-[14px]'
      }`}
      style={{ color: badge.color, fontSize: size <= 14 ? 9 : 10 }}
    >
      {badge.label}
    </span>
  )
}
