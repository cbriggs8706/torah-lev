import { relations } from 'drizzle-orm'
import {
	boolean,
	integer,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
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
	title: text('title').notNull(), // Unit 1
	description: text('description').notNull(), // Learn the basics of spanish
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
})

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
	unit: one(units, {
		fields: [lessons.unitId],
		references: [units.id],
	}),
	challenges: many(challenges),
}))

export const challengesEnum = pgEnum('type', [
	'SELECT',
	'ASSIST',
	'WATCH',
	'PLAY',
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
	play: text('play'),
	// option1Text: text('option1_text'),
	// option1Audio: text('option1_audio'),
	// option1Img: text('option1_img'),
	// option1Default: boolean('option1_default'),
	// option2Text: text('option2_text'),
	// option2Audio: text('option2_audio'),
	// option2Img: text('option2_img'),
	// option2Default: boolean('option2_default'),
	// option3Text: text('option3_text'),
	// option3Audio: text('option3_audio'),
	// option3Img: text('option3_img'),
	// option3Default: boolean('option3_default'),
	// option4Text: text('option4_text'),
	// option4Audio: text('option4_audio'),
	// option4Img: text('option4_img'),
	// option4Default: boolean('option4_default'),
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
})

export const userProgressRelations = relations(userProgress, ({ one }) => ({
	activeCourse: one(courses, {
		fields: [userProgress.activeCourseId],
		references: [courses.id],
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

// import { relations } from 'drizzle-orm'
// import {
// 	boolean,
// 	integer,
// 	pgEnum,
// 	pgTable,
// 	serial,
// 	text,
// 	timestamp,
// 	primaryKey,
// } from 'drizzle-orm/pg-core'

// export const courses = pgTable('courses', {
// 	id: serial('id').primaryKey(),
// 	title: text('title').notNull(),
// 	imageSrc: text('image_src').notNull(),
// })

// export const coursesRelations = relations(courses, ({ many }) => ({
// 	userProgress: many(userProgress),
// 	units: many(units),
// 	categories: many(categories),
// 	coursesToCategories: many(coursesToCategories),
// 	coursesToSchedules: many(coursesToSchedules),
// }))

// export const units = pgTable('units', {
// 	id: serial('id').primaryKey(),
// 	title: text('title').notNull(), // Unit 1
// 	description: text('description').notNull(), // Learn the basics of spanish
// 	courseId: integer('course_id')
// 		.references(() => courses.id, { onDelete: 'cascade' })
// 		.notNull(),
// 	order: integer('order').notNull(),
// })

// export const unitsRelations = relations(units, ({ many, one }) => ({
// 	course: one(courses, {
// 		fields: [units.courseId],
// 		references: [courses.id],
// 	}),
// 	lessons: many(lessons),
// }))

// export const lessons = pgTable('lessons', {
// 	id: serial('id').primaryKey(),
// 	title: text('title').notNull(),
// 	unitId: integer('unit_id')
// 		.references(() => units.id, { onDelete: 'cascade' })
// 		.notNull(),
// 	order: integer('order').notNull(),
// })

// export const lessonsRelations = relations(lessons, ({ one, many }) => ({
// 	unit: one(units, {
// 		fields: [lessons.unitId],
// 		references: [units.id],
// 	}),
// 	challenges: many(challenges),
// }))

// export const challengesEnum = pgEnum('type', ['SELECT', 'ASSIST', 'WATCH'])

// export const challenges = pgTable('challenges', {
// 	id: serial('id').primaryKey(),
// 	lessonId: integer('lesson_id')
// 		.references(() => lessons.id, { onDelete: 'cascade' })
// 		.notNull(),
// 	type: challengesEnum('type').notNull(),
// 	question: text('question').notNull(),
// 	order: integer('order').notNull(),
// 	video: text('video'),
// })

// export const challengesRelations = relations(challenges, ({ one, many }) => ({
// 	lesson: one(lessons, {
// 		fields: [challenges.lessonId],
// 		references: [lessons.id],
// 	}),
// 	challengeOptions: many(challengeOptions),
// 	challengeProgress: many(challengeProgress),
// }))

// export const challengeOptions = pgTable('challenge_options', {
// 	id: serial('id').primaryKey(),
// 	challengeId: integer('challenge_id')
// 		.references(() => challenges.id, { onDelete: 'cascade' })
// 		.notNull(),
// 	text: text('text').notNull(),
// 	correct: boolean('correct').notNull(),
// 	imageSrc: text('image_src'),
// 	audioSrc: text('audio_src'),
// })

// export const challengeOptionsRelations = relations(
// 	challengeOptions,
// 	({ one }) => ({
// 		challenge: one(challenges, {
// 			fields: [challengeOptions.challengeId],
// 			references: [challenges.id],
// 		}),
// 	})
// )

// export const challengeProgress = pgTable('challenge_progress', {
// 	id: serial('id').primaryKey(),
// 	userId: text('user_id').notNull(),
// 	challengeId: integer('challenge_id')
// 		.references(() => challenges.id, { onDelete: 'cascade' })
// 		.notNull(),
// 	completed: boolean('completed').notNull().default(false),
// })

// export const challengeProgressRelations = relations(
// 	challengeProgress,
// 	({ one }) => ({
// 		challenge: one(challenges, {
// 			fields: [challengeProgress.challengeId],
// 			references: [challenges.id],
// 		}),
// 	})
// )

// export const userProgress = pgTable('user_progress', {
// 	userId: text('user_id').primaryKey(),
// 	userName: text('user_name').notNull().default('User'),
// 	userImageSrc: text('user_image_src').notNull().default('/mascot.svg'),
// 	activeCourseId: integer('active_course_id').references(() => courses.id, {
// 		onDelete: 'cascade',
// 	}),
// 	hearts: integer('hearts').notNull().default(5),
// 	points: integer('points').notNull().default(0),
// })

// export const userProgressRelations = relations(userProgress, ({ one }) => ({
// 	activeCourse: one(courses, {
// 		fields: [userProgress.activeCourseId],
// 		references: [courses.id],
// 	}),
// }))

// export const userSubscription = pgTable('user_subscription', {
// 	id: serial('id').primaryKey(),
// 	userId: text('user_id').notNull().unique(),
// 	stripeCustomerId: text('stripe_customer_id').notNull().unique(),
// 	stripeSubscriptionId: text('stripe_subscription_id').notNull().unique(),
// 	stripePriceId: text('stripe_price_id').notNull(),
// 	stripeCurrentPeriodEnd: timestamp('stripe_current_period_end').notNull(),
// })

// export const categories = pgTable('categories', {
// 	id: serial('id').primaryKey(),
// 	title: text('title').notNull(),
// })

// export const categoryRelations = relations(categories, ({ many }) => ({
// 	activities: many(activities),
// 	coursesToCategories: many(coursesToCategories),
// }))

// export const coursesToCategories = pgTable(
// 	'courses_to_categories',
// 	{
// 		courseId: integer('course_id')
// 			.notNull()
// 			.references(() => courses.id),
// 		categoryId: integer('category_id')
// 			.notNull()
// 			.references(() => categories.id),
// 	},
// 	(t) => ({
// 		pk: primaryKey({ columns: [t.courseId, t.categoryId] }),
// 	})
// )

// export const coursesToCategoriesRelations = relations(
// 	coursesToCategories,
// 	({ one }) => ({
// 		category: one(categories, {
// 			fields: [coursesToCategories.categoryId],
// 			references: [categories.id],
// 		}),
// 		course: one(courses, {
// 			fields: [coursesToCategories.courseId],
// 			references: [courses.id],
// 		}),
// 	})
// )

// export const schedules = pgTable('schedules', {
// 	id: serial('id').primaryKey(),
// 	title: text('title').notNull(),
// })

// export const scheduleRelations = relations(schedules, ({ many }) => ({
// 	weeks: many(weeks),
// 	coursesToSchedules: many(coursesToSchedules),
// }))

// export const coursesToSchedules = pgTable(
// 	'courses_to_schedules',
// 	{
// 		courseId: integer('course_id')
// 			.notNull()
// 			.references(() => courses.id),
// 		scheduleId: integer('schedule_id')
// 			.notNull()
// 			.references(() => schedules.id),
// 	},
// 	(t) => ({
// 		pk: primaryKey({ columns: [t.courseId, t.scheduleId] }),
// 	})
// )

// export const coursesToSchedulesRelations = relations(
// 	coursesToSchedules,
// 	({ one }) => ({
// 		schedule: one(schedules, {
// 			fields: [coursesToSchedules.scheduleId],
// 			references: [schedules.id],
// 		}),
// 		course: one(courses, {
// 			fields: [coursesToSchedules.courseId],
// 			references: [courses.id],
// 		}),
// 	})
// )

// export const weeks = pgTable('weeks', {
// 	id: serial('id').primaryKey(),
// 	title: text('title').notNull(),
// 	scheduleId: integer('schedule_id')
// 		.references(() => schedules.id, { onDelete: 'cascade' })
// 		.notNull(),
// })

// export const weekRelations = relations(weeks, ({ one, many }) => ({
// 	schedule: one(schedules, {
// 		fields: [weeks.scheduleId],
// 		references: [schedules.id],
// 	}),
// 	days: many(days),
// }))

// export const days = pgTable('days', {
// 	id: serial('id').primaryKey(),
// 	title: text('title').notNull(),
// 	weekId: integer('week_id')
// 		.references(() => weeks.id, { onDelete: 'cascade' })
// 		.notNull(),
// })

// export const dayRelations = relations(days, ({ one, many }) => ({
// 	week: one(weeks, {
// 		fields: [days.weekId],
// 		references: [weeks.id],
// 	}),
// 	daysToActivities: many(daysToActivities),
// }))

// export const daysToActivities = pgTable(
// 	'days_to_activities',
// 	{
// 		dayId: integer('day_id')
// 			.notNull()
// 			.references(() => days.id),
// 		activityId: integer('activity_id')
// 			.notNull()
// 			.references(() => categories.id),
// 	},
// 	(t) => ({
// 		pk: primaryKey({ columns: [t.dayId, t.activityId] }),
// 	})
// )

// export const daysToActivitiesRelations = relations(
// 	daysToActivities,
// 	({ one }) => ({
// 		day: one(days, {
// 			fields: [daysToActivities.dayId],
// 			references: [days.id],
// 		}),
// 		activities: one(activities, {
// 			fields: [daysToActivities.activityId],
// 			references: [activities.id],
// 		}),
// 	})
// )

// export const lessonsEnum = pgEnum('lesson', [
// 	'1',
// 	'2',
// 	'3',
// 	'4',
// 	'5',
// 	'6',
// 	'7',
// 	'8',
// 	'9',
// 	'10',
// 	'11',
// 	'12',
// 	'13',
// 	'14',
// 	'15',
// 	'16',
// 	'17',
// 	'18',
// 	'19',
// 	'20',
// ])

// export const typesEnum = pgEnum('type', ['SELECT', 'ASSIST', 'WATCH'])

// export const activities = pgTable('activities', {
// 	id: serial('id').primaryKey(),
// 	title: text('title').notNull(),
// 	lessonNumber: lessonsEnum('lesson').notNull(),
// 	type: typesEnum('types').notNull(),
// })

// export const activityRelations = relations(activities, ({ one, many }) => ({
// 	categories: one(categories),
// 	activityProgress: many(activityProgress),
// 	daysToActivities: many(daysToActivities),
// }))

// export const activityProgress = pgTable('activity_progress', {
// 	id: serial('id').primaryKey(),
// 	userId: text('user_id').notNull(),
// 	activityId: integer('activity_id')
// 		.references(() => activities.id, { onDelete: 'cascade' })
// 		.notNull(),
// 	completed: boolean('completed').notNull().default(false),
// })

// export const activityProgressRelations = relations(
// 	activityProgress,
// 	({ one }) => ({
// 		activity: one(activities, {
// 			fields: [activityProgress.activityId],
// 			references: [activities.id],
// 		}),
// 	})
// )
