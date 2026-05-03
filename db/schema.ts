import { relations, sql } from 'drizzle-orm'
import { uniqueIndex, index } from 'drizzle-orm/pg-core'
import {
	boolean,
	doublePrecision,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
	id: text('id').primaryKey(), // this will match NextAuth `user.id` or your UUID
	username: varchar('username', { length: 100 }).notNull().unique(),
	email: varchar('email', { length: 255 }),
	passwordHash: text('password_hash').notNull(),
	image: text('image'),
	role: varchar('role').default('user').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const usersRelations = relations(users, ({ one, many }) => ({
	progress: one(userProgress, {
		fields: [users.id],
		references: [userProgress.userId],
	}),
}))

export const courses = pgTable('courses', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	category: text('category'),
	imageSrc: text('image_src').notNull(),
	proficiencyLevel: text('proficiency_level'),
	endingProficiencyLevel: text('ending_proficiency_level'),
	public: boolean('public').notNull().default(true),
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
	userId: text('user_id')
		.references(() => users.id, { onDelete: 'cascade' })
		.primaryKey(),
	userName: text('user_name').notNull().default('User'),
	hebrewName: text('hebrew_name'),
	spanishName: text('spanish_name'),
	userImageSrc: text('user_image_src').notNull().default('/mascot.svg'),
	hebrewImageSrc: text('hebrew_image_src'),
	email: text('email').notNull().default(''),
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
	isBookclubFriend: boolean('is_bookclub_friend').notNull().default(false),
	isTester: boolean('is_tester').notNull().default(false),
	activeLessonId: integer('active_lesson_id').references(() => lessons.id, {
		onDelete: 'cascade',
	}),
	lastSeen: timestamp('last_seen').defaultNow().notNull(),
})

