// db/schema/tables/courses.ts
import {
	pgTable,
	uuid,
	text,
	boolean,
	timestamp,
	time,
	varchar,
	index,
	integer,
	primaryKey,
} from 'drizzle-orm/pg-core'
import { courseType, dayOfWeek, proficiencyLevel } from '../enums'
import { user } from './auth'
import { relations } from 'drizzle-orm'

export const courses = pgTable(
	'courses',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		slug: text('slug').notNull().unique(),
		courseCode: text('course_code').notNull().unique(),
		section: varchar('section', { length: 10 }),
		type: courseType('type').notNull(),
		description: text('description'),
		imageSrc: text('image_src'),
		category: text('category'),
		current: boolean('current').notNull().default(true),
		startProficiencyLevel: proficiencyLevel(
			'start_proficiency_level'
		).notNull(),
		endProficiencyLevel: proficiencyLevel('end_proficiency_level').notNull(),
		public: boolean('public').notNull().default(true),
		startDate: timestamp('startdate'),
		endDate: timestamp('enddate'),
		//TODO wire up
		organizerId: uuid('organizer_id').references(() => user.id, {
			onDelete: 'set null',
		}),
		organizerGroupName: text('organizer_group_name'),
		location: text('location'),
		zoomLink: text('zoom_link'),
		maxEnrollment: integer('max_enrollment'),
		enrollmentOpen: boolean('enrollment_open').default(true),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(table) => ({
		organizerIdx: index('courses_organizer_id_idx').on(table.organizerId),
	})
)

export const courseMeetingTimes = pgTable(
	'course_meeting_times',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		courseId: uuid('course_id')
			.notNull()
			.references(() => courses.id, { onDelete: 'cascade' }),
		day: dayOfWeek('day').notNull(),
		startTime: time('start_time').notNull(),
		endTime: time('end_time'),
		timezone: text('timezone').default('America/Denver'),
	}, // ✅ Table-level config
	(table) => {
		return {
			courseIdIdx: index('course_meeting_times_course_id_idx').on(
				table.courseId
			),

			dayIdx: index('course_meeting_times_day_idx').on(table.day),
		}
	}
)

export const coursesRelations = relations(courses, ({ one, many }) => ({
	organizer: one(user, {
		fields: [courses.organizerId],
		references: [user.id],
	}),
	meetingTimes: many(courseMeetingTimes),
	enrollments: many(courseEnrollments), // <-- ADD THIS
}))

export const courseMeetingTimesRelations = relations(
	courseMeetingTimes,
	({ one }) => ({
		course: one(courses, {
			fields: [courseMeetingTimes.courseId],
			references: [courses.id],
		}),
	})
)

export const courseEnrollments = pgTable(
	'course_enrollments',
	{
		courseId: uuid('course_id')
			.notNull()
			.references(() => courses.id, { onDelete: 'cascade' }),

		studentId: uuid('student_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),

		role: text('role').default('student').notNull(), // "student", "ta", etc.

		enrolledAt: timestamp('enrolled_at').defaultNow().notNull(),
	},
	(table) => [
		primaryKey({ columns: [table.courseId, table.studentId] }), // composite PK
	]
)

export const courseEnrollmentsRelations = relations(
	courseEnrollments,
	({ one }) => ({
		course: one(courses, {
			fields: [courseEnrollments.courseId],
			references: [courses.id],
		}),
		student: one(user, {
			fields: [courseEnrollments.studentId],
			references: [user.id],
		}),
	})
)
