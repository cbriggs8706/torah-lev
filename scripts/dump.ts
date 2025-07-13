// Dumps the database to a seed-DataTransfer.json file (raw export, not runnable)

// import fs from 'fs/promises'

// import { neon } from '@neondatabase/serverless'
// import { drizzle } from 'drizzle-orm/neon-http'
// import * as schema from '../db/schema'
// import 'dotenv/config'

// const sql = neon(process.env.DATABASE_URL!) as any // cast to avoid type conflict
// const db = drizzle(sql, { schema })

// async function dump() {
// 	console.log('Dumping database to seed file...')

// 	// Adjust these based on the tables you want
// 	const courses = await db.query.courses.findMany()
// 	const units = await db.query.units.findMany()
// 	const lessons = await db.query.lessons.findMany()
// 	const challenges = await db.query.challenges.findMany()
// 	const challengeOptions = await db.query.challengeOptions.findMany()

// 	const output = {
// 		courses,
// 		units,
// 		lessons,
// 		challenges,
// 		challengeOptions,
// 	}

// 	await fs.writeFile('seed-data.json', JSON.stringify(output, null, 2))
// 	console.log('✅ Data dumped to seed-data.json')
// }

// dump().catch((err) => {
// 	console.error(err)
// 	process.exit(1)
// })
