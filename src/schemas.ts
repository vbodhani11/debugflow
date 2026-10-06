/**
 * Collection Schemas
 *
 * All collections with columns and RBAC permissions.
 * Single source of truth — imported by both worker and frontend.
 *
 * Add schemas by creating a file in src/schemas/ and importing it here.
 */

import type { CollectionSchema } from 'deepspace/schema'
import { usersSchema } from './schemas/users-schema'
import { settingsSchema } from './schemas/admin-schema'
import debugSessionsSchema from './schemas/debug-session-schema'
import debugHypothesesSchema from './schemas/debug-hypothesis-schema'
import debugCommentsSchema from './schemas/debug-comments-schema'

export const schemas: CollectionSchema[] = [
  usersSchema,
  settingsSchema,
  debugSessionsSchema,
  debugHypothesesSchema,
  debugCommentsSchema,
]
