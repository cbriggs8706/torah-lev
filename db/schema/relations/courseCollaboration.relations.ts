import { relations } from 'drizzle-orm'
import { user } from '../tables/auth'
import { courses } from '../tables/courses'
import { lessons } from '../tables/lessons'
import { units } from '../tables/units'
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

export const courseMembershipsRelations = relations(
	courseMemberships,
	({ one }) => ({
		course: one(courses, {
			fields: [courseMemberships.courseId],
			references: [courses.id],
		}),
		user: one(user, {
			fields: [courseMemberships.userId],
			references: [user.id],
		}),
		inviter: one(user, {
			fields: [courseMemberships.invitedBy],
			references: [user.id],
			relationName: 'membership_inviter',
		}),
	})
)

export const courseOccurrencesRelations = relations(
	courseOccurrences,
	({ one, many }) => ({
		course: one(courses, {
			fields: [courseOccurrences.courseId],
			references: [courses.id],
		}),
		creator: one(user, {
			fields: [courseOccurrences.createdBy],
			references: [user.id],
			relationName: 'occurrence_creator',
		}),
		assignments: many(occurrenceAssignments),
		attendanceRecords: many(attendanceRecords),
	})
)

export const occurrenceAssignmentsRelations = relations(
	occurrenceAssignments,
	({ one, many }) => ({
		course: one(courses, {
			fields: [occurrenceAssignments.courseId],
			references: [courses.id],
		}),
		occurrence: one(courseOccurrences, {
			fields: [occurrenceAssignments.occurrenceId],
			references: [courseOccurrences.id],
		}),
		unit: one(units, {
			fields: [occurrenceAssignments.unitId],
			references: [units.id],
		}),
		lesson: one(lessons, {
			fields: [occurrenceAssignments.lessonId],
			references: [lessons.id],
		}),
		creator: one(user, {
			fields: [occurrenceAssignments.createdBy],
			references: [user.id],
			relationName: 'assignment_creator',
		}),
		completions: many(assignmentCompletions),
	})
)

export const assignmentCompletionsRelations = relations(
	assignmentCompletions,
	({ one }) => ({
		assignment: one(occurrenceAssignments, {
			fields: [assignmentCompletions.assignmentId],
			references: [occurrenceAssignments.id],
		}),
		user: one(user, {
			fields: [assignmentCompletions.userId],
			references: [user.id],
		}),
	})
)

export const attendanceRecordsRelations = relations(
	attendanceRecords,
	({ one }) => ({
		occurrence: one(courseOccurrences, {
			fields: [attendanceRecords.occurrenceId],
			references: [courseOccurrences.id],
		}),
		user: one(user, {
			fields: [attendanceRecords.userId],
			references: [user.id],
		}),
		marker: one(user, {
			fields: [attendanceRecords.markedBy],
			references: [user.id],
			relationName: 'attendance_marker',
		}),
	})
)

export const courseThreadsRelations = relations(courseThreads, ({ one, many }) => ({
	course: one(courses, {
		fields: [courseThreads.courseId],
		references: [courses.id],
	}),
	creator: one(user, {
		fields: [courseThreads.createdBy],
		references: [user.id],
		relationName: 'thread_creator',
	}),
	members: many(threadMembers),
	messages: many(threadMessages),
}))

export const threadMembersRelations = relations(threadMembers, ({ one }) => ({
	thread: one(courseThreads, {
		fields: [threadMembers.threadId],
		references: [courseThreads.id],
	}),
	user: one(user, {
		fields: [threadMembers.userId],
		references: [user.id],
	}),
}))

export const threadMessagesRelations = relations(threadMessages, ({ one }) => ({
	thread: one(courseThreads, {
		fields: [threadMessages.threadId],
		references: [courseThreads.id],
	}),
	sender: one(user, {
		fields: [threadMessages.senderId],
		references: [user.id],
	}),
}))
