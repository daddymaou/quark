export default async function ChangelogPage() {
  await new Promise((resolve) => setTimeout(resolve, 500))

  return (
    <div className="min-h-screen bg-void p-8 md:p-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-ui text-4xl font-bold text-ink mb-6">Changelog</h1>

        <section className="mb-12">
          <h2 className="font-ui text-2xl font-bold text-ink mb-4">Version 0.2.0 — Version History</h2>
          <ul className="list-disc pl-5 space-y-2 text-inkDim">
            <li>Added version saving on manual save (Ctrl + S). Each save creates a snapshot that can be viewed in the version history.</li>
            <li>Dedupe logic: if the saved files are identical to the latest version, no new version is created.</li>
            <li>Pruning: older versions beyond 20 are automatically removed.</li>
            <li>Restore a previous version: replaces the current project files and resets editor buffers to the restored content, marked clean.</li>
            <li>Version History UI: a “History” button in the top‑bar opens a modal listing the last 20 versions with summary, file count and timestamp.</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="font-ui text-2xl font-bold text-ink mb-4">Version 0.1.0 — Initial Release</h2>
          <ul className="list-disc pl-5 space-y-2 text-inkDim">
            <li>Browser‑based code editor with live preview.</li>
            <li>Monaco Editor integration.</li>
            <li>Share and fork pens.</li>
            <li>CDN imports via esm.sh.</li>
            <li>No installation required.</li>
          </ul>
        </section>

        <div className="mt-8 pt-8 border-t border-line text-center">
          <p className="font-mono text-sm text-inkFaint">
            See the GitHub repository for a full history of changes.
          </p>
        </div>
      </div>
    </div>
  )
}