import { relations } from 'drizzle-orm'
import { mediaAssets } from '../tables/media_assets'
import { lessons } from '../tables/lessons'
import {
	lessonModules,
	modules,
	quizQuestionAnswers,
	quizQuestionAssignments,
	quizQuestions,
	quizzes,
} from '../tables/modules'

export const quizRelations = relations(quizzes, ({ many }) => ({
	questionAssignments: many(quizQuestionAssignments),
	modules: many(modules),
}))

export const quizQuestionRelations = relations(quizQuestions, ({ one, many }) => ({
	promptAsset: one(mediaAssets, {
		fields: [quizQuestions.promptAssetId],
		references: [mediaAssets.id],
	}),
	answers: many(quizQuestionAnswers),
	quizAssignments: many(quizQuestionAssignments),
}))

export const quizQuestionAnswerRelations = relations(
	quizQuestionAnswers,
	({ one }) => ({
		question: one(quizQuestions, {
			fields: [quizQuestionAnswers.questionId],
			references: [quizQuestions.id],
		}),
		answerAsset: one(mediaAssets, {
			fields: [quizQuestionAnswers.answerAssetId],
			references: [mediaAssets.id],
		}),
	})
)

export const quizQuestionAssignmentRelations = relations(
	quizQuestionAssignments,
	({ one }) => ({
		quiz: one(quizzes, {
			fields: [quizQuestionAssignments.quizId],
			references: [quizzes.id],
		}),
		question: one(quizQuestions, {
			fields: [quizQuestionAssignments.questionId],
			references: [quizQuestions.id],
		}),
	})
)

export const moduleRelations = relations(modules, ({ one, many }) => ({
	mediaAsset: one(mediaAssets, {
		fields: [modules.mediaAssetId],
		references: [mediaAssets.id],
	}),
	quiz: one(quizzes, {
		fields: [modules.quizId],
		references: [quizzes.id],
	}),
	lessonAssignments: many(lessonModules),
}))

export const lessonModuleRelations = relations(lessonModules, ({ one }) => ({
	lesson: one(lessons, {
		fields: [lessonModules.lessonId],
		references: [lessons.id],
	}),
	module: one(modules, {
		fields: [lessonModules.moduleId],
		references: [modules.id],
	}),
}))
