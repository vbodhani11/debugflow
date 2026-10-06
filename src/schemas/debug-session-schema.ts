import type { CollectionSchema } from 'deepspace/schema'

export const debugSessionsSchema: CollectionSchema = {
  name: 'debug_sessions',
  columns: [
    { name: 'title', storage: 'text', interpretation: 'plain' },
    { name: 'description', storage: 'text', interpretation: 'plain' },
    { name: 'error', storage: 'text', interpretation: 'plain' },
    { name: 'codeSample', storage: 'text', interpretation: 'plain' },
    { name: 'status', storage: 'text', interpretation: 'plain' },
    { name: 'rootCause', storage: 'text', interpretation: 'plain' },
    { name: 'solution', storage: 'text', interpretation: 'plain' },
  ],
  permissions: {
    viewer: { read: 'own', create: true, update: 'own', delete: 'own' },
    member: { read: 'own', create: true, update: 'own', delete: 'own' },
    admin: { read: true, create: true, update: true, delete: true },
  },
}

export default debugSessionsSchema
