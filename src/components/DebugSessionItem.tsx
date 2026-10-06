import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui'

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'warning' | 'success' | 'destructive' | 'info' }> = {
  open: { label: 'Open', variant: 'secondary' },
  investigating: { label: 'Investigating', variant: 'warning' },
  resolved: { label: 'Resolved', variant: 'success' },
}

function formatUpdate(value: unknown) {
  if (!value) return 'Recent activity'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return 'Recent activity'
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function DebugSessionItem({ record }: { record: any }) {
  const rawStatus = String(record?.data?.status ?? 'open')
  const status = statusLabels[rawStatus] ?? statusLabels.open
  const preview = typeof record?.data?.error === 'string' && record.data.error.trim().length > 0
    ? record.data.error.trim()
    : 'No stack trace recorded yet.'
  const lastUpdated = formatUpdate(record?.data?.updatedAt ?? record?.data?.createdAt ?? record?.createdAt)
  const summary = record?.data?.description?.trim() || 'No description recorded.'

  return (
    <Link
      to={`/debugs/${record.recordId}`}
      className="group block rounded-xl border border-border bg-card p-4 transition-colors hover:border-ring/60 hover:bg-secondary/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-medium text-foreground">
            {record?.data?.title ?? 'Untitled session'}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{summary}</p>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      <div className="mt-4 rounded-lg border border-border bg-background/40 p-3">
        <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Stack trace</p>
        <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-xs leading-5 text-foreground">{preview}</p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
        <span>{record?.data?.rootCause ? 'Root cause captured' : 'Investigation in progress'}</span>
        <span>{lastUpdated}</span>
      </div>
    </Link>
  )
}
