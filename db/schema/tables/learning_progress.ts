import {
	index,
	integer,
	pgTable,
	primaryKey,
	timestamp,
	uuid,
} from 'drizzle-orm/pg-core'
import { user } from './auth'
import { lessons } from './lessons'
import { modules } from './modules'
import { studyGroups } from './study_groups'

export const lessonModuleCompletions = pgTable(
	'lesson_module_completions',
	{
		userId: uuid('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		studyGroupId: uuid('study_group_id')
			.notNull()
			.references(() => studyGroups.id, { onDelete: 'cascade' }),
		lessonId: uuid('lesson_id')
			.notNull()
			.references(() => lessons.id, { onDelete: 'cascade' }),
		moduleId: uuid('module_id')
			.notNull()
			.references(() => modules.id, { onDelete: 'cascade' }),
		completedAt: timestamp('completed_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		primaryKey({
			columns: [
				table.userId,
				table.studyGroupId,
				table.lessonId,
				table.moduleId,
			],
		}),
		index('lesson_module_completions_study_group_idx').on(table.studyGroupId),
		index('lesson_module_completions_lesson_idx').on(table.lessonId),
		index('lesson_module_completions_module_idx').on(table.moduleId),
	]
)

export const userLearningStats = pgTable('user_learning_stats', {
	userId: uuid('user_id')
		.primaryKey()
		.references(() => user.id, { onDelete: 'cascade' }),
	hearts: integer('hearts').notNull().default(5),
	points: integer('points').notNull().default(0),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
})

export const lessonRewardClaims = pgTable(
	'lesson_reward_claims',
	{
		userId: uuid('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		studyGroupId: uuid('study_group_id')
			.notNull()
			.references(() => studyGroups.id, { onDelete: 'cascade' }),
		lessonId: uuid('lesson_id')
			.notNull()
			.references(() => lessons.id, { onDelete: 'cascade' }),
		heartsAwarded: integer('hearts_awarded').notNull(),
		pointsAwarded: integer('points_awarded').notNull(),
		claimedAt: timestamp('claimed_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.userId, table.studyGroupId, table.lessonId],
		}),
		index('lesson_reward_claims_study_group_idx').on(table.studyGroupId),
		index('lesson_reward_claims_lesson_idx').on(table.lessonId),
	]
)
