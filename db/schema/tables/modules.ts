import {
	boolean,
	index,
	integer,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uuid,
} from 'drizzle-orm/pg-core'
import { mediaAssets } from './media_assets'
import { lessons } from './lessons'
import { moduleType, quizType } from '../enums'

export const quizzes = pgTable(
	'quizzes',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		title: text('title').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [index('quizzes_title_idx').on(table.title)]
)

export const quizQuestions = pgTable(
	'quiz_questions',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		title: text('title').notNull(),
		type: quizType('type').notNull(),
		promptText: text('prompt_text'),
		promptAssetId: uuid('prompt_asset_id').references(() => mediaAssets.id, {
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
		index('quiz_questions_title_idx').on(table.title),
		index('quiz_questions_type_idx').on(table.type),
		index('quiz_questions_prompt_asset_idx').on(table.promptAssetId),
	]
)

export const quizQuestionAnswers = pgTable(
	'quiz_question_answers',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		questionId: uuid('question_id')
			.notNull()
			.references(() => quizQuestions.id, { onDelete: 'cascade' }),
		answerText: text('answer_text'),
		answerAssetId: uuid('answer_asset_id').references(() => mediaAssets.id, {
			onDelete: 'set null',
		}),
		isCorrect: boolean('is_correct').notNull().default(false),
		sortOrder: integer('sort_order').notNull().default(0),
		createdAt: timestamp('created_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index('quiz_question_answers_question_idx').on(table.questionId),
		index('quiz_question_answers_asset_idx').on(table.answerAssetId),
	]
)

export const quizQuestionAssignments = pgTable(
	'quiz_question_assignments',
	{
		quizId: uuid('quiz_id')
			.notNull()
			.references(() => quizzes.id, { onDelete: 'cascade' }),
		questionId: uuid('question_id')
			.notNull()
			.references(() => quizQuestions.id, { onDelete: 'cascade' }),
		sortOrder: integer('sort_order').notNull().default(0),
		createdAt: timestamp('created_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		primaryKey({ columns: [table.quizId, table.questionId] }),
		index('quiz_question_assignments_question_idx').on(table.questionId),
	]
)

export const modules = pgTable(
	'modules',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		title: text('title').notNull(),
		type: moduleType('type').notNull(),
		mediaAssetId: uuid('media_asset_id').references(() => mediaAssets.id, {
			onDelete: 'set null',
		}),
		externalUrl: text('external_url'),
		quizId: uuid('quiz_id').references(() => quizzes.id, {
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
		index('modules_title_idx').on(table.title),
		index('modules_type_idx').on(table.type),
		index('modules_media_asset_idx').on(table.mediaAssetId),
		index('modules_quiz_idx').on(table.quizId),
	]
)

export const lessonModules = pgTable(
	'lesson_modules',
	{
		lessonId: uuid('lesson_id')
			.notNull()
			.references(() => lessons.id, { onDelete: 'cascade' }),
		moduleId: uuid('module_id')
			.notNull()
			.references(() => modules.id, { onDelete: 'cascade' }),
		sortOrder: integer('sort_order').notNull().default(0),
		createdAt: timestamp('created_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		primaryKey({ columns: [table.lessonId, table.moduleId] }),
		index('lesson_modules_module_idx').on(table.moduleId),
	]
)
