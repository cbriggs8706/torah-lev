// db/schema/relations/lesson.relations.ts

import { relations } from 'drizzle-orm'
import { units } from '@/db/schema/tables/units'
import { lessons } from '@/db/schema/tables/lessons'
import { lessonTranslations } from '@/db/schema/tables/lesson_translations'

export const lessonRelations = relations(lessons, ({ one, many }) => ({
	unit: one(units, {
		fields: [lessons.unitId],
		references: [units.id],
	}),
	translations: many(lessonTranslations),
}))

export const lessonTranslationRelations = relations(
	lessonTranslations,
	({ one }) => ({
		lesson: one(lessons, {
			fields: [lessonTranslations.lessonId],
			references: [lessons.id],
		}),
	})
)
