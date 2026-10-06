import { describe, expect, it } from 'vitest'
import { normalizeResponse } from './generate-hypotheses'

describe('normalizeResponse', () => {
  it('accepts markdown-wrapped JSON with leading narrative text', () => {
    const raw = `Here are the likely causes:

\`\`\`json
[
  {
    "conciseHypothesis": "The cache is serving stale values after the deploy",
    "reasoning": "The issue began immediately after rollout, which matches a stale artifact or invalid cache key.",
    "suggestedValidation": "Clear the cache and reproduce with a fresh browser session to confirm the behavior."
  }
]
\`\`\``

    expect(normalizeResponse(raw)).toEqual([
      {
        conciseHypothesis: 'The cache is serving stale values after the deploy',
        reasoning:
          'The issue began immediately after rollout, which matches a stale artifact or invalid cache key.',
        suggestedValidation:
          'Clear the cache and reproduce with a fresh browser session to confirm the behavior.',
      },
    ])
  })
})
