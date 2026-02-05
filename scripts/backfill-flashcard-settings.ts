import 'dotenv/config'
import db from '@/db/drizzle'
import { flashcardUserSettings, users } from '@/db/schema'

const HEBREW_COURSE_IDS = [6, 11, 14]
const GREEK_COURSE_IDS = [12]
const ENGLISH_COURSE_IDS = [16, 13, 17, 3, 4]

type SettingsSeed = {
	courseId: number
	language: string
	sessionSize: number
	newRatio: number
}

function chunk<T>(items: T[], size: number): T[][] {
	const chunks: T[][] = []
	for (let i = 0; i < items.length; i += size) {
		chunks.push(items.slice(i, i + size))
	}
	return chunks
}

async function main() {
	const userRows = await db.select({ id: users.id }).from(users)
	if (userRows.length === 0) {
		console.log('No users found.')
		return
	}

	const seeds: SettingsSeed[] = [
		...HEBREW_COURSE_IDS.map((courseId) => ({
			courseId,
			language: 'he',
			sessionSize: 20,
			newRatio: 0.2,
		})),
		...GREEK_COURSE_IDS.map((courseId) => ({
			courseId,
			language: 'el',
			sessionSize: 20,
			newRatio: 0.2,
		})),
		...ENGLISH_COURSE_IDS.map((courseId) => ({
			courseId,
			language: 'en',
			sessionSize: 20,
			newRatio: 0.2,
		})),
	]

	const chunkSize = 1000
	for (const user of userRows) {
		const rows = seeds.map((seed) => ({
			userId: user.id,
			courseId: seed.courseId,
			language: seed.language,
			sessionSize: seed.sessionSize,
			newRatio: seed.newRatio,
		}))

		const batches = chunk(rows, chunkSize)
		for (const batch of batches) {
			await db
				.insert(flashcardUserSettings)
				.values(batch)
				.onConflictDoNothing()
		}
	}

	console.log(
		`Backfill complete. Users: ${userRows.length}, settings: ${seeds.length}`
	)
}

main().catch((err) => {
	console.error(err)
	process.exit(1)
})
