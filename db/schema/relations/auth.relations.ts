// src/db/schema/relations/auth.relations.ts
import { relations } from 'drizzle-orm'
import { account, session, user } from '../tables/auth'
import { gameResults } from '../tables/gameResults'
import { messages } from '../tables/messages'
import { courseEnrollments, courses } from '../tables/courses'
import {
	assignmentCompletions,
	attendanceRecords,
	courseMemberships,
	courseOccurrences,
	courseThreads,
	occurrenceAssignments,
	threadMembers,
	threadMessages,
} from '../tables/course_collaboration'

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
	gameResults: many(gameResults),
	messages: many(messages),
	organizedCourses: many(courses),
	enrollments: many(courseEnrollments),
	courseMemberships: many(courseMemberships),
	createdOccurrences: many(courseOccurrences, {
		relationName: 'occurrence_creator',
	}),
	createdAssignments: many(occurrenceAssignments, {
		relationName: 'assignment_creator',
	}),
	assignmentCompletions: many(assignmentCompletions),
	attendanceRecords: many(attendanceRecords),
	markedAttendanceRecords: many(attendanceRecords, {
		relationName: 'attendance_marker',
	}),
	createdThreads: many(courseThreads, { relationName: 'thread_creator' }),
	threadMemberships: many(threadMembers),
	threadMessages: many(threadMessages),
	invitedMemberships: many(courseMemberships, {
		relationName: 'membership_inviter',
	}),
}))

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}))

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}))
