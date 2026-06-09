import { FeedWrapper } from '@/components/feed-wrapper'
import { getSongsWithLines, getUserProgress } from '@/db/queries'
import { notFound } from 'next/navigation'
import db from '@/db/drizzle'
import { userVideoProgress } from '@/db/schema'
import { parseScheduledPublicCourseQuery } from '@/lib/public-course-activities'
import { and, eq } from 'drizzle-orm'
import { getSession } from '@/lib/auth'
import HebrewMusicViewer from '@/components/hebrew/hebrew-music-viewer'

export default async function MusicDetailPage({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>
	searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
	const { id } = await params
	const resolvedSearchParams = (await searchParams) ?? {}
	const publicCourseQuery = parseScheduledPublicCourseQuery(resolvedSearchParams)
	const session = await getSession()
	const userId = session?.user?.id ?? null
	const userProgress = await getUserProgress(userId)
	const rawReturnTo = resolvedSearchParams.returnTo
	const returnTo =
		typeof rawReturnTo === 'string' && rawReturnTo.startsWith('/')
			? rawReturnTo
			: '/he/music'
	const songId = Number(id)
	if (isNaN(songId)) return notFound()

	const song = await getSongsWithLines(songId)
	if (!song) return notFound()
	const courseId =
		(publicCourseQuery.scheduled ? publicCourseQuery.courseId : null) ??
		userProgress?.activeCourseId ??
		6
	const initialCompleted =
		userId && song.id
			? await db.query.userVideoProgress.findFirst({
					where: and(
						eq(userVideoProgress.userId, userId),
						eq(userVideoProgress.videoId, song.id),
					),
					columns: {
						id: true,
					},
			  }).then((progress) => Boolean(progress))
			: false

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<HebrewMusicViewer
					song={song}
					courseId={courseId}
					returnTo={returnTo}
					initialCompleted={initialCompleted}
					allowLocalCompletionCache={!userId}
				/>
			</FeedWrapper>
		</div>
	)
}
