import type { ActionHandler } from 'deepspace/worker'
import type { Env } from '../../worker'
import { generateHypothesesAction } from './generate-hypotheses.js'

export const actions: Record<string, ActionHandler<Env>> = {
  'generate-hypotheses': generateHypothesesAction,
}
