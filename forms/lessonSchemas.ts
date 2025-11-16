// forms/lessonSchemas.ts
import * as z from 'zod'

export const basicLessonSchema = z.object({
	id: z.string().uuid().optional(),
	slug: z.string().min(1),
	lessonNumber: z.string().min(1),
	description: z.string().optional(),
	video: z.string().optional(),
	secondaryVideo: z.string().optional(),
	lessonScript: z.string().optional(),
	grammarLesson: z.string().optional(),
	image: z.string().optional(),
})

export const lessonFormSchema = basicLessonSchema.extend({
	unitId: z.string().uuid(),
	vocabIds: z.array(z.string().uuid()).default([]),
})

export type LessonFormValues = z.infer<typeof lessonFormSchema>
type LessonWithId = LessonFormValues & { id: string }
