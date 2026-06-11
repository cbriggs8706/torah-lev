import 'server-only'

import { and, asc, eq, inArray, sql } from 'drizzle-orm'

import db from '@/db/drizzle'
import { lessons, videos } from '@/db/schema'
import { splitCategoryValues } from '@/lib/category'
import { getHebrewVocabByCourseId } from '@/lib/server/vocab'

function parseLessonKey(key: string) {
	if (typeof key !== 'string') return { num: Number.NaN, text: '' }

	const match = key.match(/^(\d+)([a-zA-Z]*)$/)
	if (!match) return { num: Number.NaN, text: key }

	return {
		num: Number.parseInt(match[1], 10),
		text: match[2] || '',
	}
}

function sortLessonValues(values: string[]) {
	return [...values].sort((a, b) => {
		const A = parseLessonKey(a)
		const B = parseLessonKey(b)
		if (!Number.isNaN(A.num) && !Number.isNaN(B.num)) {
			if (A.num !== B.num) return A.num - B.num
			return A.text.localeCompare(B.text)
		}
		if (!Number.isNaN(A.num) && Number.isNaN(B.num)) return -1
		if (Number.isNaN(A.num) && !Number.isNaN(B.num)) return 1
		return a.localeCompare(b)
	})
}

export async function getPublicCourseActivityFilterOptions(courseId: number) {
	const data = await getHebrewVocabByCourseId(courseId)
	const lessonOptions = sortLessonValues(
		Array.from(
			new Set(data.flatMap((item) => item.lessons.map((lesson) => String(lesson))))
		)
	)
	const categoryOptions = Array.from(
		new Set(
			data
				.flatMap((item) => splitCategoryValues(item.category))
				.filter((value): value is string => Boolean(value))
		)
	).sort()

	return {
		lessonOptions,
		categoryOptions,
		typeOptions: ['all', 'word', 'phrase', 'stack'] as const,
		formatOptions: ['image', 'audio', 'translation', 'letter-by-letter'] as const,
		hebrewFieldOptions: ['heb', 'hebNiqqud'] as const,
	}
}

export async function getHebrewLessonVideoIdsByLessonIds(lessonIds: number[]) {
	const byLessonId = new Map<
		number,
		{
			lessonScriptId: number | null
			lessonScriptPartBId: number | null
			lessonScriptReviewId: number | null
		}
	>()

	if (lessonIds.length === 0) return byLessonId

	const directRows = await db
		.select({
			id: videos.id,
			lessonId: videos.lessonId,
			part: videos.part,
		})
		.from(videos)
		.where(
			and(
				sql`${videos.type} IS DISTINCT FROM 'story'::video_type`,
				inArray(videos.lessonId, lessonIds)
			)
		)
		.orderBy(asc(videos.lessonId), asc(videos.part), asc(videos.id))

	for (const row of directRows) {
		if (row.lessonId == null) continue

		const existing = byLessonId.get(row.lessonId) ?? {
			lessonScriptId: null,
			lessonScriptPartBId: null,
			lessonScriptReviewId: null,
		}

		if (existing.lessonScriptId == null) {
			existing.lessonScriptId = row.id
		}

		if (
			row.part === 2 &&
			existing.lessonScriptPartBId == null &&
			existing.lessonScriptId !== row.id
		) {
			existing.lessonScriptPartBId = row.id
		}

		if (
			row.part === 3 &&
			existing.lessonScriptReviewId == null &&
			existing.lessonScriptId !== row.id &&
			existing.lessonScriptPartBId !== row.id
		) {
			existing.lessonScriptReviewId = row.id
		}

		byLessonId.set(row.lessonId, existing)
	}

	return byLessonId
}

export async function getHebrewLessonScriptIdsByLessonIds(lessonIds: number[]) {
	const videoIds = await getHebrewLessonVideoIdsByLessonIds(lessonIds)
	const byLessonId = new Map<number, number>()

	for (const [lessonId, ids] of videoIds.entries()) {
		if (ids.lessonScriptId != null) {
			byLessonId.set(lessonId, ids.lessonScriptId)
		}
	}

	return byLessonId
}

export async function getHebrewLessonScriptsByLessonIds(lessonIds: number[]) {
	if (lessonIds.length === 0) {
		return new Map<number, { id: number; displayScript: boolean }>()
	}

	const directRows = await db
		.select({
			id: videos.id,
			lessonId: videos.lessonId,
		})
		.from(videos)
		.where(
			and(
				sql`${videos.type} IS DISTINCT FROM 'story'::video_type`,
				inArray(videos.lessonId, lessonIds)
			)
		)
		.orderBy(asc(videos.lessonId), asc(videos.part), asc(videos.id))

	const byLessonId = new Map<number, { id: number; displayScript: boolean }>()
	for (const row of directRows) {
		if (row.lessonId != null && !byLessonId.has(row.lessonId)) {
			byLessonId.set(row.lessonId, {
				id: row.id,
				displayScript: true,
			})
		}
	}

	return byLessonId
}

export async function getLessonNumberByLessonId(lessonId: number) {
	const lesson = await db.query.lessons.findFirst({
		where: eq(lessons.id, lessonId),
		columns: {
			id: true,
			lessonNumber: true,
		},
	})

	return lesson?.lessonNumber ?? null
}
