import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { and, eq, inArray } from 'drizzle-orm'
import { ArrowLeft, BookOpenCheck, Layers3 } from 'lucide-react'
import { JoinStudyGroupButton } from '@/components/learning/JoinStudyGroupButton'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { authOptions } from '@/lib/auth'
import { supabaseDb as db } from '@/db'
import { lessonModuleCompletions } from '@/db/schema/tables/learning_progress'
import { studyGroups } from '@/db/schema/tables/study_groups'

interface PageProps {
	params: Promise<{ locale: string; id: string }>
	searchParams: Promise<{ lessonComplete?: string }>
}

export default async function StudyGroupDetailPage({
	params,
	searchParams,
}: PageProps) {
	const { locale, id } = await params
	const { lessonComplete } = await searchParams
	const session = await getServerSession(authOptions)

	if (!session?.user?.id) redirect(`/${locale}/login`)

	const [studyGroup, membership] = await Promise.all([
		db.query.studyGroups.findFirst({
			where: eq(studyGroups.id, id),
			with: {
				activeCourse: {
					with: {
						courseLessons: {
							with: {
								lesson: {
									with: {
										targetLanguage: true,
										moduleAssignments: true,
									},
								},
							},
							orderBy: (courseLessons, { asc }) => [
								asc(courseLessons.sortOrder),
							],
						},
					},
				},
			},
		}),
		db.query.studyGroupMemberships.findFirst({
			where: (memberships, { and, eq }) =>
				and(
					eq(memberships.studyGroupId, id),
					eq(memberships.userId, session.user.id)
				),
		}),
	])

	if (!studyGroup) notFound()

	const lessons =
		studyGroup.activeCourse?.courseLessons.map((item) => item.lesson) ?? []
	const moduleIds = lessons.flatMap((lesson) =>
		lesson.moduleAssignments.map((assignment) => assignment.moduleId)
	)
	const completions = moduleIds.length
		? await db.query.lessonModuleCompletions.findMany({
				where: and(
					eq(lessonModuleCompletions.userId, session.user.id),
					eq(lessonModuleCompletions.studyGroupId, id),
					inArray(lessonModuleCompletions.moduleId, moduleIds)
				),
			})
		: []
	const completedByLesson = new Map<string, Set<string>>()

	for (const completion of completions) {
		const completedModules =
			completedByLesson.get(completion.lessonId) ?? new Set<string>()
		completedModules.add(completion.moduleId)
		completedByLesson.set(completion.lessonId, completedModules)
	}
	const completedLesson = lessons.find((lesson) => lesson.id === lessonComplete)

	return (
		<div className="space-y-6">
			<section className="tl-scroll-stage rounded-[2.4rem]">
				<div className="tl-scroll-body space-y-5 px-6 py-8 md:px-10">
					<Button asChild variant="ghost" className="h-auto px-0">
						<Link href={`/${locale}/study-groups`}>
							<ArrowLeft className="size-4" />
							Back to study groups
						</Link>
					</Button>
					<div className="space-y-3">
						<p className="tl-kicker">Study Group</p>
						<h1 className="tl-heading max-w-3xl text-4xl leading-tight font-semibold text-balance md:text-5xl">
							{studyGroup.title}
						</h1>
						<p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
							{studyGroup.activeCourse
								? `Current course: ${studyGroup.activeCourse.title}`
								: 'This study group does not have a current course yet.'}
						</p>
					</div>
					<JoinStudyGroupButton
						studyGroupId={studyGroup.id}
						joined={Boolean(membership)}
					/>
					{completedLesson ? (
						<div className="rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
							Lesson complete: {completedLesson.title}
						</div>
					) : null}
				</div>
			</section>

			<Card className="tl-panel rounded-[1.8rem] border-border/70 py-0">
				<CardHeader className="gap-3 px-6 pt-6">
					<div className="flex items-start justify-between gap-4">
						<div>
							<p className="tl-kicker">Current course lessons</p>
							<CardTitle className="tl-heading text-3xl font-semibold">
								{studyGroup.activeCourse?.title ?? 'No current course'}
							</CardTitle>
							<CardDescription className="mt-2 text-base leading-7">
								{lessons.length
									? `${lessons.length} lesson${lessons.length === 1 ? '' : 's'} available in this course.`
									: 'No lessons are available for the current course yet.'}
							</CardDescription>
						</div>
						<div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
							<Layers3 className="size-5" />
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-3 px-6 pb-6">
					{lessons.map((lesson) => {
						const moduleCount = lesson.moduleAssignments.length
						const completedCount = completedByLesson.get(lesson.id)?.size ?? 0
						const lessonProgress = moduleCount
							? Math.round((completedCount / moduleCount) * 100)
							: 0
						const isComplete = moduleCount > 0 && completedCount >= moduleCount

						return (
							<Link
								key={lesson.id}
								href={`/${locale}/study-groups/${studyGroup.id}/lessons/${lesson.id}`}
								className="group block rounded-[1.35rem] border border-border/70 bg-background/82 p-4 transition hover:border-primary/45 hover:bg-background hover:shadow-sm"
							>
								<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
									<div className="min-w-0 flex-1 space-y-3">
										<div className="space-y-1">
											<p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
												Lesson {lesson.number}
												{lesson.part ? ` ${lesson.part}` : ''}
											</p>
											<h2 className="tl-heading text-2xl font-semibold leading-tight transition group-hover:text-primary">
												{lesson.title}
											</h2>
											<p className="text-sm text-muted-foreground">
												{lesson.targetLanguage?.name ?? 'No target language'} ·{' '}
												{completedCount}/{moduleCount} module
												{moduleCount === 1 ? '' : 's'} complete
											</p>
										</div>
										<Progress
											value={lessonProgress}
											className="h-2 bg-primary/10"
										/>
									</div>
									<div className="flex w-fit shrink-0 items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1 text-sm">
										<BookOpenCheck className="size-4 text-primary" />
										<span>{isComplete ? 'Complete' : `${lessonProgress}%`}</span>
									</div>
								</div>
							</Link>
						)
					})}
				</CardContent>
			</Card>
		</div>
	)
}
