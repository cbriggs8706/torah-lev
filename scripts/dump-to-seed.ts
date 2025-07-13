// Creates a complete seed.ts script that you can run directly to reseed the DB

import 'dotenv/config'
import { writeFile } from 'fs/promises'
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from '../db/schema'

const sql = neon(process.env.DATABASE_URL!) as any
const db = drizzle(sql, { schema })

function formatAsTsArray(data: any[]) {
	return JSON.stringify(data, null, 2)
		.replace(/"([^"]+)":/g, '$1:') // remove quotes from keys
		.replace(/"([^"]+)"/g, (_, str) => {
			// keep quotes around strings, but escape quotes properly
			const escaped = str.replace(/"/g, '\\"')
			return `"${escaped}"`
		})
}

async function main() {
	console.log('Exporting database contents...')

	const tables = {
		courses: await db.query.courses.findMany(),
		units: await db.query.units.findMany(),
		lessons: await db.query.lessons.findMany(),
		challenges: await db.query.challenges.findMany(),
		challengeOptions: await db.query.challengeOptions.findMany(),
	}

	let output = `import 'dotenv/config'\n`
	output += `import { drizzle } from 'drizzle-orm/neon-http'\n`
	output += `import { neon } from '@neondatabase/serverless'\n`
	output += `import * as schema from '../db/schema'\n\n`
	output += `const sql = neon(process.env.DATABASE_URL!) as any\n`
	output += `const db = drizzle(sql, { schema })\n\n`
	output += `const main = async () => {\n`
	output += `  try {\n`
	output += `    console.log('Seeding database')\n\n`

	for (const [tableName, rows] of Object.entries(tables)) {
		output += `    await db.delete(schema.${tableName})\n`
	}

	output += `\n`

	for (const [tableName, rows] of Object.entries(tables)) {
		if (rows.length === 0) continue
		output += `    await db.insert(schema.${tableName}).values(${formatAsTsArray(
			rows
		)})\n\n`
	}

	output += `    console.log('Seeding finished')\n`
	output += `  } catch (error) {\n`
	output += `    console.error(error)\n`
	output += `    throw new Error('Failed to seed the database')\n`
	output += `  }\n`
	output += `}\n\n`
	output += `main()\n`

	await writeFile('scripts/seed.ts', output)
	console.log('✅ Seed file written to scripts/seed.ts')
}

main()
