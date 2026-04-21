import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { and, asc, eq, inArray } from 'drizzle-orm'
import { X } from 'lucide-react'
import {
	LessonModulePlayer,
	type PlayerModule,
} from '@/components/learning/LessonModulePlayer'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { authOptions } from '@/lib/auth'
import { supabaseDb as db } from '@/db'
import { courseLessons } from '@/db/schema/tables/courses'
import { lessonModuleCompletions } from '@/db/schema/tables/learning_progress'
import { lessons } from '@/db/schema/tables/lessons'
import {
	lessonModules,
	quizQuestionAssignments,
} from '@/db/schema/tables/modules'
import { studyGroups } from '@/db/schema/tables/study_groups'

interface PageProps {
	params: Promise<{ locale: string; id: string; lessonId: string }>
	searchParams: Promise<{ module?: string }>
}

function serializeQuizMediaAsset(
	asset: {
		kind: string
		bucket: string
		objectPath: string
		fileName: string
		title: string | null
		altText: string | null
		width: number | null
		height: number | null
	} | null
) {
	if (!asset) return null

	return {
		kind: asset.kind,
		bucket: asset.bucket,
		objectPath: asset.objectPath,
		fileName: asset.fileName,
		title: asset.title,
		altText: asset.altText,
		width: asset.width,
		height: asset.height,
	}
}

export default async function LessonPlayerPage({
	params,
	searchParams,
}: PageProps) {
	const { locale, id, lessonId } = await params
	const { module: moduleParam } = await searchParams
	const session = await getServerSession(authOptions)

	if (!session?.user?.id) redirect(`/${locale}/login`)

	const [studyGroup, membership, lesson] = await Promise.all([
		db.query.studyGroups.findFirst({
			where: eq(studyGroups.id, id),
			with: {
				activeCourse: true,
			},
		}),
		db.query.studyGroupMemberships.findFirst({
			where: (memberships, { and, eq }) =>
				and(
					eq(memberships.studyGroupId, id),
					eq(memberships.userId, session.user.id)
				),
		}),
		db.query.lessons.findFirst({
			where: eq(lessons.id, lessonId),
		}),
	])

	if (!studyGroup || !lesson) notFound()
	if (!membership) redirect(`/${locale}/study-groups/${id}`)

	if (studyGroup.activeCourseId) {
		const courseLesson = await db.query.courseLessons.findFirst({
			where: and(
				eq(courseLessons.courseId, studyGroup.activeCourseId),
				eq(courseLessons.lessonId, lesson.id)
			),
		})

		if (!courseLesson) notFound()
	}

	const moduleAssignments = await db.query.lessonModules.findMany({
		where: eq(lessonModules.lessonId, lessonId),
		with: {
			module: {
				with: {
					mediaAsset: true,
					quiz: true,
				},
			},
		},
		orderBy: (lessonModules, { asc }) => [asc(lessonModules.sortOrder)],
	})
	const moduleRows = moduleAssignments.map((assignment) => assignment.module)
	const completedModules = await db.query.lessonModuleCompletions.findMany({
		where: and(
			eq(lessonModuleCompletions.userId, session.user.id),
			eq(lessonModuleCompletions.studyGroupId, id),
			eq(lessonModuleCompletions.lessonId, lessonId)
		),
	})
	const completedModuleIds = new Set(
		completedModules.map((completion) => completion.moduleId)
	)
	const quizIds = moduleRows
		.map((module) => module.quizId)
		.filter((quizId): quizId is string => Boolean(quizId))
	const questionAssignments = quizIds.length
		? await db.query.quizQuestionAssignments.findMany({
				where: inArray(quizQuestionAssignments.quizId, quizIds),
				with: {
					question: {
						with: {
							promptAsset: true,
							answers: {
								with: {
									answerAsset: true,
								},
								orderBy: (answers, { asc }) => [asc(answers.sortOrder)],
							},
						},
					},
				},
				orderBy: [asc(quizQuestionAssignments.sortOrder)],
			})
		: []
	const modules: PlayerModule[] = moduleRows.map((module) => ({
		id: module.id,
		title: module.title,
		type: module.type,
		externalUrl: module.externalUrl,
		mediaAsset: module.mediaAsset
			? {
					bucket: module.mediaAsset.bucket,
					objectPath: module.mediaAsset.objectPath,
				}
			: null,
		quiz: module.quiz
			? {
					title: module.quiz.title,
					questionAssignments: questionAssignments
						.filter((assignment) => assignment.quizId === module.quizId)
						.map((assignment) => ({
							question: {
								title: assignment.question.title,
								promptText: assignment.question.promptText,
								promptAsset: serializeQuizMediaAsset(
									assignment.question.promptAsset
								),
								answers: assignment.question.answers.map((answer) => ({
									id: answer.id,
									answerText: answer.answerText,
									answerAsset: serializeQuizMediaAsset(answer.answerAsset),
									isCorrect: answer.isCorrect,
								})),
							},
						})),
				}
			: null,
	}))
	const requestedIndex = Number(moduleParam ?? 0)
	const moduleIndex =
		Number.isFinite(requestedIndex) && requestedIndex >= 0
			? Math.min(requestedIndex, Math.max(modules.length - 1, 0))
			: 0
	const currentModule = modules[moduleIndex]
	const completedModuleCount = modules.filter((module) =>
		completedModuleIds.has(module.id)
	).length
	const progress = modules.length
		? Math.round((completedModuleCount / modules.length) * 100)
		: 0
	const previousHref = `/${locale}/study-groups/${id}/lessons/${lessonId}?module=${Math.max(moduleIndex - 1, 0)}`
	const nextHref = `/${locale}/study-groups/${id}/lessons/${lessonId}?module=${Math.min(moduleIndex + 1, Math.max(modules.length - 1, 0))}`
	const studyGroupHref = `/${locale}/study-groups/${id}?lessonComplete=${lessonId}`

	return (
		<main className="min-h-screen bg-background">
			<div className="mx-auto flex min-h-screen max-w-[96rem] flex-col px-4 py-3 md:px-6">
				<header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-5">
					<Button asChild variant="ghost" size="icon" className="rounded-full">
						<Link href={`/${locale}/study-groups/${id}`} aria-label="Exit lesson">
							<X className="size-5" />
						</Link>
					</Button>
					<Progress value={progress} className="h-3 bg-muted" />
					<div className="min-w-16 text-right text-sm font-semibold text-muted-foreground">
						{moduleIndex + 1}/{Math.max(modules.length, 1)}
					</div>
				</header>

				<LessonModulePlayer
					key={moduleIndex}
					studyGroupId={id}
					lessonId={lessonId}
					studyGroupHref={studyGroupHref}
					currentModule={currentModule}
					currentModuleCompleted={
						currentModule ? completedModuleIds.has(currentModule.id) : false
					}
					moduleIndex={moduleIndex}
					moduleCount={modules.length}
					previousHref={previousHref}
					nextHref={nextHref}
				/>
			</div>
		</main>
	)
}
