import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import { getDatabaseConfig } from './connection'
import * as schema from './schema'

if (typeof window !== 'undefined') {
	throw new Error(
		'❌ drizzle.ts is running in the browser! This must NEVER happen.'
	)
}

export const pool = new Pool({
	...getDatabaseConfig(),
	ssl: { rejectUnauthorized: false },
	allowExitOnIdle: true,
	idleTimeoutMillis: 5_000,
	max: 1,
})

const db = drizzle(pool, { schema })

export default db
