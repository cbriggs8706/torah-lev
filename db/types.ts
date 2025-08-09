import { InferSelectModel } from 'drizzle-orm'
import {
	hebrewPrayerLibrary,
	hebrewPrayerLine,
	hebrewMusicLibrary,
	hebrewMusicLine,
} from '@/db/schema'

export type HebrewPrayer = InferSelectModel<typeof hebrewPrayerLibrary>
export type HebrewPrayerLine = InferSelectModel<typeof hebrewPrayerLine>

export type HebrewPrayerWithLines = HebrewPrayer & {
	lines: HebrewPrayerLine[]
}
export type HebrewMusic = InferSelectModel<typeof hebrewMusicLibrary>
export type HebrewMusicLine = InferSelectModel<typeof hebrewMusicLine>

export type HebrewMusicWithLines = HebrewMusic & {
	lines: HebrewMusicLine[]
}
