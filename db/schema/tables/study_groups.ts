import {
	index,
	integer,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uuid,
} from 'drizzle-orm/pg-core'
import { user } from './auth'
import { courses } from './courses'

export const studyGroups = pgTable(
	'study_groups',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		title: text('title').notNull(),
		activeCourseId: uuid('active_course_id').references(() => courses.id, {
			onDelete: 'set null',
		}),
		createdAt: timestamp('created_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index('study_groups_title_idx').on(table.title),
		index('study_groups_active_course_idx').on(table.activeCourseId),
	]
)

export const studyGroupCourses = pgTable(
	'study_group_courses',
	{
		studyGroupId: uuid('study_group_id')
			.notNull()
			.references(() => studyGroups.id, { onDelete: 'cascade' }),
		courseId: uuid('course_id')
			.notNull()
			.references(() => courses.id, { onDelete: 'cascade' }),
		sortOrder: integer('sort_order').notNull().default(0),
		createdAt: timestamp('created_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		primaryKey({ columns: [table.studyGroupId, table.courseId] }),
		index('study_group_courses_course_idx').on(table.courseId),
	]
)

export const studyGroupMemberships = pgTable(
	'study_group_memberships',
	{
		studyGroupId: uuid('study_group_id')
			.notNull()
			.references(() => studyGroups.id, { onDelete: 'cascade' }),
		userId: uuid('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		role: text('role').notNull().default('student'),
		createdAt: timestamp('created_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		primaryKey({ columns: [table.studyGroupId, table.userId] }),
		index('study_group_memberships_user_idx').on(table.userId),
	]
)
