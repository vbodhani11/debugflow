import { useMemo, useState } from 'react'
import { useQuery } from 'deepspace'
import { SearchInput, Button, EmptyState, Modal } from '@/components/ui'
import DebugSessionForm from '../../../components/DebugSessionForm'
import DebugSessionItem from '../../../components/DebugSessionItem'

const statusOptions = ['all', 'open', 'investigating', 'resolved'] as const

export default function DebugsPage() {
  const { records, status } = useQuery('debug_sessions', { limit: 100 })
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]>('all')
  const [showCreate, setShowCreate] = useState(false)

  const filteredSessions = useMemo(() => {
    const items = records ?? []
    const normalizedQuery = query.trim().toLowerCase()

    return items.filter((record: any) => {
      const matchesStatus = statusFilter === 'all' || (record?.data?.status ?? 'open') === statusFilter
      const haystack = [record?.data?.title, record?.data?.description, record?.data?.error]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchesQuery = normalizedQuery.length === 0 || haystack.includes(normalizedQuery)
      return matchesStatus && matchesQuery
    })
  }, [query, records, statusFilter])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Session workspace</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Debug sessions</h1>
        </div>
        <Button onClick={() => setShowCreate(true)}>New session</Button>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_0_rgba(0,0,0,0.12)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl flex-1">
            <SearchInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onClear={() => setQuery('')}
              placeholder="Search sessions or stack traces"
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="status-filter" className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as (typeof statusOptions)[number])}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'all' ? 'All statuses' : option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {status === 'loading' ? (
        <div className="rounded-xl border border-border bg-card p-8 text-sm text-muted-foreground">
          Loading sessions…
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card">
          <EmptyState
            title={(records ?? []).length === 0 ? 'No debugging sessions yet' : 'No sessions match your filters'}
            description="Create a debugging session to start tracking the error, hypothesis, and final fix."
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredSessions.map((record: any) => (
            <DebugSessionItem key={record.recordId} record={record} />
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} size="lg">
        <Modal.Header>
          <Modal.Title>Create debug session</Modal.Title>
          <Modal.Description>Capture the failing behavior, relevant code, and stack trace.</Modal.Description>
        </Modal.Header>
        <Modal.Body>
          <DebugSessionForm
            onCreated={() => {
              setShowCreate(false)
            }}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="ghost" onClick={() => setShowCreate(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
