import { relations } from 'drizzle-orm/relations'
import { studyGroupScheduleLessons } from '../tables/studyGroupScheduleLessons'
import { studyGroupSchedule } from '../tables/studyGroupSchedule'

export const studyGroupScheduleLessonsRelations = relations(
	studyGroupScheduleLessons,
	({ one }) => ({
		studyGroupSchedule: one(studyGroupSchedule, {
			fields: [studyGroupScheduleLessons.scheduleId],
			references: [studyGroupSchedule.id],
		}),
	})
)