export const userProgressRelations = relations(
	userProgress,
	({ one, many }) => ({
		user: one(users, {
			fields: [userProgress.userId],
			references: [users.id],
		}),
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

export const flashcardStateEnum = pgEnum('flashcard_state', [
	'new',
	'learning',
	'review',
	'relearning',
	'suspended',
])

export const reviewRatingEnum = pgEnum('review_rating', [
	'again',
	'hard',
	'good',
	'easy',
])

export const flashcardUserState = pgTable(
	'flashcard_user_state',
	{
		id: serial('id').primaryKey(),
		userId: text('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		cardId: integer('card_id').notNull(),
		language: varchar('language', { length: 8 }).notNull().default('he'),
		courseId: integer('course_id').references(() => courses.id, {
			onDelete: 'set null',
		}),
		state: flashcardStateEnum('state').notNull().default('new'),
		dueAt: timestamp('due_at').notNull().defaultNow(),
		learningStep: integer('learning_step').notNull().default(0),
		intervalDays: doublePrecision('interval_days').notNull().default(0),
		ease: doublePrecision('ease').notNull().default(2.5),
		reps: integer('reps').notNull().default(0),
		lapses: integer('lapses').notNull().default(0),
		lastReviewedAt: timestamp('last_reviewed_at'),
		leech: boolean('leech').notNull().default(false),
		leechSuspendedAt: timestamp('leech_suspended_at'),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		updatedAt: timestamp('updated_at').notNull().defaultNow(),
	},
	(table) => ({
		userCardUnique: uniqueIndex('uniq_flashcard_user_course_card_lang').on(
			table.userId,
			table.courseId,
			table.cardId,
			table.language
		),
		userDueIdx: index('idx_flashcard_user_course_due').on(
			table.userId,
			table.courseId,
			table.dueAt
		),
		userStateIdx: index('idx_flashcard_user_course_state').on(
			table.userId,
			table.courseId,
			table.state
		),
	})
)

export const flashcardReviewLog = pgTable(
	'flashcard_review_log',
	{
		id: serial('id').primaryKey(),
		userId: text('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		cardId: integer('card_id').notNull(),
		language: varchar('language', { length: 8 }).notNull().default('he'),
		courseId: integer('course_id').references(() => courses.id, {
			onDelete: 'set null',
		}),
		rating: reviewRatingEnum('rating').notNull(),
		reviewedAt: timestamp('reviewed_at').notNull().defaultNow(),
		prevIntervalDays: doublePrecision('prev_interval_days'),
		nextIntervalDays: doublePrecision('next_interval_days'),
		prevEase: doublePrecision('prev_ease'),
		nextEase: doublePrecision('next_ease'),
		prevState: flashcardStateEnum('prev_state'),
		nextState: flashcardStateEnum('next_state'),
	},
	(table) => ({
		userReviewedIdx: index('idx_flashcard_review_user_time').on(
			table.userId,
			table.reviewedAt
		),
		cardReviewedIdx: index('idx_flashcard_review_card_time').on(
			table.cardId,
			table.reviewedAt
		),
	})
)

export const flashcardUserSettings = pgTable(
	'flashcard_user_settings',
	{
		id: serial('id').primaryKey(),
		userId: text('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		language: varchar('language', { length: 8 }).notNull().default('he'),
		courseId: integer('course_id').references(() => courses.id, {
			onDelete: 'set null',
		}),
		sessionSize: integer('session_size').notNull().default(20),
		newRatio: doublePrecision('new_ratio').notNull().default(0.2),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		updatedAt: timestamp('updated_at').notNull().defaultNow(),
	},
	(table) => ({
		uniqueSettings: uniqueIndex('uniq_flashcard_settings_user_course_lang').on(
			table.userId,
			table.courseId,
			table.language
		),
		userSettingsIdx: index('idx_flashcard_settings_user_course').on(
			table.userId,
			table.courseId
		),
	})
)

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
	current: boolean('current').notNull().default(true),
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

export const locationTypeEnum = pgEnum('location_type', [
	'in_person',
	'zoom',
	'hybrid',
])

export const studyGroupSchedule = pgTable('study_group_schedule', {
	id: serial('id').primaryKey(),
	studyGroupId: integer('study_group_id')
		.references(() => studyGroups.id, { onDelete: 'cascade' })
		.notNull(),
	recurringId: integer('recurring_id').references(
		() => studyGroupRecurringSchedule.id,
		{
			onDelete: 'set null',
		}
	),

	classDate: timestamp('class_date').notNull(),
	isCanceled: boolean('is_canceled').notNull().default(false),

	locationType: locationTypeEnum('location_type').default('zoom'),
	locationName: text('location_name'),
	locationAddress: text('location_address'),
	zoomLink: text('zoom_link'),

	notes: text('notes'),
	homeworkInstructions: text('homework_instructions'),
	homeworkLinks: text('homework_links').array(),

	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const studyGroupScheduleLessons = pgTable(
	'study_group_schedule_lessons',
	{
		id: serial('id').primaryKey(),
		scheduleId: integer('schedule_id')
			.references(() => studyGroupSchedule.id, { onDelete: 'cascade' })
			.notNull(),
		lessonId: integer('lesson_id')
			.references(() => lessons.id, { onDelete: 'cascade' })
			.notNull(),
		order: integer('order').notNull().default(1),
	}
)

export const studyGroupRecurringSchedule = pgTable(
	'study_group_recurring_schedule',
	{
		id: serial('id').primaryKey(),
		studyGroupId: integer('study_group_id')
			.references(() => studyGroups.id, { onDelete: 'cascade' })
			.notNull(),

		daysOfWeek: text('days_of_week').array().notNull(), // ['Tuesday', 'Thursday']
		startTime: text('start_time').notNull(), // '19:00'
		timezone: text('timezone').default('America/Chicago'),

		startDate: timestamp('start_date'),
		endDate: timestamp('end_date'),

		locationType: locationTypeEnum('location_type').notNull().default('zoom'),
		locationName: text('location_name'), // "Room 201" or "Community Center"
		locationAddress: text('location_address'), // optional full address
		zoomLink: text('zoom_link'),

		isActive: boolean('is_active').notNull().default(true),
		notes: text('notes'),

		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	}
)

export const studyGroupScheduleRelations = relations(
	studyGroupSchedule,
	({ one, many }) => ({
		studyGroup: one(studyGroups, {
			fields: [studyGroupSchedule.studyGroupId],
			references: [studyGroups.id],
		}),
		recurringTemplate: one(studyGroupRecurringSchedule, {
			fields: [studyGroupSchedule.recurringId],
			references: [studyGroupRecurringSchedule.id],
		}),
		lessons: many(studyGroupScheduleLessons),
	})
)

export const studyGroupScheduleLessonsRelations = relations(
	studyGroupScheduleLessons,
	({ one }) => ({
		schedule: one(studyGroupSchedule, {
			fields: [studyGroupScheduleLessons.scheduleId],
			references: [studyGroupSchedule.id],
		}),
		lesson: one(lessons, {
			fields: [studyGroupScheduleLessons.lessonId],
			references: [lessons.id],
		}),
	})
)

export const studyGroupRecurringScheduleRelations = relations(
	studyGroupRecurringSchedule,
	({ one, many }) => ({
		studyGroup: one(studyGroups, {
			fields: [studyGroupRecurringSchedule.studyGroupId],
			references: [studyGroups.id],
		}),
		scheduleInstances: many(studyGroupSchedule),
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

export const vocabEntries = pgTable(
	'vocab_entries',
	{
		id: serial('id').primaryKey(),
		sourceKey: text('source_key').notNull(),
		language: varchar('language', { length: 8 }).notNull(),
		courseId: integer('course_id'),
		entryId: integer('entry_id').notNull(),
		lessons: text('lessons').array().notNull().default(sql`'{}'::text[]`),
		type: text('type'),
		category: text('category'),
		eng: text('eng'),
		engDefinition: text('eng_definition'),
		partOfSpeech: text('part_of_speech').array(),
		ipa: text('ipa'),
		images: text('images').array().notNull().default(sql`'{}'::text[]`),
		hebNiqqud: text('heb_niqqud'),
		heb: text('heb'),
		hebAudio: text('heb_audio'),
		grk: text('grk'),
		grkAudio: text('grk_audio'),
		spa: text('spa'),
		por: text('por'),
		engAudio: text('eng_audio'),
		engTransliteration: text('eng_transliteration'),
		spaTransliteration: text('spa_transliteration'),
		porTransliteration: text('por_transliteration'),
		genderPerson: text('gender_person'),
		person: text('person'),
		gender: text('gender'),
		number: text('number'),
		dictionaryUrl: text('dictionary_url'),
		synonyms: text('synonyms').array(),
		antonyms: text('antonyms').array(),
		scriptures: text('scriptures').array(),
		strongs: text('strongs'),
		introduction: text('introduction'),
		payload: jsonb('payload').notNull().default({}),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(table) => ({
		sourceEntryUnique: uniqueIndex('uniq_vocab_source_entry').on(
			table.sourceKey,
			table.entryId
		),
		sourceIdx: index('idx_vocab_source_key').on(table.sourceKey),
		courseIdx: index('idx_vocab_course_id').on(table.courseId),
		languageIdx: index('idx_vocab_language').on(table.language),
	})
)

export const constructAbsoluteWords = pgTable(
	'construct_absolute_words',
	{
		id: serial('id').primaryKey(),
		lessonId: integer('lesson_id')
			.references(() => lessons.id, { onDelete: 'cascade' })
			.notNull(),
		absolute: text('absolute').notNull(),
		construct: text('construct').notNull(),
		payload: jsonb('payload').notNull().default({}),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(table) => ({
		lessonIdx: index('idx_construct_absolute_lesson_id').on(table.lessonId),
	})
)

export const constructAbsoluteWordsRelations = relations(
	constructAbsoluteWords,
	({ one }) => ({
		lesson: one(lessons, {
			fields: [constructAbsoluteWords.lessonId],
			references: [lessons.id],
		}),
	})
)

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
