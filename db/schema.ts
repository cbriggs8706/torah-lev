import { relations } from 'drizzle-orm'
import { uniqueIndex, index } from 'drizzle-orm/pg-core'
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
	proficiencyLevel: text('proficiency_level'),
	endingProficiencyLevel: text('ending_proficiency_level'),
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
	// lessonScripts: many(lessonScripts),
	// englishLessonScripts: many(englishLessonScripts),
}))

export const hebrewLessonScripts = pgTable('hebrew_lesson_scripts', {
	id: serial('id').primaryKey(),
	lessonId: integer('lesson_id').notNull().default(1),
	courseId: integer('course_id').array(),
	part: integer('part'),
	// lessonId: integer('lesson_id')
	// .references(() => lessons.id, { onDelete: 'cascade' })
	// .notNull(),
	content: text('content'),
	contentPlain: text('content_plain'),
	audioSrc: text('audio_src'),
})

export const greekLessonScripts = pgTable('greek_lesson_scripts', {
	id: serial('id').primaryKey(),
	lessonId: integer('lesson_id').notNull(),
	courseId: integer('course_id').array(),
	part: integer('part'),
	// lessonId: integer('lesson_id')
	// .references(() => lessons.id, { onDelete: 'cascade' })
	// .notNull(),
	content: text('content'),
	audioSrc: text('audio_src'),
})

export const englishLessonScripts = pgTable('english_lesson_scripts', {
	id: serial('id').primaryKey(),
	lessonId: text('lesson_id'),
	content: text('content'),
	audioSrc: text('audio_src'),
})

export const englishSlides = pgTable('english_slides', {
	id: serial('id').primaryKey(),
	lessonId: text('lesson_id').notNull().default(''),
	googleUrl: text('google-url').notNull().default(''),
	lessonNumber: text('lesson_number').notNull().default(''),
})

// export const lessonScriptsRelations = relations(lessonScripts, ({ one }) => ({
// 	lesson: one(lessons, {
// 		fields: [lessonScripts.lessonId],
// 		references: [lessons.id],
// 	}),
// }))

// export const englishLessonScriptsRelations = relations(
// 	englishLessonScripts,
// 	({ one }) => ({
// 		lesson: one(lessons, {
// 			fields: [englishLessonScripts.lessonId],
// 			references: [lessons.id],
// 		}),
// 	})
// )

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

export const userProgressRelations = relations(
	userProgress,
	({ one, many }) => ({
		activeCourse: one(courses, {
			fields: [userProgress.activeCourseId],
			references: [courses.id],
		}),
		tribe: one(tribes, {
			fields: [userProgress.tribeId],
			references: [tribes.id],
		}),
		houses: many(houses),
		studyGroups: many(studyGroupMembers),
	})
)

export const userCourseProgress = pgTable(
	'user_course_progress',
	{
		id: serial('id').primaryKey(),

		userId: text('user_id')
			.references(() => userProgress.userId, { onDelete: 'cascade' })
			.notNull(),

		courseId: integer('course_id')
			.references(() => courses.id, { onDelete: 'cascade' })
			.notNull(),

		activeLessonId: integer('active_lesson_id').references(() => lessons.id, {
			onDelete: 'set null',
		}),

		points: integer('points').notNull().default(0),
		hearts: integer('hearts').notNull().default(5),
		completedLessons: integer('completed_lessons').notNull().default(0),
		lastSeen: timestamp('last_seen').defaultNow().notNull(),
	},
	(table) => ({
		userCourseIdx: index('idx_user_course').on(table.userId, table.courseId),
		uniquePair: uniqueIndex('uniq_user_course').on(
			table.userId,
			table.courseId
		),
	})
)

export const userCourseProgressRelations = relations(
	userCourseProgress,
	({ one }) => ({
		user: one(userProgress, {
			fields: [userCourseProgress.userId],
			references: [userProgress.userId],
		}),
		course: one(courses, {
			fields: [userCourseProgress.courseId],
			references: [courses.id],
		}),
		activeLesson: one(lessons, {
			fields: [userCourseProgress.activeLessonId],
			references: [lessons.id],
		}),
	})
)

export const userSubscription = pgTable('user_subscription', {
	id: serial('id').primaryKey(),
	userId: text('user_id').notNull().unique(),
	stripeCustomerId: text('stripe_customer_id').notNull().unique(),
	stripeSubscriptionId: text('stripe_subscription_id').notNull().unique(),
	stripePriceId: text('stripe_price_id').notNull(),
	stripeCurrentPeriodEnd: timestamp('stripe_current_period_end').notNull(),
})

