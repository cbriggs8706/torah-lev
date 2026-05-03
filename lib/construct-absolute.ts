import {
	ConstructAbsoluteWord,
	getLessonNumberSortValue,
} from '@/lib/data/hebrew/construct-absolute'

type ConstructAbsoluteAdminBase = {
	id: number
	lessonId: number | null
	lessonNumber: string | null
	lessonTitle: string | null
	absolute: string
	construct: string
	lessonLabel?: string | null
	payload?: unknown
	createdAt?: Date
	updatedAt?: Date
}

export function toConstructAbsoluteAdminRecord(
	record: ConstructAbsoluteAdminBase
) {
	const lessonNumber = record.lessonNumber ?? ''
	const lessonTitle = record.lessonTitle ?? ''

	return {
		...record,
		lessonNumber,
		lessonTitle,
		lessonLabel:
			record.lessonLabel ??
			(lessonTitle
				? `${lessonNumber || 'No #'} - ${lessonTitle}`
				: lessonNumber || 'No lesson'),
		lessonSort: `${record.lessonLabel ?? lessonTitle}:${getLessonNumberSortValue(
			lessonNumber
		)}`,
	}
}

export function toConstructAbsoluteActivityWord(
	record: ConstructAbsoluteAdminBase
): ConstructAbsoluteWord {
	return {
		id: record.id,
		lessonId: record.lessonId,
		lessonNumber: record.lessonNumber ?? '',
		lessonTitle: record.lessonTitle ?? '',
		absolute: record.absolute,
		construct: record.construct,
	}
}
