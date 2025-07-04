import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

import * as schema from './schema'

if (typeof window !== 'undefined') {
	throw new Error(
		'❌ drizzle.ts is running in the browser! This must NEVER happen.'
	)
}

const sql = neon(process.env.DATABASE_URL!)
// @ts-ignore
const db = drizzle(sql, { schema })

export default db
