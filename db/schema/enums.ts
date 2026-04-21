// db/schema/enums.ts
import { pgEnum } from 'drizzle-orm/pg-core'

export const language = pgEnum('language', [
	'BIBLICAL-HEBREW',
	'BIBLICAL-GREEK',
	'MODERN-HEBREW',
	'MODERN-ENGLISH',
	'MODERN-SPANISH',
])
export const groupType = pgEnum('group_type', ['GROUP', 'SUBGROUP', 'TRIBE'])
export const bookType = pgEnum('book_type', [
	'SCRIPTURE',
	'STORY',
	'LESSON-SCRIPT',
	'SONG',
	'PRAYER',
])
export const proficiencyLevel = pgEnum('proficiency_level', [
	'A1',
	'A2',
	'B1',
	'B2',
	'C1',
	'C2',
])
export const type = pgEnum('type', [
	'SELECT',
	'ASSIST',
	'HEAR',
	'WATCH',
	'PLAY',
	'AUDIO-VISUAL',
	'AUDIO-TEXT',
	'VISUAL-AUDIO',
	'VISUAL-TEXT',
	'TEXT-AUDIO',
	'TEXT-VISUAL',
])

export const mediaKind = pgEnum('media_kind', [
	'image',
	'audio',
	'video',
	'document',
	'other',
])

export const moduleType = pgEnum('module_type', [
	'video',
	'audio',
	'document',
	'quiz',
])

export const quizType = pgEnum('quiz_type', [
	'image_to_audio',
	'audio_to_image',
	'text_to_audio',
	'audio_to_text',
	'text_to_image',
	'image_to_text',
])
