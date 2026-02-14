import {
	boolean,
	index,
	integer,
	jsonb,
	primaryKey,
	pgTable,
	text,
	timestamp,
	uuid,
} from 'drizzle-orm/pg-core'
import {
	assignmentSourceType,
	attendanceStatus,
	courseMemberRole,
	threadMemberRole,
	threadType,
} from '../enums'
import { courses } from './courses'
import { lessons } from './lessons'
import { units } from './units'
import { user } from './auth'

export const courseMemberships = pgTable(
	'course_memberships',
	{
		courseId: uuid('course_id')
			.notNull()
			.references(() => courses.id, { onDelete: 'cascade' }),
		userId: uuid('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		role: courseMemberRole('role').notNull().default('student'),
		joinedAt: timestamp('joined_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
		invitedBy: uuid('invited_by').references(() => user.id, {
			onDelete: 'set null',
		}),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.courseId, table.userId] }),
		courseRoleIdx: index('course_memberships_course_role_idx').on(
			table.courseId,
			table.role
		),
		userIdx: index('course_memberships_user_idx').on(table.userId),
	})
)

export const courseOccurrences = pgTable(
	'course_occurrences',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		courseId: uuid('course_id')
			.notNull()
			.references(() => courses.id, { onDelete: 'cascade' }),
		startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
		endsAt: timestamp('ends_at', { withTimezone: true }),
		timezone: text('timezone').notNull().default('America/Denver'),
		title: text('title'),
		notes: text('notes'),
		isCanceled: boolean('is_canceled').notNull().default(false),
		attendanceEnabled: boolean('attendance_enabled').notNull().default(false),
		createdBy: uuid('created_by').references(() => user.id, {
			onDelete: 'set null',
		}),
		createdAt: timestamp('created_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		courseStartIdx: index('course_occurrences_course_start_idx').on(
			table.courseId,
			table.startsAt
		),
	})
)

export const occurrenceAssignments = pgTable(
	'occurrence_assignments',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		courseId: uuid('course_id')
			.notNull()
			.references(() => courses.id, { onDelete: 'cascade' }),
		occurrenceId: uuid('occurrence_id')
			.notNull()
			.references(() => courseOccurrences.id, { onDelete: 'cascade' }),
		sourceType: assignmentSourceType('source_type').notNull().default('custom'),
		unitId: uuid('unit_id').references(() => units.id, { onDelete: 'set null' }),
		lessonId: uuid('lesson_id').references(() => lessons.id, {
			onDelete: 'set null',
		}),
		chapterRef: text('chapter_ref'),
		title: text('title').notNull(),
		contentHtml: text('content_html'),
		contentText: text('content_text'),
		attachments: jsonb('attachments').notNull().default([]),
		orderIndex: integer('order_index').notNull().default(0),
		createdBy: uuid('created_by').references(() => user.id, {
			onDelete: 'set null',
		}),
		createdAt: timestamp('created_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		occurrenceOrderIdx: index('occurrence_assignments_occurrence_order_idx').on(
			table.occurrenceId,
			table.orderIndex
		),
		courseIdx: index('occurrence_assignments_course_idx').on(table.courseId),
	})
)

export const assignmentCompletions = pgTable(
	'assignment_completions',
	{
		assignmentId: uuid('assignment_id')
			.notNull()
			.references(() => occurrenceAssignments.id, { onDelete: 'cascade' }),
		userId: uuid('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		completedAt: timestamp('completed_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.assignmentId, table.userId] }),
		userIdx: index('assignment_completions_user_idx').on(table.userId),
	})
)

export const attendanceRecords = pgTable(
	'attendance_records',
	{
		occurrenceId: uuid('occurrence_id')
			.notNull()
			.references(() => courseOccurrences.id, { onDelete: 'cascade' }),
		userId: uuid('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		status: attendanceStatus('status').notNull(),
		notes: text('notes'),
		markedBy: uuid('marked_by').references(() => user.id, {
			onDelete: 'set null',
		}),
		markedAt: timestamp('marked_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.occurrenceId, table.userId] }),
		userIdx: index('attendance_records_user_idx').on(table.userId),
	})
)

export const courseThreads = pgTable(
	'course_threads',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		courseId: uuid('course_id')
			.notNull()
			.references(() => courses.id, { onDelete: 'cascade' }),
		type: threadType('type').notNull().default('course'),
		name: text('name'),
		isArchived: boolean('is_archived').notNull().default(false),
		createdBy: uuid('created_by').references(() => user.id, {
			onDelete: 'set null',
		}),
		createdAt: timestamp('created_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		courseTypeIdx: index('course_threads_course_type_idx').on(
			table.courseId,
			table.type
		),
	})
)

export const threadMembers = pgTable(
	'thread_members',
	{
		threadId: uuid('thread_id')
			.notNull()
			.references(() => courseThreads.id, { onDelete: 'cascade' }),
		userId: uuid('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		role: threadMemberRole('role').notNull().default('member'),
		joinedAt: timestamp('joined_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
		lastReadAt: timestamp('last_read_at', { withTimezone: true }),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.threadId, table.userId] }),
		userIdx: index('thread_members_user_idx').on(table.userId),
	})
)

export const threadMessages = pgTable(
	'thread_messages',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		threadId: uuid('thread_id')
			.notNull()
			.references(() => courseThreads.id, { onDelete: 'cascade' }),
		senderId: uuid('sender_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		contentHtml: text('content_html').notNull(),
		contentText: text('content_text'),
		attachments: jsonb('attachments').notNull().default([]),
		createdAt: timestamp('created_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }),
		deletedAt: timestamp('deleted_at', { withTimezone: true }),
	},
	(table) => ({
		threadCreatedIdx: index('thread_messages_thread_created_idx').on(
			table.threadId,
			table.createdAt
		),
		senderIdx: index('thread_messages_sender_idx').on(table.senderId),
	})
)
