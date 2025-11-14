import { relations } from "drizzle-orm/relations";
import { user, session, units, lessons, courses, studyGroupSchedule, studyGroupScheduleLessons, account } from "./schema";

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	sessions: many(session),
	accounts: many(account),
}));

export const lessonsRelations = relations(lessons, ({one}) => ({
	unit: one(units, {
		fields: [lessons.unitId],
		references: [units.id]
	}),
}));

export const unitsRelations = relations(units, ({one, many}) => ({
	lessons: many(lessons),
	course: one(courses, {
		fields: [units.courseId],
		references: [courses.id]
	}),
}));

export const coursesRelations = relations(courses, ({many}) => ({
	units: many(units),
}));

export const studyGroupScheduleLessonsRelations = relations(studyGroupScheduleLessons, ({one}) => ({
	studyGroupSchedule: one(studyGroupSchedule, {
		fields: [studyGroupScheduleLessons.scheduleId],
		references: [studyGroupSchedule.id]
	}),
}));

export const studyGroupScheduleRelations = relations(studyGroupSchedule, ({many}) => ({
	studyGroupScheduleLessons: many(studyGroupScheduleLessons),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));