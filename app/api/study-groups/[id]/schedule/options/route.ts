import { asc, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import db from '@/db/drizzle'
import { hebrewMusicLibrary, studyGroups, videos } from '@/db/schema'
import { getUserOrThrow } from '@/lib/auth'

async function getStudyGroupAccess(studyGroupId: number, userId: string) {
	const group = await db.query.studyGroups.findFirst({
		where: eq(studyGroups.id, studyGroupId),
		with: {
			members: true,
		},
	})

	if (!group) return { group: null, canManage: false }

	return {
		group,
		canManage: group.teacherId === userId,
	}
}

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const userId = await getUserOrThrow()
		const studyGroupId = Number((await params).id)

		if (!Number.isFinite(studyGroupId)) {
			return NextResponse.json({ error: 'Invalid study group id' }, { status: 400 })
		}

		const access = await getStudyGroupAccess(studyGroupId, userId)

		if (!access.group) {
			return NextResponse.json({ error: 'Study group not found' }, { status: 404 })
		}

		if (!access.canManage) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
		}

		const [videoOptions, musicLibrary] = await Promise.all([
			db.query.videos.findMany({
				orderBy: [asc(videos.type), asc(videos.id)],
				columns: {
					id: true,
					type: true,
					title: true,
					hebTitle: true,
					titleTransliteration: true,
					part: true,
					order: true,
					contentPlain: true,
					content: true,
				},
			}),
			db.query.hebrewMusicLibrary.findMany({
				orderBy: [asc(hebrewMusicLibrary.category), asc(hebrewMusicLibrary.order)],
				columns: {
					id: true,
					title: true,
					hebTitle: true,
					titleTransliteration: true,
					category: true,
					order: true,
				},
			}),
		])

		return NextResponse.json({ videoOptions, musicLibrary })
	} catch (error) {
		if (error instanceof Error && error.message === 'Unauthorized') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		console.error('Error fetching study group schedule options:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch study group schedule options' },
			{ status: 500 },
		)
	}
}
