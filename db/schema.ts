import { relations } from 'drizzle-orm'
import {
	boolean,
	integer,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from 'drizzle-orm/pg-core'

export const courses = pgTable('courses', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	imageSrc: text('image_src').notNull(),
})

export const coursesRelations = relations(courses, ({ many }) => ({
	userProgress: many(userProgress),
	units: many(units),
}))

export const units = pgTable('units', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	description: text('description').notNull(),
	courseId: integer('course_id')
		.references(() => courses.id, { onDelete: 'cascade' })
		.notNull(),
	order: integer('order').notNull(),
})

export const unitsRelations = relations(units, ({ many, one }) => ({
	course: one(courses, {
		fields: [units.courseId],
		references: [courses.id],
	}),
	lessons: many(lessons),
}))

export const lessons = pgTable('lessons', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	unitId: integer('unit_id')
		.references(() => units.id, { onDelete: 'cascade' })
		.notNull(),
	order: integer('order').notNull(),
	lessonNumber: text('lesson_number').notNull().default(''),
	// content: text('content'),
})

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
	unit: one(units, {
		fields: [lessons.unitId],
		references: [units.id],
	}),
	challenges: many(challenges),
}))

export const lessonScripts = pgTable('lesson_scripts', {
	id: serial('id').primaryKey(),
	lessonId: text('lesson_id').notNull(),
	// .references(() => lessons.lessonKey),
	content: text('content'),
	contentPlain: text('content_plain'),
	audioSrc: text('audio_src'),
})

export const grammarLessons = pgTable('grammar_lessons', {
	id: serial('id').primaryKey(),
	lessonId: text('lesson_id').notNull(),
	// .references(() => lessons.lessonKey),
	content: text('content'),
	contentPlain: text('content_plain'),
	audioSrc: text('audio_src'),
})

export const challengesEnum = pgEnum('type', [
	'SELECT',
	'ASSIST',
	'WATCH',
	'AUDIO-VISUAL',
	'AUDIO-TEXT',
	'VISUAL-AUDIO',
	'VISUAL-TEXT',
	'TEXT-AUDIO',
	'TEXT-VISUAL',
])

export const challenges = pgTable('challenges', {
	id: serial('id').primaryKey(),
	lessonId: integer('lesson_id')
		.references(() => lessons.id, { onDelete: 'cascade' })
		.notNull(),
	type: challengesEnum('type').notNull(),
	question: text('question').notNull(),
	order: integer('order').notNull(),
	video: text('video'),
	image: text('image'),
	audio: text('audio'),
	hebNiqqud: text('hebNiqqud'),
})

export const challengesRelations = relations(challenges, ({ one, many }) => ({
	lesson: one(lessons, {
		fields: [challenges.lessonId],
		references: [lessons.id],
	}),
	challengeOptions: many(challengeOptions),
	challengeProgress: many(challengeProgress),
}))

export const challengeOptions = pgTable('challenge_options', {
	id: serial('id').primaryKey(),
	challengeId: integer('challenge_id')
		.references(() => challenges.id, { onDelete: 'cascade' })
		.notNull(),
	text: text('text').notNull(),
	correct: boolean('correct').notNull(),
	imageSrc: text('image_src'),
	audioSrc: text('audio_src'),
	hebNiqqud: text('heb_niqqud'),
})

export const challengeOptionsRelations = relations(
	challengeOptions,
	({ one }) => ({
		challenge: one(challenges, {
			fields: [challengeOptions.challengeId],
			references: [challenges.id],
		}),
	})
)

export const challengeProgress = pgTable('challenge_progress', {
	id: serial('id').primaryKey(),
	userId: text('user_id').notNull(),
	challengeId: integer('challenge_id')
		.references(() => challenges.id, { onDelete: 'cascade' })
		.notNull(),
	completed: boolean('completed').notNull().default(false),
})

export const challengeProgressRelations = relations(
	challengeProgress,
	({ one }) => ({
		challenge: one(challenges, {
			fields: [challengeProgress.challengeId],
			references: [challenges.id],
		}),
	})
)

