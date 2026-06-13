import { asc, and, eq, inArray } from 'drizzle-orm'

import db from '@/db/drizzle'
import {
	publicCourseActivityCompletion,
	publicCourse,
	publicCourseEnrollment,
	studyGroupMembers,
	studyGroups,
	userVideoProgress,
	studyGroupCourse,
} from '@/db/schema'
import CatalogCard from '@/components/courses/catalog-card'
import PublicCoursesSection from '@/components/courses/public-courses-section'
import { getSession } from '@/lib/auth'
import {
	getPublicCourseActivityVideoId,
	type PublicCourseActivityFilters,
	type PublicCourseActivityKey,
} from '@/lib/public-course-activities'
import { getHebrewLessonVideoIdsByLessonIds } from '@/lib/server/public-course-activity-options'
import { buildPublicCourseActivitySignature } from '@/lib/server/public-course-activity-signature'

export const dynamic = 'force-dynamic'

export default async function CoursesPage() {
	const session = await getSession()
	const userId = session?.user?.id ?? null

	const [publicCourses, studyGroupCourses, accessibleStudyGroups] = await Promise.all([
		db.query.publicCourse.findMany({
			orderBy: [asc(publicCourse.order), asc(publicCourse.name)],
			with: {
				curriculum: {
					columns: {
						id: true,
						title: true,
					},
				},
				lessons: {
					columns: {
						id: true,
					},
					with: {
						lesson: {
							columns: {
								id: true,
								lessonNumber: true,
							},
						},
						platformCourse: {
							columns: {
								id: true,
							},
						},
						activities: {
							columns: {
								id: true,
								isEnabled: true,
								activityKey: true,
								filterConfig: true,
							},
						},
					},
				},
				enrollments: userId
					? {
							where: eq(publicCourseEnrollment.userId, userId),
							columns: {
								id: true,
								publicCourseId: true,
							},
							with: {
								activityProgress: {
									columns: {
										publicCourseLessonActivityId: true,
									},
								},
							},
						}
					: undefined,
			},
		}),
		db.query.studyGroupCourse.findMany({
			orderBy: [asc(studyGroupCourse.name)],
			with: {
				studyGroup: {
					columns: {
						id: true,
						name: true,
						groupType: true,
					},
				},
			},
		}),
		userId
			? Promise.all([
					db.query.studyGroups.findMany({
						where: eq(studyGroups.groupType, 'Public'),
						orderBy: [asc(studyGroups.name)],
						columns: {
							id: true,
							name: true,
							groupType: true,
							organization: true,
							level: true,
							section: true,
						},
					}),
					db.query.studyGroups.findMany({
						where: eq(studyGroups.teacherId, userId),
						orderBy: [asc(studyGroups.name)],
						columns: {
							id: true,
							name: true,
							groupType: true,
							organization: true,
							level: true,
							section: true,
						},
					}),
					db.query.studyGroupMembers.findMany({
						where: eq(studyGroupMembers.userId, userId),
						with: {
							studyGroup: {
								columns: {
									id: true,
									name: true,
									groupType: true,
									organization: true,
									level: true,
									section: true,
								},
							},
						},
					}),
				]).then(([publicGroups, teachingGroups, memberGroups]) => {
					const combined = [
						...publicGroups,
						...teachingGroups,
						...memberGroups.map((membership) => membership.studyGroup),
					].filter((group) => group.groupType !== 'Self-paced')

					return Array.from(
						new Map(combined.map((group) => [group.id, group])).values(),
					)
				})
			: Promise.resolve([]),
	])

	const visibleStudyGroupCourses = studyGroupCourses.filter(
		(course) => course.studyGroup?.groupType === 'Public',
	)
	const enrollmentByCourseId = new Map(
		publicCourses
			.map((course) => course.enrollments?.[0] ?? null)
			.filter(
				(enrollment): enrollment is NonNullable<
					(typeof publicCourses)[number]['enrollments']
				>[number] => enrollment != null,
			)
			.map((enrollment) => [
				enrollment.publicCourseId,
				{
					activityProgress: new Set(
						(enrollment.activityProgress ?? []).map(
							(progress) => progress.publicCourseLessonActivityId,
						),
					),
				},
			]),
	)

	const activitySignatureRows = publicCourses.flatMap((course) =>
		course.lessons.flatMap((lesson) =>
			lesson.activities.map((activity) => ({
				signature: buildPublicCourseActivitySignature({
					activityKey: activity.activityKey as PublicCourseActivityKey,
					platformCourseId: lesson.platformCourse.id,
					lessonId: lesson.lesson.id,
					lessonNumber: lesson.lesson.lessonNumber,
					filterConfig: (activity.filterConfig ?? {}) as PublicCourseActivityFilters,
				}),
				publicCourseLessonActivityId: activity.id,
			})),
		),
	)

	const sharedCompletionRows =
		userId && activitySignatureRows.length > 0
			? await db
					.select({
						activitySignature: publicCourseActivityCompletion.activitySignature,
					})
					.from(publicCourseActivityCompletion)
					.where(
						and(
							eq(publicCourseActivityCompletion.userId, userId),
							inArray(
								publicCourseActivityCompletion.activitySignature,
								activitySignatureRows.map((row) => row.signature),
							),
						),
					)
			: []

	const sharedCompletionSet = new Set(
		sharedCompletionRows.map((row) => row.activitySignature),
	)

	const publicCourseLessonIds = publicCourses.flatMap((course) =>
		course.lessons.map((lesson) => lesson.lesson.id),
	)
	const lessonVideoIdsByLessonId =
		publicCourseLessonIds.length > 0
			? await getHebrewLessonVideoIdsByLessonIds(publicCourseLessonIds)
			: new Map<number, { lessonScriptId: number | null; lessonScriptPartBId: number | null; lessonScriptReviewId: number | null }>()

	const videoIdsToFetch = Array.from(
		new Set(
			Array.from(lessonVideoIdsByLessonId.values()).flatMap((ids) => [
				ids.lessonScriptId,
				ids.lessonScriptPartBId,
				ids.lessonScriptReviewId,
			]),
		),
	).filter((id): id is number => typeof id === 'number')
	const customActivityVideoIds = publicCourses.flatMap((course) =>
		course.lessons.flatMap((lesson) =>
			lesson.activities
				.map((activity) =>
					getPublicCourseActivityVideoId({
						activityKey: activity.activityKey,
						filterConfig: activity.filterConfig ?? {},
						lessonScriptId: null,
						lessonScriptPartBId: null,
						lessonScriptReviewId: null,
					}),
				)
				.filter((id): id is number => typeof id === 'number'),
		),
	)
	const allVideoIdsToFetch = Array.from(
		new Set([...videoIdsToFetch, ...customActivityVideoIds]),
	)

	const completedVideoIds =
		userId && allVideoIdsToFetch.length > 0
			? await db.query.userVideoProgress
					.findMany({
						where: and(
							eq(userVideoProgress.userId, userId),
							inArray(userVideoProgress.videoId, allVideoIdsToFetch),
						),
						columns: {
							videoId: true,
						},
					})
					.then((rows) => rows.map((row) => row.videoId))
			: []
	const completedVideoIdSet = new Set(completedVideoIds)
	const publicCourseCards = publicCourses.map((course) => {
		const enrollment = enrollmentByCourseId.get(course.id)
		const localActivityProgressSet = enrollment?.activityProgress ?? null
		const totalEnabledActivities = course.lessons.reduce((total, lesson) => {
			return (
				total + lesson.activities.filter((activity) => activity.isEnabled).length
			)
		}, 0)
		const completedActivities = course.lessons.reduce((total, lesson) => {
			const lessonVideoIds = lessonVideoIdsByLessonId.get(lesson.lesson.id) ?? null

			const completedForLesson = lesson.activities.filter((activity) => {
				if (!activity.isEnabled) return false

				const signature = buildPublicCourseActivitySignature({
					activityKey: activity.activityKey as PublicCourseActivityKey,
					platformCourseId: lesson.platformCourse.id,
					lessonId: lesson.lesson.id,
					lessonNumber: lesson.lesson.lessonNumber,
					filterConfig: (activity.filterConfig ?? {}) as PublicCourseActivityFilters,
				})
				const videoId = getPublicCourseActivityVideoId({
					activityKey: activity.activityKey as PublicCourseActivityKey,
					filterConfig: (activity.filterConfig ?? {}) as PublicCourseActivityFilters,
					lessonScriptId: lessonVideoIds?.lessonScriptId ?? null,
					lessonScriptPartBId: lessonVideoIds?.lessonScriptPartBId ?? null,
					lessonScriptReviewId: lessonVideoIds?.lessonScriptReviewId ?? null,
				})
				if (videoId != null) {
					return (
						completedVideoIdSet.has(videoId) ||
						(localActivityProgressSet?.has(activity.id) ?? false) ||
						sharedCompletionSet.has(signature)
					)
				}

				return (
					(localActivityProgressSet?.has(activity.id) ?? false) ||
					sharedCompletionSet.has(signature)
				)
			}).length

			return total + completedForLesson
		}, 0)
		const isEnrolled = Boolean(enrollment)

		return {
			id: course.id,
			curriculumTitle: course.curriculum?.title ?? null,
			name: course.name,
			imageUrl: course.imageUrl,
			description: course.description ?? null,
			progress: isEnrolled
				? {
						completed: completedActivities,
						total: totalEnabledActivities,
					}
				: null,
		}
	})

	return (
		<div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
			<div className="max-w-3xl space-y-3">
				<h1 className="text-3xl font-bold text-slate-900">Courses</h1>
				<p className="text-base text-slate-600">
					Explore self-paced public courses and public study-group tracks built
					from lessons across the curriculum.
				</p>
			</div>

			<div className="mt-8 space-y-10">
				{accessibleStudyGroups.length > 0 ? (
					<section className="space-y-4">
						<div>
							<h2 className="text-2xl font-semibold text-slate-900">
								My Study Groups
							</h2>
							<p className="text-sm text-slate-600">
								Public groups plus any private groups you teach or belong to.
							</p>
						</div>
						<div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
							{accessibleStudyGroups.map((group, index) => (
								<CatalogCard
									key={`my-study-group-${group.id}`}
									href={`/study-group/${group.id}`}
									title={group.name}
									imageUrl="/mascot.svg"
									priority={index === 0}
									kindLabel={
										group.groupType === 'Public'
											? 'Public study group'
											: 'Private study group'
									}
									subtitle={[
										group.organization,
										group.level ? `Level ${group.level}` : null,
										group.section,
									]
										.filter(Boolean)
										.join(' · ')}
									ctaLabel="Open study group"
								/>
							))}
						</div>
					</section>
				) : null}

				<PublicCoursesSection courses={publicCourseCards} />

				{visibleStudyGroupCourses.length > 0 ? (
					<section className="space-y-4">
						<div>
							<h2 className="text-2xl font-semibold text-slate-900">
								Public Study Groups
							</h2>
							<p className="text-sm text-slate-600">
								Join a public study group when you want a curated group-led
								path.
							</p>
						</div>
						<div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
							{visibleStudyGroupCourses.map((course) => (
								<CatalogCard
									key={`study-group-${course.id}`}
									href={`/courses/study-group/${course.studyGroupId}/${course.id}`}
									title={course.name}
									imageUrl={course.imageUrl}
									kindLabel="Study group"
									subtitle={course.studyGroup?.name ?? 'Public study group'}
								/>
							))}
						</div>
					</section>
				) : null}
			</div>
		</div>
	)
}
