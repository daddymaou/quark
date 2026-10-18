// app/embed/[id]/page.tsx
import type { Metadata } from 'next'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { projects } from '@/lib/db/schema'
import { EmbedPenPage } from '@/components/pen/EmbedPenPage'

interface PageProps {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params

  try {
    const rows = await db
      .select({ name: projects.name, visibility: projects.visibility })
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1)

    const pen = rows[0]
    if (!pen || pen.visibility === 'private') {
      return { title: 'Embed · Quark', robots: { index: false, follow: false } }
    }

    return {
      title: `${pen.name} — Quark embed`,
      robots: { index: false, follow: true },
    }
  } catch {
    return { title: 'Embed · Quark', robots: { index: false, follow: false } }
  }
}

export default async function EmbedRoute({ params }: PageProps) {
  const { id } = await params
  return <EmbedPenPage penId={id} />
}
