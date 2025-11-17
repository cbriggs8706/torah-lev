import * as z from 'zod'

export const hebrewVocabSchema = z.object({
	id: z.string().uuid().optional(),
	heb: z.string().min(1, 'Required'),
	hebNiqqud: z.string().min(1, 'Required'),
	eng: z.string().min(1, 'Required'),
	engDefinition: z.string().optional(),
	person: z.number().int().min(1).max(3).optional(),
	gender: z.string().optional(),
	number: z.string().optional(),
	partOfSpeech: z.array(z.string()).default([]).catch([]),

	ipa: z.string().optional(),
	engTransliteration: z.string().optional(),
	dictionaryUrl: z.string().url().optional().or(z.literal('')),
	images: z.array(z.string()).optional(),
	hebAudio: z.string().optional(),
	synonyms: z.array(z.number()).optional(),
	antonyms: z.array(z.number()).optional(),
	strongsNumber: z.string().optional(),
	category: z.string().optional(),
	video: z.string().optional(),
})

export type HebrewVocabFormValues = z.infer<typeof hebrewVocabSchema>
