// db/schema/relations/course.relations.ts
import { relations } from 'drizzle-orm'
import { units } from '@/db/schema/tables/units'
import { courses } from '@/db/schema/tables/courses'
import { courseTranslations } from '@/db/schema/tables/course_translations'

export const courseRelations = relations(courses, ({ many }) => ({
	translations: many(courseTranslations),
	units: many(units),
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
