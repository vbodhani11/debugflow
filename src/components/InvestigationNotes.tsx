import { useState } from 'react'
import { useMutations, useQuery } from 'deepspace'
import { Button } from './ui/Button'
import { Input } from './ui/Input'

export default function InvestigationNotes({ sessionId }: { sessionId: string }) {
  const { records, status } = useQuery('debug_comments', { where: { sessionId }, limit: 50 })
  const mutations = useMutations('debug_comments')
  const [text, setText] = useState('')

  async function addNote() {
    if (!text.trim()) return
    await mutations.create({ sessionId, text, createdAt: new Date().toISOString() })
    setText('')
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 md:p-5">
      <h2 className="text-lg font-semibold text-foreground">Investigation Notes</h2>

      {status === 'loading' ? (
        <div className="mt-4 text-sm text-muted-foreground">Loading notes…</div>
      ) : (records ?? []).length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-border bg-background/30 p-3 text-sm text-muted-foreground">
          No investigation notes yet. Capture the next check, observation, or follow-up while the issue is active.
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {(records ?? []).map((c: any) => (
            <li key={c.recordId} className="rounded-lg border border-border bg-background/40 p-3">
              <div className="text-sm text-foreground">{c.data.text}</div>
              <div className="mt-2 text-[11px] text-muted-foreground">
                {c.data.createdAt ? new Date(c.data.createdAt).toLocaleString() : 'Just now'}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Record an observation, next check, or clue"
          aria-label="Record an investigation note"
          className="flex-1"
        />
        <Button onClick={addNote} disabled={!text.trim()}>Add</Button>
      </div>
    </div>
  )
}
