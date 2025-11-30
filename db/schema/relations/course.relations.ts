// db/schema/relations/course.relations.ts
import { relations } from 'drizzle-orm'
import { units } from '@/db/schema/tables/units'
import {
	courseEnrollments,
	courseMeetingTimes,
	courses,
} from '@/db/schema/tables/courses'
import { courseTranslations } from '@/db/schema/tables/course_translations'
import { messages } from '../tables/messages'
import { user } from '../tables/auth'

export const courseRelations = relations(courses, ({ one, many }) => ({
	translations: many(courseTranslations),
	units: many(units),
	enrollments: many(courseEnrollments),
	messages: many(messages),
	organizer: one(user, {
		fields: [courses.organizerId],
		references: [user.id],
	}),
	meetingTimes: many(courseMeetingTimes),
}))

export const courseTranslationRelations = relations(
	courseTranslations,
	({ one }) => ({
		course: one(courses, {
			fields: [courseTranslations.courseId],
			references: [courses.id],
		}),
	})
)

export const courseMeetingTimesRelations = relations(
	courseMeetingTimes,
	({ one }) => ({
		course: one(courses, {
			fields: [courseMeetingTimes.courseId],
			references: [courses.id],
		}),
	})
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
