import { relations } from 'drizzle-orm'
import { units } from '@/db/schema/tables/units'
import { lessons } from '@/db/schema/tables/lessons'
import { courses } from '@/db/schema/tables/courses'
import { unitTranslations } from '@/db/schema/tables/unit_translations'

export const unitRelations = relations(units, ({ one, many }) => ({
	course: one(courses, {
		fields: [units.courseId],
		references: [courses.id],
	}),
	translations: many(unitTranslations),
	lessons: many(lessons),
}))

export const unitTranslationRelations = relations(
	unitTranslations,
	({ one }) => ({
		unit: one(units, {
			fields: [unitTranslations.unitId],
			references: [units.id],
		}),
	})
)