export const userProgress = pgTable('user_progress', {
	userId: text('user_id').primaryKey(),
	userName: text('user_name').notNull().default('User'),
	userImageSrc: text('user_image_src').notNull().default('/mascot.svg'),
	activeCourseId: integer('active_course_id').references(() => courses.id, {
		onDelete: 'cascade',
	}),
	hearts: integer('hearts').notNull().default(5),
	points: integer('points').notNull().default(0),
	tribeId: integer('tribe_id').references(() => tribes.id, {
		onDelete: 'set null',
	}),
	isHebrewFriend: boolean('is_hebrew_friend').notNull().default(false),
	isSpanishFriend: boolean('is_spanish_friend').notNull().default(false),
	isEnglishFriend: boolean('is_english_friend').notNull().default(false),
	isTester: boolean('is_tester').notNull().default(false),
	activeLessonId: integer('active_lesson_id').references(() => lessons.id, {
		onDelete: 'cascade',
	}),
	lastSeen: timestamp('last_seen').defaultNow().notNull(),
})

export const userProgressRelations = relations(userProgress, ({ one }) => ({
	activeCourse: one(courses, {
		fields: [userProgress.activeCourseId],
		references: [courses.id],
	}),
	tribe: one(tribes, {
		fields: [userProgress.tribeId],
		references: [tribes.id],
	}),
}))

export const userSubscription = pgTable('user_subscription', {
	id: serial('id').primaryKey(),
	userId: text('user_id').notNull().unique(),
	stripeCustomerId: text('stripe_customer_id').notNull().unique(),
	stripeSubscriptionId: text('stripe_subscription_id').notNull().unique(),
	stripePriceId: text('stripe_price_id').notNull(),
	stripeCurrentPeriodEnd: timestamp('stripe_current_period_end').notNull(),
})

// export const hebrewMusicLibrary = pgTable('hebrew_music_library', {
// 	id: serial('id').primaryKey(),
// 	title: text('title').notNull(),
// 	hebTitle: text('heb_title'),
// 	titleTransliteration: text('title_transliteration'),
// 	lessonId: integer('lesson_id').notNull(),
// 	order: integer('order').notNull(),
// 	video: text('video'),
// 	image: text('image'),
// 	audio: text('audio'),
// 	hebTranscription: text('heb_transcription'),
// 	engTranscription: text('eng_transcription'),
// 	engTransliteration: text('eng_transliteration'),
// })

export const hebrewPrayerLibrary = pgTable('hebrew_prayer_library', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	hebTitle: text('heb_title'),
	titleTransliteration: text('title_transliteration'),
	order: integer('order').notNull(),
	video: text('video'),
	image: text('image'),
	audio: text('audio'),
	category: text('category').notNull().default(''),
})

export const hebrewPrayerLine = pgTable('hebrew_prayer_line', {
	id: serial('id').primaryKey(),
	hebrewPrayerLibraryId: integer('hebrew_prayer_library_id')
		.references(() => hebrewPrayerLibrary.id, { onDelete: 'cascade' })
		.notNull(),
	lineNumbers: integer('line_numbers').array().notNull(),
	engText: text('eng_text').notNull(),
	hebNiqqud: text('heb_niqqud').notNull(),
	hebText: text('heb_text').notNull(),
	engTransliteration: text('eng_transliteration').notNull(),
	audioSrc: text('audio_src'),
})

export const hebrewPrayerLineRelations = relations(
	hebrewPrayerLine,
	({ one }) => ({
		hebrewPrayer: one(hebrewPrayerLibrary, {
			fields: [hebrewPrayerLine.hebrewPrayerLibraryId],
			references: [hebrewPrayerLibrary.id],
		}),
	})
)

export const hebrewPrayerLibraryRelations = relations(
	hebrewPrayerLibrary,
	({ many }) => ({
		lines: many(hebrewPrayerLine),
	})
)

export const hebrewMusicLibrary = pgTable('hebrew_music_library', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	hebTitle: text('heb_title'),
	titleTransliteration: text('title_transliteration'),
	order: integer('order').notNull(),
	video: text('video'),
	image: text('image'),
	audio: text('audio'),
	public: boolean('public').notNull().default(false),
	category: text('category').notNull().default(''),
})

