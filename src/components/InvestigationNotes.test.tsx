import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import InvestigationNotes from './InvestigationNotes'

const { create } = vi.hoisted(() => ({ create: vi.fn(async () => ({ recordId: 'r1' })) }))
vi.mock('deepspace', () => ({
  useQuery: () => ({ records: [], status: 'loaded' }),
  useMutations: () => ({ create }),
}))

describe('Investigation Notes', () => {
  it('saves an observation against the current debugging session', async () => {
    render(<InvestigationNotes sessionId="s1" />)
    const input = screen.getByRole('textbox', { name: 'Record an investigation note' })
    fireEvent.change(input, { target: { value: 'Reproduced with an empty cache' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    await waitFor(() => expect(create).toHaveBeenCalledWith({
      sessionId: 's1', text: 'Reproduced with an empty cache', createdAt: expect.any(String),
    }))
    await waitFor(() => expect((input as HTMLInputElement).value).toBe(''))
  })
})
