import { relations } from 'drizzle-orm'
import { courses } from '../tables/courses'
import { lessons } from '../tables/lessons'
import { lessonModules } from '../tables/modules'
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
	lessons: many(lessons),
	studyGroupCourses: many(studyGroupCourses),
}))

export const lessonRelations = relations(lessons, ({ one, many }) => ({
	course: one(courses, {
		fields: [lessons.courseId],
		references: [courses.id],
	}),
	organization: one(organizations, {
		fields: [lessons.organizationId],
		references: [organizations.id],
	}),
	targetLanguage: one(targetLanguages, {
		fields: [lessons.targetLanguageId],
		references: [targetLanguages.id],
	}),
	moduleAssignments: many(lessonModules),
}))

export const studyGroupRelations = relations(studyGroups, ({ one, many }) => ({
	activeCourse: one(courses, {
		fields: [studyGroups.activeCourseId],
		references: [courses.id],
	}),
	studyGroupCourses: many(studyGroupCourses),
	memberships: many(studyGroupMemberships),
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
