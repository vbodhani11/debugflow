import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { getAuthToken, useMutations, useQuery } from 'deepspace'
import { Badge, Button, Input, Label, Textarea } from '@/components/ui'
import InvestigationNotes from '../../../components/InvestigationNotes'

const sessionStatusMeta = {
  open: { label: 'Open', variant: 'secondary' },
  investigating: { label: 'Investigating', variant: 'warning' },
  resolved: { label: 'Resolved', variant: 'success' },
} as const

const hypothesisStatusMeta = {
  untested: { label: 'Untested', variant: 'secondary' },
  testing: { label: 'Testing', variant: 'warning' },
  confirmed: { label: 'Confirmed', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'destructive' },
} as const

function formatTimestamp(value: unknown): string {
  if (!value) return 'Not recorded'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return 'Not recorded'
  return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
}

export default function DebugSessionDetail() {
  const params = useParams()
  const id = params.id!
  const { records } = useQuery('debug_sessions', { where: { recordId: id } })
  const { records: hypothesisRecords, status: hypothesisStatus } = useQuery('debug_hypotheses', {
    where: { sessionId: id },
    limit: 50,
  })
  const record = ((records ?? []) as any)[0]
  const debugSessionMutations = useMutations('debug_sessions')
  const hypothesisMutations = useMutations('debug_hypotheses')

  const [rootCause, setRootCause] = useState('')
  const [solution, setSolution] = useState('')
  const [saving, setSaving] = useState(false)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftExplanation, setDraftExplanation] = useState('')
  const [draftNotes, setDraftNotes] = useState('')
  const [draftStatus, setDraftStatus] = useState<string>('untested')
  const [hypothesisDrafting, setHypothesisDrafting] = useState(false)
  const [notesById, setNotesById] = useState<Record<string, string>>({})
  const [statusById, setStatusById] = useState<Record<string, string>>({})
  const [generatingHypotheses, setGeneratingHypotheses] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const [sessionStatus, setSessionStatus] = useState<keyof typeof sessionStatusMeta>('open')

  useEffect(() => {
    setRootCause((record?.data?.rootCause as string) ?? '')
    setSolution((record?.data?.solution as string) ?? '')
    setSessionStatus(((record?.data?.status ?? 'open') as keyof typeof sessionStatusMeta) || 'open')
  }, [record])

  useEffect(() => {
    const nextNotes: Record<string, string> = {}
    const nextStatus: Record<string, string> = {}
    for (const item of hypothesisRecords ?? []) {
      const data = (item as any)?.data ?? {}
      nextNotes[(item as any).recordId] = String(data.experimentNotes ?? '')
      nextStatus[(item as any).recordId] = String(data.status ?? 'untested')
    }
    setNotesById(nextNotes)
    setStatusById(nextStatus)
  }, [hypothesisRecords])

  const hypotheses = useMemo(() => hypothesisRecords ?? [], [hypothesisRecords])
  const createdAt = formatTimestamp(record?.createdAt ?? record?.data?.createdAt)
  const updatedAt = formatTimestamp(record?.updatedAt ?? record?.data?.updatedAt ?? record?.createdAt)

  async function saveSessionDetails(nextStatus: keyof typeof sessionStatusMeta = sessionStatus) {
    if (!record) return
    setSaving(true)
    try {
      await debugSessionMutations.putConfirmed(record.recordId, {
        status: nextStatus,
        rootCause,
        solution,
      })
      setSessionStatus(nextStatus)
    } finally {
      setSaving(false)
    }
  }

  async function handleSessionStatusChange(nextStatus: keyof typeof sessionStatusMeta) {
    if (!record) return
    setSessionStatus(nextStatus)
    await debugSessionMutations.putConfirmed(record.recordId, { status: nextStatus })
  }

  async function addHypothesis() {
    if (!record || !draftTitle.trim() || !draftExplanation.trim()) return

    await hypothesisMutations.create({
      sessionId: id,
      title: draftTitle.trim(),
      explanation: draftExplanation.trim(),
      status: draftStatus,
      experimentNotes: draftNotes.trim(),
      createdAt: new Date().toISOString(),
    })

    setDraftTitle('')
    setDraftExplanation('')
    setDraftNotes('')
    setDraftStatus('untested')
    setHypothesisDrafting(false)
    setSessionStatus('investigating')
    await debugSessionMutations.putConfirmed(record.recordId, { status: 'investigating' })
  }

  async function generateHypotheses() {
    if (!record || generatingHypotheses) return

    setGeneratingHypotheses(true)
    setGenerateError('')

    try {
      const token = await getAuthToken()
      if (!token) {
        throw new Error('Please sign in before generating hypotheses.')
      }

      const response = await fetch('/api/actions/generate-hypotheses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId: id,
          title: record.data.title,
          description: record.data.description,
          error: record.data.error,
          codeSample: record.data.codeSample,
        }),
      })

      const payload = (await response.json().catch(() => ({}))) as { success?: boolean; error?: string }
      if (!response.ok || payload.success === false) {
        throw new Error(payload.error || `Hypothesis generation failed (${response.status}).`)
      }
      setSessionStatus('investigating')
      await debugSessionMutations.putConfirmed(record.recordId, { status: 'investigating' })
    } catch (error) {
      setGenerateError(
        error instanceof Error ? error.message : 'Hypothesis generation failed. Please try again.',
      )
    } finally {
      setGeneratingHypotheses(false)
    }
  }

  async function resolveSession() {
    if (!record) return
    await saveSessionDetails('resolved')
  }

  async function reopenSession() {
    if (!record) return
    await handleSessionStatusChange('investigating')
  }

  async function updateHypothesis(hypothesis: any) {
    const updatedStatus = statusById[hypothesis.recordId] ?? hypothesis.data.status ?? 'untested'
    const updatedNotes = notesById[hypothesis.recordId] ?? hypothesis.data.experimentNotes ?? ''

    await hypothesisMutations.putConfirmed(hypothesis.recordId, {
      status: updatedStatus,
      experimentNotes: updatedNotes,
    })
    setSessionStatus('investigating')
    await debugSessionMutations.putConfirmed(record.recordId, { status: 'investigating' })
  }

  if (!record) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Session</p>
          <h1 className="mt-3 text-2xl font-semibold text-foreground">Session not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">The issue may have been removed or the link is stale.</p>
        </div>
      </div>
    )
  }

  const currentSessionMeta = sessionStatusMeta[sessionStatus] ?? sessionStatusMeta.open

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 lg:px-8">
      <header className="mb-6 rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_0_rgba(0,0,0,0.12)] md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={currentSessionMeta.variant}>{currentSessionMeta.label}</Badge>
              <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Debug session</span>
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">{record.data.title}</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {record.data.description || 'No summary recorded for this session yet.'}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 lg:items-end">
            <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
              <span>Created {createdAt}</span>
              <span>Updated {updatedAt}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
        <main className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-foreground">Issue context</h2>
              <Badge variant="outline" size="sm">Problem summary</Badge>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-background/40 p-3">
                <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Description</p>
                <p className="text-sm leading-6 text-foreground">
                  {record.data.description || 'No description was provided for this issue.'}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-background/40 p-3">
                <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Error / stack trace</p>
                <pre className="max-h-80 overflow-auto rounded-lg border border-border bg-background/30 p-3 font-mono text-[11px] leading-6 text-foreground whitespace-pre-wrap wrap-break-word">
                  {record.data.error || 'No stack trace recorded yet.'}
                </pre>
              </div>

              {record.data.codeSample ? (
                <div className="rounded-xl border border-border bg-background/40 p-3">
                  <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Code / context</p>
                  <pre className="max-h-80 overflow-auto rounded-lg border border-border bg-background/30 p-3 font-mono text-[11px] leading-6 text-foreground whitespace-pre-wrap wrap-break-word">
                    {record.data.codeSample}
                  </pre>
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-4 md:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-foreground">Hypotheses</h2>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  onClick={generateHypotheses}
                  loading={generatingHypotheses}
                  disabled={generatingHypotheses}
                >
                  Generate hypotheses
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setHypothesisDrafting((value) => !value)}
                >
                  {hypothesisDrafting ? 'Hide form' : 'Add hypothesis'}
                </Button>
              </div>
            </div>

            {generateError ? (
              <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
                {generateError}
              </div>
            ) : null}

            {hypothesisDrafting && (
              <div className="mb-5 rounded-xl border border-border bg-background/30 p-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="hypothesis-title">Hypothesis title</Label>
                    <Input
                      id="hypothesis-title"
                      value={draftTitle}
                      onChange={(event) => setDraftTitle(event.target.value)}
                      placeholder="The cache is returning stale data after reload"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hypothesis-explanation">Reasoning</Label>
                    <Textarea
                      id="hypothesis-explanation"
                      value={draftExplanation}
                      onChange={(event) => setDraftExplanation(event.target.value)}
                      rows={4}
                      placeholder="Explain the likely cause and the evidence behind it."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hypothesis-status">Status</Label>
                    <select
                      id="hypothesis-status"
                      value={draftStatus}
                      onChange={(event) => setDraftStatus(event.target.value)}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {Object.entries(hypothesisStatusMeta).map(([key, meta]) => (
                        <option key={key} value={key}>{meta.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hypothesis-notes">Experiment notes</Label>
                    <Textarea
                      id="hypothesis-notes"
                      value={draftNotes}
                      onChange={(event) => setDraftNotes(event.target.value)}
                      rows={3}
                      placeholder="Record steps taken, observations, or next checks."
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={addHypothesis}
                      disabled={!draftTitle.trim() || !draftExplanation.trim()}
                    >
                      Save hypothesis
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {hypothesisStatus === 'loading' ? (
              <div className="rounded-lg border border-dashed border-border bg-background/30 p-4 text-sm text-muted-foreground">
                Loading hypotheses…
              </div>
            ) : hypotheses.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-background/30 p-4 text-sm text-muted-foreground">
                No hypotheses yet. Start with the first likely cause and track how evidence changes as you test it.
              </div>
            ) : (
              <ul className="space-y-3">
                {hypotheses.map((hypothesis: any) => {
                  const itemStatus = (statusById[hypothesis.recordId] ?? hypothesis.data.status ?? 'untested') as keyof typeof hypothesisStatusMeta
                  const cardTone =
                    itemStatus === 'confirmed'
                      ? 'border-emerald-500/40 bg-emerald-500/5'
                      : itemStatus === 'rejected'
                        ? 'border-muted bg-muted/10 opacity-75'
                        : itemStatus === 'testing'
                          ? 'border-amber-500/50 bg-amber-500/5'
                          : 'border-border bg-background/30'

                  return (
                    <li key={hypothesis.recordId} className={`rounded-xl border p-3 ${cardTone}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground">{hypothesis.data.title}</p>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">{hypothesis.data.explanation}</p>
                        </div>
                        <Badge variant={hypothesisStatusMeta[itemStatus]?.variant ?? 'secondary'}>
                          {hypothesisStatusMeta[itemStatus]?.label ?? 'Untested'}
                        </Badge>
                      </div>

                      <div className="mt-4 space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor={`status-${hypothesis.recordId}`}>Status</Label>
                          <select
                            id={`status-${hypothesis.recordId}`}
                            value={itemStatus}
                            onChange={(event) => {
                              const nextStatus = event.target.value
                              setStatusById((current) => ({ ...current, [hypothesis.recordId]: nextStatus }))
                            }}
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            {Object.entries(hypothesisStatusMeta).map(([key, meta]) => (
                              <option key={key} value={key}>{meta.label}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`notes-${hypothesis.recordId}`}>Experiment notes</Label>
                          <Textarea
                            id={`notes-${hypothesis.recordId}`}
                            value={notesById[hypothesis.recordId] ?? ''}
                            rows={3}
                            onChange={(event) => {
                              const nextNotes = event.target.value
                              setNotesById((current) => ({ ...current, [hypothesis.recordId]: nextNotes }))
                            }}
                            placeholder="What did you test, what happened, and what is the next check?"
                          />
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => hypothesisMutations.removeConfirmed(hypothesis.recordId)}
                          >
                            Delete
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => updateHypothesis(hypothesis)}
                            disabled={!statusById[hypothesis.recordId] && !notesById[hypothesis.recordId]}
                          >
                            Save hypothesis
                          </Button>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-4 md:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-foreground">Resolution</h2>
              <div className="flex flex-wrap gap-2">
                {sessionStatus !== 'resolved' ? (
                  <Button type="button" size="sm" onClick={resolveSession}>
                    Resolve session
                  </Button>
                ) : (
                  <Button type="button" size="sm" variant="secondary" onClick={reopenSession}>
                    Reopen session
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="root-cause">Final root cause</Label>
                <Textarea
                  id="root-cause"
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                  rows={5}
                  placeholder="What caused this bug?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="solution">Final solution</Label>
                <Textarea
                  id="solution"
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  rows={5}
                  placeholder="What fixed it?"
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={() => saveSessionDetails()} loading={saving}>Save update</Button>
              </div>
            </div>
          </section>
        </main>

        <aside className="space-y-6">
          <InvestigationNotes sessionId={id} />
        </aside>
      </div>
    </div>
  )
}