export const userRoles = pgTable('user_roles', {
	id: serial('id').primaryKey(),
	userId: text('user_id')
		.references(() => userProgress.userId, { onDelete: 'cascade' })
		.notNull(),
	isTeacher: boolean('is_teacher').notNull().default(false),
	assignedBy: text('assigned_by').references(() => userProgress.userId, {
		onDelete: 'set null',
	}),
	assignedAt: timestamp('assigned_at').defaultNow().notNull(),
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

export const houses = pgTable('houses', {
	id: serial('id').primaryKey(),
	engName: text('eng_name').notNull(),
	points: integer('points').notNull().default(0),
	imgSrc: text('img_src'),
})

// many-to-many pivot
export const houseMembers = pgTable('house_members', {
	id: serial('id').primaryKey(),
	houseId: integer('house_id')
		.references(() => houses.id, { onDelete: 'cascade' })
		.notNull(),
	userId: text('user_id')
		.references(() => userProgress.userId, { onDelete: 'cascade' })
		.notNull(),
	isLeader: boolean('is_leader').notNull().default(false),
	addedAt: timestamp('added_at').defaultNow().notNull(),
})

export const housesRelations = relations(houses, ({ many }) => ({
	members: many(houseMembers),
}))

export const houseMembersRelations = relations(houseMembers, ({ one }) => ({
	house: one(houses, {
		fields: [houseMembers.houseId],
		references: [houses.id],
	}),
	user: one(userProgress, {
		fields: [houseMembers.userId],
		references: [userProgress.userId],
	}),
}))

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

export const studyGroups = pgTable('study_groups', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	time: text('time').notNull(), // simple string like "8pm"
	level: text('level').notNull(),
	organization: text('organization').notNull(),
	section: text('section').notNull(),
	zoomLink: text('zoom_link'),
	teacherId: text('teacher_id')
		.references(() => userProgress.userId, { onDelete: 'cascade' })
		.notNull(),
})

export const studyGroupMembers = pgTable('study_group_members', {
	id: serial('id').primaryKey(),
	studyGroupId: integer('study_group_id')
		.references(() => studyGroups.id, { onDelete: 'cascade' })
		.notNull(),
	userId: text('user_id')
		.references(() => userProgress.userId, { onDelete: 'cascade' })
		.notNull(),
	addedAt: timestamp('added_at').defaultNow().notNull(),
})

export const studyGroupsRelations = relations(studyGroups, ({ one, many }) => ({
	teacher: one(userProgress, {
		fields: [studyGroups.teacherId],
		references: [userProgress.userId],
	}),
	members: many(studyGroupMembers),
	messages: many(messages),
}))

export const studyGroupMembersRelations = relations(
	studyGroupMembers,
	({ one }) => ({
		studyGroup: one(studyGroups, {
			fields: [studyGroupMembers.studyGroupId],
			references: [studyGroups.id],
		}),
		user: one(userProgress, {
			fields: [studyGroupMembers.userId],
			references: [userProgress.userId],
		}),
	})
)

export const messages = pgTable('messages', {
	id: serial('id').primaryKey(),
	senderId: text('sender_id')
		.references(() => userProgress.userId, { onDelete: 'cascade' })
		.notNull(),
	recipientId: text('recipient_id').references(() => userProgress.userId, {
		onDelete: 'cascade',
	}),
	tribeId: integer('tribe_id').references(() => tribes.id, {
		onDelete: 'cascade',
	}),
	studyGroupId: integer('study_group_id').references(() => studyGroups.id, {
		onDelete: 'cascade',
	}),
	content: text('content').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	readAt: timestamp('read_at'),
})

export const messagesRelations = relations(messages, ({ one }) => ({
	sender: one(userProgress, {
		fields: [messages.senderId],
		references: [userProgress.userId],
	}),
	recipient: one(userProgress, {
		fields: [messages.recipientId],
		references: [userProgress.userId],
	}),
	tribe: one(tribes, {
		fields: [messages.tribeId],
		references: [tribes.id],
	}),
	studyGroup: one(studyGroups, {
		fields: [messages.studyGroupId],
		references: [studyGroups.id],
	}),
}))

export const messageThreads = pgTable('message_threads', {
	id: serial('id').primaryKey(),
	parentMessageId: integer('parent_message_id')
		.references(() => messages.id, { onDelete: 'cascade' })
		.notNull(),
	replyMessageId: integer('reply_message_id')
		.references(() => messages.id, { onDelete: 'cascade' })
		.notNull(),
})

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

export const hebrewStories = pgTable('hebrew_stories', {
	id: serial('id').primaryKey(),
	lessonId: integer('lesson_id').notNull().default(1),
	courseId: integer('course_id').array(),
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

export const englishStories = pgTable('english_stories', {
	id: serial('id').primaryKey(),
	lessonId: text('lesson_id'),
	// .references(() => lessons.lessonKey),
	title: text('title').notNull(),
	order: integer('order').notNull(),
	video: text('video'),
	image: text('image'),
	audio: text('audio'),
	public: boolean('public').notNull().default(true),
	category: text('category').notNull().default(''),
	content: text('content'),
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
