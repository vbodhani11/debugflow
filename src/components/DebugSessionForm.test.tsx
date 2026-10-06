import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DebugSessionForm from './DebugSessionForm'

const createMock = vi.fn(async () => ({ recordId: 'new-session' }))

vi.mock('deepspace', () => ({
  useMutations: () => ({ create: createMock }),
}))

describe('DebugSessionForm', () => {
  it('collects the technical context needed for a debugging session', async () => {
    render(<DebugSessionForm />)

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Null pointer crash' } })
    fireEvent.change(screen.getByLabelText(/short description/i), {
      target: { value: 'Happens in the worker after deploy' },
    })
    fireEvent.change(screen.getByLabelText(/error \/ stack trace/i), {
      target: { value: 'TypeError: cannot read property of undefined' },
    })
    fireEvent.change(screen.getByLabelText(/code context/i), {
      target: { value: 'if (user.profile.name.length) {' },
    })

    fireEvent.click(screen.getByRole('button', { name: /create session/i }))

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Null pointer crash',
        description: 'Happens in the worker after deploy',
        error: 'TypeError: cannot read property of undefined',
        codeSample: 'if (user.profile.name.length) {',
        status: 'open',
      }),
    )
  })
})
