import { z } from 'zod'

export const organizationSchema = z.object({
	title: z.string().trim().min(1, 'Title is required'),
})

export const targetLanguageSchema = z.object({
	name: z.string().trim().min(1, 'Name is required'),
})

export const courseSchema = z.object({
	title: z.string().trim().min(1, 'Title is required'),
	lessonIds: z.array(z.string().uuid()).optional(),
})

export const lessonSchema = z.object({
	title: z.string().trim().min(1, 'Title is required'),
	number: z.coerce.number().int().min(0, 'Number must be 0 or greater'),
	part: z.string().trim().default(''),
	organizationId: z.string().uuid().nullable().optional(),
	targetLanguageId: z.string().uuid('Target language is required'),
	moduleIds: z.array(z.string().uuid()).default([]),
})

export const studyGroupSchema = z
	.object({
		title: z.string().trim().min(1, 'Title is required'),
		activeCourseId: z.string().uuid().nullable().optional(),
		courseIds: z.array(z.string().uuid()).default([]),
	})
	.superRefine((data, ctx) => {
		if (
			data.activeCourseId &&
			!data.courseIds.includes(data.activeCourseId)
		) {
			ctx.addIssue({
				code: 'custom',
				message: 'Active course must also be assigned to the study group',
				path: ['activeCourseId'],
			})
		}
	})

export const quizTypeValues = [
	'image_to_audio',
	'audio_to_image',
	'text_to_audio',
	'audio_to_text',
	'text_to_image',
	'image_to_text',
] as const

export const moduleTypeValues = ['video', 'audio', 'document', 'quiz'] as const

const answerSchema = z.object({
	id: z.string().uuid().optional(),
	answerText: z.string().trim().nullable().optional(),
	answerAssetId: z.string().uuid().nullable().optional(),
	isCorrect: z.boolean(),
	sortOrder: z.coerce.number().int().min(0),
})

export const quizQuestionSchema = z
	.object({
		title: z.string().trim().min(1, 'Title is required'),
		type: z.enum(quizTypeValues),
		promptText: z.string().trim().nullable().optional(),
		promptAssetId: z.string().uuid().nullable().optional(),
		answers: z
			.array(answerSchema)
			.min(2, 'At least 2 answers are required')
			.max(6, 'No more than 6 answers are allowed'),
	})
	.superRefine((data, ctx) => {
		const promptNeedsText = data.type.startsWith('text_')
		const answerNeedsText = data.type.endsWith('_text')

		if (promptNeedsText) {
			if (!data.promptText?.trim()) {
				ctx.addIssue({
					code: 'custom',
					message: 'Prompt text is required for this quiz type',
					path: ['promptText'],
				})
			}
			if (data.promptAssetId) {
				ctx.addIssue({
					code: 'custom',
					message: 'Prompt asset must be empty for this quiz type',
					path: ['promptAssetId'],
				})
			}
		} else {
			if (!data.promptAssetId) {
				ctx.addIssue({
					code: 'custom',
					message: 'Prompt media is required for this quiz type',
					path: ['promptAssetId'],
				})
			}
			if (data.promptText?.trim()) {
				ctx.addIssue({
					code: 'custom',
					message: 'Prompt text must be empty for this quiz type',
					path: ['promptText'],
				})
			}
		}

		const correctCount = data.answers.filter((answer) => answer.isCorrect).length
		if (correctCount !== 1) {
			ctx.addIssue({
				code: 'custom',
				message: 'Exactly one answer must be marked correct',
				path: ['answers'],
			})
		}

		data.answers.forEach((answer, index) => {
			if (answerNeedsText) {
				if (!answer.answerText?.trim()) {
					ctx.addIssue({
						code: 'custom',
						message: 'Text answer required for this quiz type',
						path: ['answers', index, 'answerText'],
					})
				}
				if (answer.answerAssetId) {
					ctx.addIssue({
						code: 'custom',
						message: 'Media answer must be empty for this quiz type',
						path: ['answers', index, 'answerAssetId'],
					})
				}
			} else {
				if (!answer.answerAssetId) {
					ctx.addIssue({
						code: 'custom',
						message: 'Media answer required for this quiz type',
						path: ['answers', index, 'answerAssetId'],
					})
				}
				if (answer.answerText?.trim()) {
					ctx.addIssue({
						code: 'custom',
						message: 'Text answer must be empty for this quiz type',
						path: ['answers', index, 'answerText'],
					})
				}
			}
		})
	})

export const quizSchema = z.object({
	title: z.string().trim().min(1, 'Title is required'),
	questionIds: z.array(z.string().uuid()).default([]),
})

export const moduleSchema = z
	.object({
		title: z.string().trim().min(1, 'Title is required'),
		type: z.enum(moduleTypeValues),
		mediaAssetId: z.string().uuid().nullable().optional(),
		externalUrl: z.string().trim().url().nullable().optional(),
		quizId: z.string().uuid().nullable().optional(),
		lessonIds: z.array(z.string().uuid()).optional(),
	})
	.superRefine((data, ctx) => {
		if (data.type === 'quiz') {
			if (!data.quizId) {
				ctx.addIssue({
					code: 'custom',
					message: 'Quiz is required for quiz modules',
					path: ['quizId'],
				})
			}
			if (data.mediaAssetId) {
				ctx.addIssue({
					code: 'custom',
					message: 'Quiz modules cannot have media assets',
					path: ['mediaAssetId'],
				})
			}
			if (data.externalUrl?.trim()) {
				ctx.addIssue({
					code: 'custom',
					message: 'Quiz modules cannot have external URLs',
					path: ['externalUrl'],
				})
			}
			return
		}

		if (data.quizId) {
			ctx.addIssue({
				code: 'custom',
				message: 'Only quiz modules can reference a quiz',
				path: ['quizId'],
			})
		}

		if (data.type === 'video') {
			if (!data.mediaAssetId && !data.externalUrl?.trim()) {
				ctx.addIssue({
					code: 'custom',
					message: 'Video modules need a media asset or external URL',
					path: ['mediaAssetId'],
				})
			}
		} else {
			if (!data.mediaAssetId) {
				ctx.addIssue({
					code: 'custom',
					message: 'This module type requires a media asset',
					path: ['mediaAssetId'],
				})
			}
			if (data.externalUrl?.trim()) {
				ctx.addIssue({
					code: 'custom',
					message: 'Only video modules can use external URLs',
					path: ['externalUrl'],
				})
			}
		}
	})

export type OrganizationInput = z.infer<typeof organizationSchema>
export type TargetLanguageInput = z.infer<typeof targetLanguageSchema>
export type CourseInput = z.infer<typeof courseSchema>
export type LessonInput = z.infer<typeof lessonSchema>
export type StudyGroupInput = z.infer<typeof studyGroupSchema>
export type QuizInput = z.infer<typeof quizSchema>
export type QuizQuestionInput = z.infer<typeof quizQuestionSchema>
export type ModuleInput = z.infer<typeof moduleSchema>
