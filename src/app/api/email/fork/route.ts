import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { projects, users } from '@/lib/db/schema'
import { sendTransactionalEmail } from '@/lib/resend'
import { getForkNotificationEmailHtml } from '@/emails/fork-notification'

export async function POST(request: NextRequest) {
  try {
    // Auth Check: If Clerk keys are configured, enforce authentication
    const hasClerkKey =
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_')

    if (hasClerkKey) {
      const { userId } = await auth()
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const body = await request.json()
    const { penId, forkerName } = body || {}

    if (!penId || typeof penId !== 'string' || penId.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid or missing penId parameter' }, { status: 400 })
    }

    if (
      !forkerName ||
      typeof forkerName !== 'string' ||
      forkerName.trim().length === 0 ||
      forkerName.length > 100
    ) {
      return NextResponse.json({ error: 'Invalid or missing forkerName parameter' }, { status: 400 })
    }

    // Recipient is resolved server-side from the pen's owner — clients
    // cannot direct notifications at arbitrary addresses.
    const project = await db.query.projects.findFirst({ where: eq(projects.id, penId.trim()) })
    if (!project) {
      return NextResponse.json({ error: 'Pen not found' }, { status: 404 })
    }

    const owner = await db.query.users.findFirst({ where: eq(users.id, project.ownerId) })
    if (!owner?.email) {
      return NextResponse.json({ skipped: true, message: 'Author has no deliverable email' })
    }

    const ownerName = owner.displayName || owner.username
    const penUrl = `${request.nextUrl.origin}/p/${project.id}`

    const html = getForkNotificationEmailHtml(
      ownerName,
      forkerName.trim(),
      project.name,
      penUrl
    )

    const result = await sendTransactionalEmail({
      to: owner.email,
      subject: 'Quark Pen Fork Notification',
      html,
    })

    return NextResponse.json(result)
  } catch (error: unknown) {
    console.error('Fork email API error:', error)
    const err = error as { message?: string }
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
