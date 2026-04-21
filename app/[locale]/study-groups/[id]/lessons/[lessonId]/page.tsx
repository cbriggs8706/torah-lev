import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { asc, eq, inArray } from 'drizzle-orm'
import { ArrowLeft, ArrowRight, FileText, Headphones, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { authOptions } from '@/lib/auth'
import { supabaseDb as db } from '@/db'
import { lessons } from '@/db/schema/tables/lessons'
import {
	lessonModules,
	modules as modulesTable,
	quizQuestionAnswers,
	quizQuestionAssignments,
} from '@/db/schema/tables/modules'
import {
	studyGroupMemberships,
	studyGroups,
} from '@/db/schema/tables/study_groups'

interface PageProps {
	params: Promise<{ locale: string; id: string; lessonId: string }>
	searchParams: Promise<{ module?: string }>
}

type PlayerModule = {
	title: string
	type: 'video' | 'audio' | 'document' | 'quiz'
	externalUrl: string | null
	mediaAsset: {
		bucket: string
		objectPath: string
	} | null
	quiz: {
		title: string
		questionAssignments: Array<{
			question: {
				title: string
				promptText: string | null
				answers: Array<{
					id: string
					answerText: string | null
				}>
			}
		}>
	} | null
}

function mediaUrl(bucket: string, objectPath: string) {
	const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
	if (!baseUrl) return null

	return `${baseUrl}/storage/v1/object/public/${bucket}/${objectPath}`
}

function youtubeEmbedUrl(url: string) {
	try {
		const parsed = new URL(url)
		const host = parsed.hostname.replace(/^www\./, '')

		if (host === 'youtu.be') {
			return `https://www.youtube.com/embed/${parsed.pathname.slice(1)}`
		}

		if (host === 'youtube.com' || host === 'm.youtube.com') {
			const videoId = parsed.searchParams.get('v')
			if (videoId) return `https://www.youtube.com/embed/${videoId}`
		}
	} catch {
		return null
	}

	return null
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

	if (studyGroup.activeCourseId && lesson.courseId !== studyGroup.activeCourseId) {
		notFound()
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
	const quizIds = moduleRows
		.map((module) => module.quizId)
		.filter((quizId): quizId is string => Boolean(quizId))
	const questionAssignments = quizIds.length
		? await db.query.quizQuestionAssignments.findMany({
				where: inArray(quizQuestionAssignments.quizId, quizIds),
				with: {
					question: true,
				},
				orderBy: [asc(quizQuestionAssignments.sortOrder)],
			})
		: []
	const questionIds = questionAssignments.map(
		(assignment) => assignment.questionId
	)
	const answers = questionIds.length
		? await db.query.quizQuestionAnswers.findMany({
				where: inArray(quizQuestionAnswers.questionId, questionIds),
				orderBy: [asc(quizQuestionAnswers.sortOrder)],
			})
		: []
	const modules: PlayerModule[] = moduleRows.map((module) => ({
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
								answers: answers
									.filter(
										(answer) => answer.questionId === assignment.questionId
									)
									.map((answer) => ({
										id: answer.id,
										answerText: answer.answerText,
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
	const progress = modules.length
		? Math.round(((moduleIndex + 1) / modules.length) * 100)
		: 0
	const previousHref = `/${locale}/study-groups/${id}/lessons/${lessonId}?module=${Math.max(moduleIndex - 1, 0)}`
	const nextHref = `/${locale}/study-groups/${id}/lessons/${lessonId}?module=${Math.min(moduleIndex + 1, Math.max(modules.length - 1, 0))}`

	return (
		<main className="min-h-screen bg-background">
			<div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
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

				<section className="flex flex-1 flex-col justify-center py-16">
					<div className="mx-auto w-full max-w-5xl space-y-8">
						<div className="space-y-2">
							<p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
								{lesson.title}
							</p>
							<h1 className="font-[family:var(--font-eczar)] text-4xl font-semibold">
								{currentModule?.title ?? 'No modules yet'}
							</h1>
						</div>

						{currentModule ? (
							<ModuleStage module={currentModule} />
						) : (
							<div className="rounded-[2rem] border border-dashed border-border p-10 text-center text-muted-foreground">
								This lesson does not have modules assigned yet.
							</div>
						)}
					</div>
				</section>

				<footer className="flex items-center justify-between border-t border-border/70 py-5">
					<Button
						asChild
						variant="outline"
						disabled={moduleIndex === 0}
						className={moduleIndex === 0 ? 'pointer-events-none opacity-40' : ''}
					>
						<Link href={previousHref}>
							<ArrowLeft className="size-4" />
							Back
						</Link>
					</Button>
					<Button
						asChild
						disabled={!modules.length || moduleIndex >= modules.length - 1}
						className={
							!modules.length || moduleIndex >= modules.length - 1
								? 'pointer-events-none opacity-40'
								: ''
						}
					>
						<Link href={nextHref}>
							Next
							<ArrowRight className="size-4" />
						</Link>
					</Button>
				</footer>
			</div>
		</main>
	)
}

function ModuleStage({
	module,
}: {
	module: PlayerModule
}) {
	if (module.type === 'video') {
		const embedUrl = module.externalUrl ? youtubeEmbedUrl(module.externalUrl) : null
		const assetUrl = module.mediaAsset
			? mediaUrl(module.mediaAsset.bucket, module.mediaAsset.objectPath)
			: null

		if (embedUrl) {
			return (
				<div className="overflow-hidden rounded-[1.5rem] border border-border bg-black shadow-xl">
					<iframe
						src={embedUrl}
						title={module.title}
						className="aspect-video w-full"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowFullScreen
					/>
				</div>
			)
		}

		if (assetUrl) {
			return (
				<video
					src={assetUrl}
					controls
					className="aspect-video w-full rounded-[1.5rem] border border-border bg-black shadow-xl"
				/>
			)
		}
	}

	if (module.type === 'audio') {
		const assetUrl = module.mediaAsset
			? mediaUrl(module.mediaAsset.bucket, module.mediaAsset.objectPath)
			: null

		return (
			<div className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
				<div className="mb-6 flex size-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
					<Headphones className="size-7" />
				</div>
				<h2 className="font-[family:var(--font-eczar)] text-3xl font-semibold">
					Listen
				</h2>
				{assetUrl ? (
					<audio src={assetUrl} controls className="mt-6 w-full" />
				) : (
					<p className="mt-4 text-muted-foreground">No audio asset assigned.</p>
				)}
			</div>
		)
	}

	if (module.type === 'document') {
		const assetUrl = module.mediaAsset
			? mediaUrl(module.mediaAsset.bucket, module.mediaAsset.objectPath)
			: null

		return (
			<div className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
				<div className="mb-6 flex size-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
					<FileText className="size-7" />
				</div>
				<h2 className="font-[family:var(--font-eczar)] text-3xl font-semibold">
					Read this document
				</h2>
				{assetUrl ? (
					<Button asChild className="mt-6">
						<a href={assetUrl} target="_blank" rel="noreferrer">
							Open document
						</a>
					</Button>
				) : (
					<p className="mt-4 text-muted-foreground">
						No document asset assigned.
					</p>
				)}
			</div>
		)
	}

	if (module.type === 'quiz') {
		const questions = module.quiz?.questionAssignments ?? []
		const firstQuestion = questions[0]?.question

		return (
			<div className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
				<p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
					Quiz
				</p>
				<h2 className="mt-2 font-[family:var(--font-eczar)] text-3xl font-semibold">
					{module.quiz?.title ?? module.title}
				</h2>
				{firstQuestion ? (
					<div className="mt-8 space-y-5">
						<p className="text-xl font-semibold">{firstQuestion.title}</p>
						{firstQuestion.promptText ? (
							<p className="rounded-2xl border border-border bg-background p-4 text-lg">
								{firstQuestion.promptText}
							</p>
						) : null}
						<div className="grid gap-3 md:grid-cols-2">
							{firstQuestion.answers.map((answer) => (
								<button
									key={answer.id}
									type="button"
									className="rounded-2xl border border-border bg-background p-4 text-left hover:border-primary"
								>
									{answer.answerText ?? 'Media answer'}
								</button>
							))}
						</div>
					</div>
				) : (
					<p className="mt-4 text-muted-foreground">
						This quiz does not have questions yet.
					</p>
				)}
			</div>
		)
	}

	return (
		<div className="rounded-[2rem] border border-dashed border-border p-10 text-center text-muted-foreground">
			This module is not ready yet.
		</div>
	)
}
