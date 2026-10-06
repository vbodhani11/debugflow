import { useState } from 'react'
import { useMutations } from 'deepspace'
import { Button, Input, Label, Textarea } from '@/components/ui'

export default function DebugSessionForm({
  onCreated,
}: {
  onCreated?: ((r?: any) => void) | undefined
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [codeSample, setCodeSample] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const mutations = useMutations('debug_sessions')

  const trimmedTitle = title.trim()
  const trimmedError = error.trim()
  const isValid = trimmedTitle.length > 0 && trimmedError.length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return

    setSubmitting(true)
    try {
      const payload = {
        title: trimmedTitle || 'Untitled session',
        description: description.trim(),
        error: trimmedError,
        codeSample: codeSample.trim(),
        status: 'open',
      }
      const created = await mutations.create(payload)
      setTitle('')
      setDescription('')
      setError('')
      setCodeSample('')
      onCreated?.(created)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="debug-title">Title</Label>
        <Input
          id="debug-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Null pointer after deploy"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="debug-description">Short description</Label>
        <Textarea
          id="debug-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What was happening when the issue showed up?"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="debug-error">Error / Stack trace</Label>
        <Textarea
          id="debug-error"
          value={error}
          onChange={(e) => setError(e.target.value)}
          placeholder="TypeError: Cannot read properties of undefined..."
          rows={8}
          className="font-mono text-xs"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="debug-code">Code context</Label>
        <Textarea
          id="debug-code"
          value={codeSample}
          onChange={(e) => setCodeSample(e.target.value)}
          placeholder="Paste the relevant code block or a minimal reproduction."
          rows={8}
          className="font-mono text-xs"
        />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">
          {isValid ? 'Ready to capture the issue.' : 'Title and stack trace are required.'}
        </p>
        <Button type="submit" disabled={!isValid || submitting} loading={submitting}>
          {submitting ? 'Creating…' : 'Create session'}
        </Button>
      </div>
    </form>
  )
}
