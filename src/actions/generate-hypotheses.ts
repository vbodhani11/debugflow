import type { ActionHandler } from 'deepspace/worker'
import { deepSpaceAgentErrorSummary, streamDeepSpaceAgent } from 'deepspace/worker'
import type { Env } from '../../worker'

type GeneratedHypothesis = {
  conciseHypothesis: string
  reasoning: string
  suggestedValidation: string
}

function stripCodeFence(raw: string): string {
  const matched = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  return matched ? matched[1].trim() : raw.trim()
}

export function normalizeResponse(raw: string): GeneratedHypothesis[] {
  const candidate = stripCodeFence(raw)
  const afterArrayStart = candidate.indexOf('[')
  const beforeArrayEnd = candidate.lastIndexOf(']')
  const jsonText =
    afterArrayStart >= 0 && beforeArrayEnd > afterArrayStart
      ? candidate.slice(afterArrayStart, beforeArrayEnd + 1)
      : candidate

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    const fallback = jsonText
      .replace(/^\s*```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .replace(/^[\s\S]*?\[/, '[')
      .replace(/\][\s\S]*$/, ']')
      .trim()

    if (!fallback || fallback === jsonText) {
      throw new Error('AI response could not be parsed into a hypothesis array.')
    }

    parsed = JSON.parse(fallback)
  }

  if (!Array.isArray(parsed)) {
    throw new Error('AI response was not a JSON array of hypotheses.')
  }

  return parsed.filter((entry): entry is GeneratedHypothesis => {
    if (!entry || typeof entry !== 'object') return false
    return (
      typeof (entry as { conciseHypothesis?: unknown }).conciseHypothesis === 'string' &&
      typeof (entry as { reasoning?: unknown }).reasoning === 'string' &&
      typeof (entry as { suggestedValidation?: unknown }).suggestedValidation === 'string'
    )
  })
}

const defaultSystemPrompt = `You are helping a developer investigate a software bug. Generate 3-5 plausible, root-cause-oriented debugging hypotheses.

Rules:
- Prefer likely causes and concrete test steps over vague advice.
- Do not claim certainty or mark anything as confirmed.
- Keep each hypothesis concise but grounded in the evidence available.
- Write only valid JSON as an array of objects.
- Each object must contain exactly these keys:
  - conciseHypothesis: a short title or statement
  - reasoning: a short explanation of why this is plausible
  - suggestedValidation: a concrete validation or test step
- Return 3-5 items only.`

export const generateHypothesesAction: ActionHandler<Env> = async ({
  userId,
  params,
  tools,
  env,
  callerJwt,
}) => {
  const sessionId = typeof params.sessionId === 'string' ? params.sessionId.trim() : ''
  if (!sessionId) {
    return { success: false, error: 'Missing sessionId.', code: 'missing_session_id' }
  }

  const sessionResult = await tools.get('debug_sessions', sessionId)
  if (!sessionResult.success) {
    return { success: false, error: 'Session not found.', code: 'session_not_found' }
  }

  const session = sessionResult.data.record
  if (session.createdBy !== userId) {
    return { success: false, error: 'You do not own this session.', code: 'forbidden' }
  }

  const sessionData = (session.data ?? {}) as Record<string, unknown>
  const title = typeof sessionData.title === 'string' ? sessionData.title : 'Untitled session'
  const description = typeof sessionData.description === 'string' ? sessionData.description : ''
  const error = typeof sessionData.error === 'string' ? sessionData.error : ''
  const codeSample = typeof sessionData.codeSample === 'string' ? sessionData.codeSample : ''

  const existingResult = await tools.query('debug_hypotheses', { where: { sessionId }, limit: 100 })
  const existingHypotheses = existingResult.success ? existingResult.data.records : []
  const keptTitles = new Set(
    existingHypotheses
      .map((record) => String((record.data.title ?? '') as string).trim().toLowerCase())
      .filter(Boolean),
  )

  const prompt = [
    defaultSystemPrompt,
    '',
    'Session context:',
    `Title: ${title}`,
    `Description: ${description || 'No description provided.'}`,
    `Error / stack trace: ${error || 'No stack trace provided.'}`,
    `Code context: ${codeSample || 'No code sample provided.'}`,
  ].join('\n')

  let generatedText: string
  try {
    const { result } = streamDeepSpaceAgent(env, {
      profile: 'application',
      modelId: 'claude-haiku-4-5',
      authToken: callerJwt,
      instructions: defaultSystemPrompt,
      messages: [{ role: 'user', content: prompt }],
    })
    generatedText = await result.text
  } catch (error) {
    const summary = deepSpaceAgentErrorSummary(error)
    console.error(`[generate-hypotheses] AI request failed: ${summary}`)
    return {
      success: false,
      error: `Hypothesis generation failed: ${summary}`,
      code: 'ai_failed',
    }
  }

  let parsed: GeneratedHypothesis[]
  try {
    parsed = normalizeResponse(generatedText)
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error)
    console.error(`[generate-hypotheses] AI parse failed: ${details}`)
    return {
      success: false,
      error: `The AI returned an unexpected response format: ${details}`,
      code: 'bad_ai_response',
    }
  }

  const validHypotheses = parsed.filter((entry) => {
    const conciseHypothesis = entry.conciseHypothesis.trim()
    const reasoning = entry.reasoning.trim()
    const suggestedValidation = entry.suggestedValidation.trim()
    if (!conciseHypothesis || !reasoning || !suggestedValidation) return false
    if (keptTitles.has(conciseHypothesis.toLowerCase())) return false
    return true
  })

  const created = [] as Array<{
    recordId: string
    title: string
    explanation: string
    status: string
    experimentNotes: string
  }>

  for (const entry of validHypotheses.slice(0, 5)) {
    const conciseHypothesis = entry.conciseHypothesis.trim()
    const reasoning = entry.reasoning.trim()
    const suggestedValidation = entry.suggestedValidation.trim()
    const result = await tools.create('debug_hypotheses', {
      sessionId,
      title: conciseHypothesis,
      explanation: reasoning,
      status: 'untested',
      experimentNotes: suggestedValidation,
      createdAt: new Date().toISOString(),
    })

    if (!result.success) {
      console.error(`[generate-hypotheses] create failed: ${result.error}`)
      continue
    }

    keptTitles.add(conciseHypothesis.toLowerCase())
    created.push({
      recordId: result.data.recordId,
      title: conciseHypothesis,
      explanation: reasoning,
      status: 'untested',
      experimentNotes: suggestedValidation,
    })
  }

  if (created.length === 0) {
    return {
      success: false,
      error: 'No new hypotheses were generated for this session.',
      code: 'no_new_hypotheses',
    }
  }

  return {
    success: true,
    data: { hypotheses: created },
  }
}
