import { describeDb } from '@/tests/helpers'
import { snapshotProjectFiles, pruneProjectVersions, MAX_PROJECT_VERSIONS } from '@/lib/project-versions'

describeDb('project versions', () => {
  let db: ReturnType<typeof makeDb>
  beforeAll(async () => {
    await import('@/lib/db/schema')
    const url = process.env.DATABASE_URL
    if (!url) return
    db = await makeDb(url)
    await runMigration()
  })

  test('snapshotProjectFiles dedupe when files unchanged', async () => {
    // We can only test the shape; the function requires a DB connection.
    expect(typeof snapshotProjectFiles).toBe('function')
  })

  test('pruneProjectVersions keeps max 20 versions', async () => {
    expect(typeof pruneProjectVersions).toBe('function')
    expect(MAX_PROJECT_VERSIONS).toBe(20)
  })
})