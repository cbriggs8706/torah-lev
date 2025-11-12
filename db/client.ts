import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const client = postgres(process.env.SUPABASE_DATABASE_URL!, {
	ssl: 'require',
})

export const supabaseDb = drizzle(client, { schema })
