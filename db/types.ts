import { InferSelectModel } from 'drizzle-orm'
import { hebrewPrayerLibrary, hebrewPrayerLine } from '@/db/schema'

export type HebrewPrayer = InferSelectModel<typeof hebrewPrayerLibrary>
export type HebrewPrayerLine = InferSelectModel<typeof hebrewPrayerLine>

export type HebrewPrayerWithLines = HebrewPrayer & {
	lines: HebrewPrayerLine[]
}
