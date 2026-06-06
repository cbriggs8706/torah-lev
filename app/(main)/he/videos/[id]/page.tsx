import Image from 'next/image'
import { FeedWrapper } from '@/components/feed-wrapper'
import { notFound } from 'next/navigation'
import { getHebrewLessonScript } from '@/db/queries'
import db from '@/db/drizzle'
import { publicCourseLessonActivity } from '@/db/schema'
import LessonScriptViewer from '@/components/hebrew/hebrew-lesson-script-viewer'
import { parseScheduledPublicCourseQuery } from '@/lib/public-course-activities'
import { and, eq } from 'drizzle-orm'

export default async function HebrewLessonScriptPage({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>
	searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
	const { id } = await params
	const resolvedSearchParams = (await searchParams) ?? {}
	const publicCourseQuery = parseScheduledPublicCourseQuery(resolvedSearchParams)
	const lessonScript = await getHebrewLessonScript(Number(id))

	if (!lessonScript) return notFound()

	const scriptVisibilityOverride =
		publicCourseQuery.scheduled &&
		publicCourseQuery.activityKey === 'lesson_script'
			? typeof publicCourseQuery.filters.displayScript === 'boolean'
				? publicCourseQuery.filters.displayScript
				: publicCourseQuery.publicCourseLessonId
					? await db.query.publicCourseLessonActivity.findFirst({
							where: and(
								eq(
									publicCourseLessonActivity.publicCourseLessonId,
									publicCourseQuery.publicCourseLessonId
								),
								eq(publicCourseLessonActivity.activityKey, 'lesson_script')
							),
							columns: {
								filterConfig: true,
							},
					  }).then((activity) =>
							typeof activity?.filterConfig?.displayScript === 'boolean'
								? activity.filterConfig.displayScript
								: true
					  )
					: true
			: true

	// console.log('HERE>>>>', lessonScript)

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/icons/iconYoutube.png"
						alt="Video"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-cardo text-neutral-800 text-6xl my-6">
						סרטון שיעור
					</h1>
					<p className="text-center font-bold text-neutral-800 mb-2">
						Video
					</p>
				</div>
				<LessonScriptViewer
					lessonScript={lessonScript}
					showScript={scriptVisibilityOverride}
					completionContext={
						publicCourseQuery.enrollmentId && publicCourseQuery.publicCourseLessonId
							? {
									enrollmentId: publicCourseQuery.enrollmentId,
									publicCourseLessonId: publicCourseQuery.publicCourseLessonId,
							  }
							: undefined
					}
				/>
			</FeedWrapper>
		</div>
	)
}
