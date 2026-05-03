import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import { getDatabaseConfig } from './connection'
import * as schema from './schema'

if (typeof window !== 'undefined') {
	throw new Error(
		'❌ drizzle.ts is running in the browser! This must NEVER happen.'
	)
}

declare global {
	var __idiomGoPgPool: Pool | undefined
	var __idiomGoDb: ReturnType<typeof drizzle<typeof schema>> | undefined
}

const createPool = () =>
	new Pool({
		...getDatabaseConfig(),
		ssl: { rejectUnauthorized: false },
		allowExitOnIdle: true,
		idleTimeoutMillis: 5_000,
		max: 1,
	})

export const pool = globalThis.__idiomGoPgPool ?? createPool()

if (!globalThis.__idiomGoPgPool) {
	globalThis.__idiomGoPgPool = pool
}

const db = globalThis.__idiomGoDb ?? drizzle(pool, { schema })

if (!globalThis.__idiomGoDb) {
	globalThis.__idiomGoDb = db
}

export default db
