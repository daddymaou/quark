// app/u/[username]/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { projects, users } from '@/lib/db/schema'
import { Badge } from '@/components/ui/Badge'

interface PageProps {
  params: Promise<{ username: string }>
}

const SITE_NAME = 'Quark'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params

  try {
    const rows = await db
      .select({ username: users.username, displayName: users.displayName, bio: users.bio })
      .from(users)
      .where(eq(users.username, username))
      .limit(1)

    const profile = rows[0]
    if (!profile) return { title: `Profile not found · ${SITE_NAME}` }

    const name = profile.displayName || profile.username
    return {
      title: `@${profile.username} · ${SITE_NAME}`,
      description:
        profile.bio?.trim() || `${name}'s public pens on ${SITE_NAME}.`,
      alternates: { canonical: `/u/${profile.username}` },
      openGraph: {
        title: `@${profile.username} · ${SITE_NAME}`,
        description:
          profile.bio?.trim() || `${name}'s public pens on ${SITE_NAME}.`,
        url: `/u/${profile.username}`,
        siteName: SITE_NAME,
        type: 'profile',
      },
      robots: { index: true, follow: true },
    }
  } catch {
    return { title: `Profile · ${SITE_NAME}` }
  }
}

export default async function UserProfilePage({ params }: PageProps) {
  const { username } = await params

  const userRows = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1)
  const profile = userRows[0]
  if (!profile) notFound()

  const penRows = await db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      tags: projects.tags,
      updatedAt: projects.updatedAt,
      forksCount: projects.forksCount,
      viewsCount: projects.viewsCount,
    })
    .from(projects)
    .where(
      and(eq(projects.ownerId, profile.id), eq(projects.visibility, 'public'))
    )
    .orderBy(desc(projects.updatedAt))
    .limit(60)

  const name = profile.displayName || profile.username
  const initial = name.charAt(0).toUpperCase()

  return (
    <div className="px-4 py-16 md:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Profile header */}
        <div className="flex items-start gap-6 border-b border-line pb-8">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center border border-line bg-surface2 font-ui text-3xl font-bold text-quarkBlue">
            {initial}
          </div>
          <div className="min-w-0">
            <h1 className="font-ui text-3xl font-bold text-ink md:text-4xl">
              {name}
            </h1>
            <p className="mt-1 font-mono text-sm text-quarkBlue">
              @{profile.username}
            </p>
            {profile.bio && (
              <p className="mt-3 max-w-xl font-mono text-sm text-inkDim">
                {profile.bio}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-4 font-mono text-xs text-inkFaint">
              <span>{penRows.length} public pen{penRows.length === 1 ? '' : 's'}</span>
              <span>•</span>
              <span>
                Joined{' '}
                {profile.createdAt.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Public pens */}
        {penRows.length === 0 ? (
          <div className="mt-12 flex flex-col items-center justify-center border border-line bg-surface p-12 text-center">
            <p className="font-mono text-sm text-inkDim">
              No public pens yet.
            </p>
            <Link href="/explore" className="mt-4">
              <span className="inline-flex min-h-[40px] items-center border border-line px-4 font-mono text-sm text-inkDim transition-colors hover:text-ink">
                Explore other pens
              </span>
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {penRows.map((pen) => (
              <Link
                key={pen.id}
                href={`/p/${pen.id}`}
                className="block border border-line bg-surface p-5 transition-shadow duration-75 hover:shadow-snap-blue"
              >
                <h3 className="font-ui text-lg font-semibold text-ink">
                  {pen.name}
                </h3>
                <p className="mt-1 font-mono text-sm text-inkDim line-clamp-2">
                  {pen.description || 'No description provided.'}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {pen.tags.map((tag) => (
                    <Badge key={tag} variant="info" className="text-[10px]">
                      #{tag}
                    </Badge>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-line pt-3 font-mono text-xs text-inkFaint">
                  <span>{new Date(pen.updatedAt).toLocaleDateString()}</span>
                  <span>
                    🔄 {pen.forksCount} forks · 👁️ {pen.viewsCount} views
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
