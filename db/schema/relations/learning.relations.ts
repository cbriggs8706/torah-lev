import { relations } from 'drizzle-orm'
import { courseLessons, courses } from '../tables/courses'
import { lessonModuleCompletions } from '../tables/learning_progress'
import { lessons } from '../tables/lessons'
import { lessonModules, modules } from '../tables/modules'
import { organizations } from '../tables/organizations'
import { user } from '../tables/auth'
import {
	studyGroupCourses,
	studyGroupMemberships,
	studyGroups,
} from '../tables/study_groups'
import { targetLanguages } from '../tables/target_languages'

export const organizationRelations = relations(organizations, ({ many }) => ({
	lessons: many(lessons),
}))

export const targetLanguageRelations = relations(
	targetLanguages,
	({ many }) => ({
		lessons: many(lessons),
	})
)

export const courseRelations = relations(courses, ({ many }) => ({
	courseLessons: many(courseLessons),
	studyGroupCourses: many(studyGroupCourses),
}))

export const lessonRelations = relations(lessons, ({ one, many }) => ({
	organization: one(organizations, {
		fields: [lessons.organizationId],
		references: [organizations.id],
	}),
	targetLanguage: one(targetLanguages, {
		fields: [lessons.targetLanguageId],
		references: [targetLanguages.id],
	}),
	moduleAssignments: many(lessonModules),
	courseLessons: many(courseLessons),
	moduleCompletions: many(lessonModuleCompletions),
}))

export const courseLessonRelations = relations(courseLessons, ({ one }) => ({
	course: one(courses, {
		fields: [courseLessons.courseId],
		references: [courses.id],
	}),
	lesson: one(lessons, {
		fields: [courseLessons.lessonId],
		references: [lessons.id],
	}),
}))

export const studyGroupRelations = relations(studyGroups, ({ one, many }) => ({
	activeCourse: one(courses, {
		fields: [studyGroups.activeCourseId],
		references: [courses.id],
	}),
	studyGroupCourses: many(studyGroupCourses),
	memberships: many(studyGroupMemberships),
	moduleCompletions: many(lessonModuleCompletions),
}))

export const studyGroupCourseRelations = relations(
	studyGroupCourses,
	({ one }) => ({
		studyGroup: one(studyGroups, {
			fields: [studyGroupCourses.studyGroupId],
			references: [studyGroups.id],
		}),
		course: one(courses, {
			fields: [studyGroupCourses.courseId],
			references: [courses.id],
		}),
	})
)

export const studyGroupMembershipRelations = relations(
	studyGroupMemberships,
	({ one }) => ({
		studyGroup: one(studyGroups, {
			fields: [studyGroupMemberships.studyGroupId],
			references: [studyGroups.id],
		}),
		user: one(user, {
			fields: [studyGroupMemberships.userId],
			references: [user.id],
		}),
	})
)

export const lessonModuleCompletionRelations = relations(
	lessonModuleCompletions,
	({ one }) => ({
		user: one(user, {
			fields: [lessonModuleCompletions.userId],
			references: [user.id],
		}),
		studyGroup: one(studyGroups, {
			fields: [lessonModuleCompletions.studyGroupId],
			references: [studyGroups.id],
		}),
		lesson: one(lessons, {
			fields: [lessonModuleCompletions.lessonId],
			references: [lessons.id],
		}),
		module: one(modules, {
			fields: [lessonModuleCompletions.moduleId],
			references: [modules.id],
		}),
	})
)
