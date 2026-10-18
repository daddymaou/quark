// app/p/[id]/page.tsx
import type { Metadata } from 'next'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { projects, users } from '@/lib/db/schema'
import { PublicPenPage } from '@/components/pen/PublicPenPage'

interface PageProps {
  params: Promise<{ id: string }>
}

const SITE_NAME = 'Quark'

// pen pages are fully dynamic — content and metadata change per request
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params

  try {
    const rows = await db
      .select({
        name: projects.name,
        description: projects.description,
        tags: projects.tags,
        visibility: projects.visibility,
        ownerId: projects.ownerId,
      })
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1)

    const pen = rows[0]
    if (!pen || pen.visibility === 'private') {
      return {
        title: `Pen · ${SITE_NAME}`,
        robots: { index: false, follow: false },
      }
    }

    const owners = await db
      .select({ username: users.username })
      .from(users)
      .where(eq(users.id, pen.ownerId))
      .limit(1)
    const author = owners[0]?.username

    const title = author
      ? `${pen.name} by @${author} · ${SITE_NAME}`
      : `${pen.name} · ${SITE_NAME}`
    const description =
      pen.description?.trim() ||
      (author
        ? `Check out "${pen.name}" by @${author} on ${SITE_NAME}.`
        : `Check out "${pen.name}" on ${SITE_NAME}.`)
    const image = {
      url: '/social/og-image-1200x630-white-on-black.png',
      width: 1200,
      height: 630,
      alt: title,
    }

    return {
      title,
      description,
      keywords: pen.tags,
      alternates: { canonical: `/p/${id}` },
      openGraph: {
        title,
        description,
        url: `/p/${id}`,
        siteName: SITE_NAME,
        type: 'website',
        images: [image],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [image.url],
      },
      // unlisted pens are link-only — keep them out of search results
      robots:
        pen.visibility === 'public'
          ? { index: true, follow: true }
          : { index: false, follow: true },
    }
  } catch {
    return { title: `Pen · ${SITE_NAME}` }
  }
}

export default async function PublicPenRoute({ params }: PageProps) {
  const { id } = await params
  return <PublicPenPage penId={id} />
}