export const hebrewMusicLine = pgTable('hebrew_music_line', {
	id: serial('id').primaryKey(),
	hebrewMusicLibraryId: integer('hebrew_music_library_id')
		.references(() => hebrewMusicLibrary.id, { onDelete: 'cascade' })
		.notNull(),
	lineNumbers: integer('line_numbers').array().notNull(),
	sectionLabel: varchar('section_label').notNull(),
	engText: text('eng_text').notNull(),
	hebNiqqud: text('heb_niqqud').notNull(),
	hebText: text('heb_text').notNull(),
	engTransliteration: text('eng_transliteration').notNull(),
	audioSrc: text('audio_src'),
})

export const hebrewMusicLineRelations = relations(
	hebrewMusicLine,
	({ one }) => ({
		hebrewMusic: one(hebrewMusicLibrary, {
			fields: [hebrewMusicLine.hebrewMusicLibraryId],
			references: [hebrewMusicLibrary.id],
		}),
	})
)

export const hebrewMusicLibraryRelations = relations(
	hebrewMusicLibrary,
	({ many }) => ({
		lines: many(hebrewMusicLine),
	})
)

export const tribes = pgTable('tribes', {
	id: serial('id').primaryKey(),
	engName: text('eng_name').notNull(),
	hebName: text('heb_name').notNull(),
	hebNameNiqqud: text('heb_name_niqqud').notNull(),
	points: integer('points').notNull().default(0),
	imgSrc: text('img_src'),
	mother: text('mother').notNull().default(''),
})

export const tribesRelations = relations(tribes, ({ many }) => ({
	members: many(userProgress),
}))

export const events = pgTable('events', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	hebName: text('heb_name'),
	category: text('category').notNull(),
	startTime: timestamp('start_time').defaultNow().notNull(),
	endTime: timestamp('end_time'),
	zoomUrl: text('zoom_url'),
	recordingUrl: text('recording_url'),
	address: text('address'),
	notes: text('notes'),
})

export const stories = pgTable('stories', {
	id: serial('id').primaryKey(),
	lessonId: text('lesson_id'),
	// .references(() => lessons.lessonKey),
	title: text('title').notNull(),
	hebTitle: text('heb_title'),
	titleTransliteration: text('title_transliteration'),
	order: integer('order').notNull(),
	video: text('video'),
	image: text('image'),
	audio: text('audio'),
	public: boolean('public').notNull().default(true),
	category: text('category').notNull().default(''),
	content: text('content'),
	contentPlain: text('content_plain'),
})

export const hebrewWords = pgTable('hebrew_words', {
	id: serial('id').primaryKey(),
	heb: text('heb').notNull(),
	hebNiqqud: text('hebNiqqud').notNull(),
	eng: text('eng').notNull(),
	// engDefinition: text('engDefinition'),
	person: integer('person'),
	gender: text('gender'),
	number: text('number'),
	partOfSpeech: text('partOfSpeech').array(),
	ipa: text('ipa'),
	engTransliteration: text('engTransliteration'),
	dictionaryUrl: text('dictionaryUrl'),
	images: text('images').array(),
	hebAudio: text('hebAudio'),
	// engAudio: text('engAudio'),
	// synonyms: integer('synonyms').array(),
	// antonyms: integer('antonyms').array(),
	lessons: text('lessons').array(),
	// scriptures: text('scriptures').array(),
	strongs: text('strongs'),
	type: text('type'),
	category: text('category'),
})

export const hebrewWordForms = pgTable('hebrew_word_forms', {
	id: serial('id').primaryKey(),
	wordId: integer('word_id').references(() => hebrewWords.id),
	formType: text('form_type'), // base, prefix, conjugation, suffix, construct
	subtype: text('subtype'), // past, present, future, plural, etc.
	person: integer('person'),
	gender: text('gender'),
	number: text('number'),
	heb: text('heb'),
	hebNiqqud: text('hebNiqqud').notNull(),
	eng: text('eng'),
	ipa: text('ipa'),
	engTransliteration: text('engTransliteration'),
	images: text('images').array(),
	hebAudio: text('hebAudio'),
	lessons: text('lessons').array(),
	// scriptures: text('scriptures').array(),
})
