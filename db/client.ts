// db/client.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const client = postgres(process.env.SUPABASE_DB_URL!, {
	ssl: 'require',
})

export const supabaseDb = drizzle(client, { schema })
