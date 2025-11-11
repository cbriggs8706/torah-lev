import { relations } from 'drizzle-orm/relations'
import { studyGroupSchedule } from '../tables/studyGroupSchedule'
import { studyGroupScheduleLessons } from '../tables/studyGroupScheduleLessons'

export const studyGroupScheduleRelations = relations(
	studyGroupSchedule,
	({ many }) => ({
		studyGroupScheduleLessons: many(studyGroupScheduleLessons),
	})
)
