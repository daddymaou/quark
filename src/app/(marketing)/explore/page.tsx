// app/(marketing)/explore/page.tsx
'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useEffect, useState } from 'react'

interface PublicPen {
  id: string
  title: string
  description: string
  tags: string[]
  author: string
  updatedAt: string
  forks: number
  views: number
}

export default function ExplorePage() {
  const [pens, setPens] = useState<PublicPen[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'recent' | 'trending'>('recent')
  const [tagFilter, setTagFilter] = useState('')

  // pick up ?q= and ?tag= from the URL after mount (client components still SSR)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const initialQ = params.get('q')
    const initialTag = params.get('tag')
    if (initialQ) setQuery(initialQ)
    if (initialTag) setTagFilter(initialTag.toLowerCase())
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      // keep the filtered view shareable without adding history entries
      const url = new URL(window.location.href)
      if (query) url.searchParams.set('q', query)
      else url.searchParams.delete('q')
      if (tagFilter) url.searchParams.set('tag', tagFilter)
      else url.searchParams.delete('tag')
      window.history.replaceState(null, '', url.toString())

      try {
        const params = new URLSearchParams()
        if (query) params.set('q', query)
        if (tagFilter) params.set('tag', tagFilter)
        params.set('sort', sort)
        const res = await fetch(`/api/projects/public?${params.toString()}`, {
          signal: controller.signal,
        })
        const json = await res.json()
        if (json.success) {
          setPens(json.data || [])
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Failed to load public pens:', err)
        }
      } finally {
        setIsLoading(false)
      }
    }, 400)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, sort, tagFilter])

  const toggleTag = (tag: string) => {
    const next = tag === tagFilter ? '' : tag
    setTagFilter(next)
    const url = new URL(window.location.href)
    if (next) url.searchParams.set('tag', next)
    else url.searchParams.delete('tag')
    window.history.replaceState(null, '', url.toString())
  }

  return (
    <div className="px-4 py-16 md:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 border-b border-line pb-6 md:flex-row md:items-center">
          <div>
            <h1 className="font-ui text-3xl font-bold text-ink md:text-4xl">
              Explore
            </h1>
            <p className="mt-2 font-mono text-sm text-inkDim">
              Public pens from the community — fork, learn, and build.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant={sort === 'recent' ? 'primary' : 'secondary'}
              className="min-h-[40px] px-4 text-sm"
              onClick={() => setSort('recent')}
            >
              Recent
            </Button>
            <Button
              variant={sort === 'trending' ? 'primary' : 'secondary'}
              className="min-h-[40px] px-4 text-sm"
              onClick={() => setSort('trending')}
            >
              Trending
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pens by name or description..."
            className="w-full border border-line bg-surface2 px-4 py-3 font-mono text-sm text-ink placeholder:text-inkFaint focus:border-quarkBlue focus:shadow-snap-blue focus:outline-none"
          />
        </div>

        {/* Active tag filter */}
        {tagFilter && (
          <div className="mt-4 flex items-center gap-3 border border-line bg-surface px-4 py-2 font-mono text-xs text-inkDim">
            <span>
              Filtering by <span className="text-quarkBlue">#{tagFilter}</span>
            </span>
            <button
              onClick={() => toggleTag(tagFilter)}
              className="text-inkFaint underline transition-colors hover:text-ink"
            >
              clear
            </button>
          </div>
        )}

        {/* Pen Grid */}
        {isLoading ? (
          <div className="mt-8 flex justify-center border border-line bg-surface p-12">
            <p className="font-mono text-sm text-inkFaint animate-pulse">
              Loading public pens...
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pens.map((pen) => (
              <div
                key={pen.id}
                className="border border-line bg-surface p-5 transition-shadow duration-75 hover:shadow-snap-blue"
              >
                <Link href={`/p/${pen.id}`} className="block">
                  <h3 className="font-ui text-lg font-semibold text-ink hover:text-quarkBlue">
                    {pen.title}
                  </h3>
                </Link>
                <p className="mt-1 font-mono text-sm text-inkDim line-clamp-2">
                  {pen.description || 'No description provided.'}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {pen.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="info"
                      onClick={() => toggleTag(tag)}
                      className={`cursor-pointer text-[10px] transition-colors hover:bg-quarkBlue/10 ${
                        tagFilter === tag ? 'bg-quarkBlue/15' : ''
                      }`}
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-line pt-3 font-mono text-xs text-inkFaint">
                  <Link
                    href={`/u/${pen.author.replace(/^@/, '')}`}
                    className="hover:text-quarkBlue"
                  >
                    {pen.author}
                  </Link>
                  <span>{new Date(pen.updatedAt).toLocaleDateString()}</span>
                </div>
                <div className="mt-2 flex gap-4 font-mono text-xs text-inkFaint">
                  <span>🔄 {pen.forks} forks</span>
                  <span>👁️ {pen.views} views</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State (if no pens) */}
        {!isLoading && pens.length === 0 && (
          <div className="mt-16 flex flex-col items-center justify-center border border-line bg-surface p-12 text-center">
            <p className="font-mono text-sm text-inkDim">
              {tagFilter
                ? `No public pens tagged #${tagFilter}.`
                : 'No public pens yet.'}
            </p>
            {tagFilter ? (
              <button onClick={() => toggleTag(tagFilter)} className="mt-4">
                <span className="inline-flex min-h-[40px] items-center border border-line px-4 font-mono text-sm text-inkDim transition-colors hover:text-ink">
                  Clear filter
                </span>
              </button>
            ) : (
              <Link href="/dashboard" className="mt-4">
                <Button variant="primary">Create the first pen</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
