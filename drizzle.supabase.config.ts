// drizzle.supabase.config.ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
	dialect: 'postgresql',
	schema: './db/schema', // output file
	out: './db/migrations',
	dbCredentials: {
		url: process.env.SUPABASE_DB_URL!,
	},
})
