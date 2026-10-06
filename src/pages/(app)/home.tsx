import { Link } from 'react-router-dom'
import { useQuery } from 'deepspace'
import { ArrowRight, CheckCircle2, Clock3, FolderGit2 } from 'lucide-react'
import { Badge, EmptyState } from '@/components/ui'

const statusMeta = {
  open: { label: 'Open', variant: 'secondary' },
  investigating: { label: 'Investigating', variant: 'warning' },
  resolved: { label: 'Resolved', variant: 'success' },
} as const

export default function HomePage() {
  const { records, status } = useQuery('debug_sessions', { limit: 50 })

  const sessions = records ?? []
  const totalSessions = sessions.length
  const activeCount = sessions.filter((s: any) => ['open', 'investigating'].includes(s?.data?.status ?? 'open')).length
  const resolvedCount = sessions.filter((s: any) => s?.data?.status === 'resolved').length
  const recentSessions = sessions.slice(0, 5)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">DebugFlow</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Dashboard</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Track failures, validate hypotheses, and capture the final fix in one focused workflow.
          </p>
        </div>

        <Link
          to="/debugs"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          View sessions
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </header>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_0_rgba(0,0,0,0.12)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Total sessions</span>
            <FolderGit2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </div>
          <p className="mt-6 text-3xl font-semibold tracking-tight text-foreground">
            {status === 'loading' ? '…' : totalSessions}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_0_rgba(0,0,0,0.12)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Active</span>
            <Clock3 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </div>
          <p className="mt-6 text-3xl font-semibold tracking-tight text-foreground">
            {status === 'loading' ? '…' : activeCount}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_0_rgba(0,0,0,0.12)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Resolved</span>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </div>
          <p className="mt-6 text-3xl font-semibold tracking-tight text-foreground">
            {status === 'loading' ? '…' : resolvedCount}
          </p>
        </div>
      </section>

      <section className="mt-8">
        <div className="rounded-xl border border-border bg-card p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Recent sessions</h2>
            <Link to="/debugs" className="text-sm text-muted-foreground hover:text-foreground">View all</Link>
          </div>

          {status === 'loading' ? (
            <div className="rounded-lg border border-dashed border-border bg-background/40 p-6 text-sm text-muted-foreground">
              Loading recent sessions…
            </div>
          ) : recentSessions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-background/30">
              <EmptyState
                title="No debugging sessions yet"
                description="Create your first session to capture the error, leading hypotheses, and final fix."
              />
            </div>
          ) : (
            <ul className="space-y-3">
              {recentSessions.map((session: any) => {
                const itemStatus = statusMeta[(session?.data?.status ?? 'open') as keyof typeof statusMeta] ?? statusMeta.open
                return (
                  <li key={session.recordId} className="rounded-lg border border-border bg-background/40 p-3 transition-colors hover:border-ring/40">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <Link to={`/debugs/${session.recordId}`} className="block truncate text-sm font-medium text-foreground hover:text-primary">
                          {session?.data?.title ?? 'Untitled session'}
                        </Link>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {session?.data?.description || session?.data?.error || 'No description recorded.'}
                        </p>
                      </div>
                      <Badge variant={itemStatus.variant}>{itemStatus.label}</Badge>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>


      </section>
    </div>
  )
}
