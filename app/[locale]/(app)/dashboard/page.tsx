import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { and, asc, eq, inArray } from 'drizzle-orm'
import {
	ArrowRight,
	BookOpen,
	Heart,
	LibraryBig,
	ScrollText,
	Sparkles,
} from 'lucide-react'

import { authOptions } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { supabaseDb as db } from '@/db'
import { courseLessons } from '@/db/schema/tables/courses'
import { lessonModuleCompletions } from '@/db/schema/tables/learning_progress'
import { lessons } from '@/db/schema/tables/lessons'
import { lessonModules } from '@/db/schema/tables/modules'
import { studyGroupMemberships } from '@/db/schema/tables/study_groups'

interface DashboardPageProps {
	params: Promise<{ locale: string }>
}

const focusCards = [
	{
		title: 'Hebrew Reader',
		description: 'Step back into the text and continue in context.',
		icon: ScrollText,
		linkLabel: 'Open reader',
		href: (locale: string) => `/${locale}/reader/hebrew`,
	},
	{
		title: 'Alphabet Practice',
		description: 'Refresh names, sounds, and the shape of each letter.',
		icon: BookOpen,
		linkLabel: 'Practice letters',
		href: (locale: string) => `/${locale}/hebrew/alphabet`,
	},
	{
		title: 'Course Path',
		description: 'Return to the guided lessons and keep your momentum.',
		icon: LibraryBig,
		linkLabel: 'View courses',
		href: (locale: string) => `/${locale}/courses`,
	},
]

const ritualNotes = [
	{
		title: 'Heart vitality',
		description: 'Track the energy you bring into practice, not just raw completion.',
		icon: Heart,
		iconClassName: 'bg-primary text-primary-foreground',
	},
	{
		title: 'Daily blessing',
		description: 'End a session with a small benediction instead of generic gamified praise.',
		icon: Sparkles,
		iconClassName: 'bg-secondary text-secondary-foreground',
	},
]

export default async function Page({ params }: DashboardPageProps) {
	const { locale } = await params
	const session = await getServerSession(authOptions)

	if (!session) redirect(`/${locale}`)

	const membership = session.user.id
		? await db.query.studyGroupMemberships.findFirst({
				where: eq(studyGroupMemberships.userId, session.user.id),
				with: {
					studyGroup: true,
				},
			})
		: null

	let currentLessonLabel = 'Lesson 1'
	let currentLessonTitle = 'First Words'
	let currentLessonMeta = 'Biblical Hebrew • 2/2 modules complete'
	let currentLessonProgress = 100
	let currentLessonHref = `/${locale}/courses`

	if (session.user.id && membership?.studyGroup.activeCourseId) {
		const orderedLessons = await db
			.select({
				lessonId: courseLessons.lessonId,
				sortOrder: courseLessons.sortOrder,
				lessonNumber: lessons.number,
				lessonTitle: lessons.title,
			})
			.from(courseLessons)
			.innerJoin(lessons, eq(lessons.id, courseLessons.lessonId))
			.where(eq(courseLessons.courseId, membership.studyGroup.activeCourseId))
			.orderBy(asc(courseLessons.sortOrder), asc(lessons.number))

		const lessonIds = orderedLessons.map((lesson) => lesson.lessonId)

		if (lessonIds.length) {
			const [moduleAssignments, completions] = await Promise.all([
				db
					.select({
						lessonId: lessonModules.lessonId,
						moduleId: lessonModules.moduleId,
					})
					.from(lessonModules)
					.where(inArray(lessonModules.lessonId, lessonIds)),
				db
					.select({
						lessonId: lessonModuleCompletions.lessonId,
						moduleId: lessonModuleCompletions.moduleId,
					})
					.from(lessonModuleCompletions)
					.where(
						and(
							eq(lessonModuleCompletions.userId, session.user.id),
							eq(
								lessonModuleCompletions.studyGroupId,
								membership.studyGroupId
							),
							inArray(lessonModuleCompletions.lessonId, lessonIds)
						)
					),
			])

			const moduleCounts = new Map<string, number>()
			for (const assignment of moduleAssignments) {
				moduleCounts.set(
					assignment.lessonId,
					(moduleCounts.get(assignment.lessonId) ?? 0) + 1
				)
			}

			const completionCounts = new Map<string, number>()
			for (const completion of completions) {
				completionCounts.set(
					completion.lessonId,
					(completionCounts.get(completion.lessonId) ?? 0) + 1
				)
			}

			const activeLesson =
				orderedLessons.find((lesson) => {
					const totalModules = moduleCounts.get(lesson.lessonId) ?? 0
					const completedModules = completionCounts.get(lesson.lessonId) ?? 0
					return totalModules === 0 || completedModules < totalModules
				}) ?? orderedLessons[orderedLessons.length - 1]

			if (activeLesson) {
				const totalModules = moduleCounts.get(activeLesson.lessonId) ?? 0
				const completedModules = completionCounts.get(activeLesson.lessonId) ?? 0
				currentLessonProgress = totalModules
					? Math.round((completedModules / totalModules) * 100)
					: 0
				currentLessonLabel = `Lesson ${activeLesson.lessonNumber}`
				currentLessonTitle = activeLesson.lessonTitle
				currentLessonMeta = `${completedModules}/${Math.max(totalModules, 0)} modules complete`
				currentLessonHref = `/${locale}/study-groups/${membership.studyGroupId}/lessons/${activeLesson.lessonId}`
			}
		}
	}

	return (
		<div className="space-y-6">
			<section className="tl-papyrus-scroll px-1 py-4">
				<div className="tl-papyrus-sheet px-5 py-7 md:px-8 md:py-8">
					<div className="tl-vellum-panel rounded-[2rem] px-6 py-6 md:px-8 md:py-7">
						<div className="space-y-5">
							<h1 className="font-nunito text-[1.5rem] leading-none text-[#6f5546] md:text-[1.7rem]">
								Pick up where you left off
							</h1>
							<div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
								<div className="space-y-2">
									<p className="text-[1.95rem] leading-none text-[#8c6a57] uppercase tracking-[0.12em]">
										{currentLessonLabel}
									</p>
									<h2 className="font-cardo text-4xl leading-none font-semibold text-[#2f1b12] md:text-6xl">
										{currentLessonTitle}
									</h2>
									<p className="text-[1.85rem] leading-tight text-[#7a5a4a] md:text-[2rem]">
										{currentLessonMeta}
									</p>
								</div>
								<Button
									asChild
									size="lg"
									className="h-14 self-start rounded-full bg-primary px-7 text-[1.2rem] text-primary-foreground hover:bg-primary/90 md:self-end"
								>
									<Link href={currentLessonHref}>
										Jump to lesson
										<ArrowRight className="size-5" />
									</Link>
								</Button>
							</div>
							<div className="space-y-2 pt-2">
								<div className="flex items-center justify-between text-[1.6rem] leading-none text-[#7b5b4c]">
									<span>Current lesson progress</span>
									<span className="font-semibold text-[#6f1f2b]">
										{currentLessonProgress}%
									</span>
								</div>
								<Progress
									value={currentLessonProgress}
									className="h-4 bg-[#8f2230]/12"
								/>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="grid gap-4 lg:grid-cols-[minmax(0,1.16fr)_minmax(0,0.84fr)]">
				<Card className="tl-vellum-panel rounded-[1.7rem] py-0">
					<CardHeader className="gap-3 px-6 pt-6">
						<p className="tl-kicker text-primary">Focus passages</p>
						<CardTitle className="font-[family:var(--font-cardo)] text-3xl font-semibold">
							Choose the next line to touch
						</CardTitle>
						<CardDescription className="max-w-2xl font-[family:var(--font-cardo)] text-base leading-7 text-muted-foreground">
							Three clean paths into study, without the extra status tiles.
						</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-4 px-6 pb-6 md:grid-cols-3">
						{focusCards.map((card, index) => (
							<div
								key={card.title}
								className="rounded-[1.4rem] border border-[#b9854c]/18 bg-[linear-gradient(180deg,rgba(255,249,236,0.95),rgba(245,232,205,0.88))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.42)]"
							>
								<div className="flex items-center justify-between">
									<div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
										<card.icon className="size-5" />
									</div>
									<span className="font-[family:var(--font-alegreya-sc)] text-[0.7rem] tracking-[0.24em] text-muted-foreground uppercase">
										Line {index + 1}
									</span>
								</div>
								<h3 className="mt-4 font-[family:var(--font-cardo)] text-2xl font-semibold">
									{card.title}
								</h3>
								<p className="mt-2 text-sm leading-6 text-muted-foreground">
									{card.description}
								</p>
								<div className="tl-scroll-divider my-4 text-center text-[0]">.</div>
								<Button
									asChild
									variant="ghost"
									className="h-auto px-0 font-[family:var(--font-alegreya-sc)] text-[0.78rem] tracking-[0.18em] text-primary uppercase hover:bg-transparent hover:text-primary/80"
								>
									<Link href={card.href(locale)}>
										{card.linkLabel}
										<ArrowRight className="size-4" />
									</Link>
								</Button>
							</div>
						))}
					</CardContent>
				</Card>

				<Card className="tl-vellum-panel rounded-[1.7rem] py-0">
					<CardHeader className="gap-3 px-6 pt-6">
						<p className="tl-kicker text-primary">Living symbols</p>
						<CardTitle className="font-[family:var(--font-cardo)] text-3xl font-semibold">
							Hearts with purpose
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4 px-6 pb-6">
						{ritualNotes.map((note) => (
							<div
								key={note.title}
								className="rounded-[1.45rem] border border-border/70 bg-background/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
							>
								<div className="flex items-center gap-3">
									<div className={`flex size-10 items-center justify-center rounded-full ${note.iconClassName}`}>
										<note.icon className="size-4 fill-current" />
									</div>
									<div>
										<p className="font-[family:var(--font-cardo)] text-lg font-semibold">
											{note.title}
										</p>
										<p className="text-sm leading-6 text-muted-foreground">
											{note.description}
										</p>
									</div>
								</div>
							</div>
						))}
						<div className="rounded-[1.6rem] border border-dashed border-primary/30 bg-primary/5 p-5">
							<p className="font-[family:var(--font-alegreya-sc)] text-[0.68rem] tracking-[0.22em] text-primary uppercase">
								Design note
							</p>
							<p className="mt-2 text-sm leading-6 text-muted-foreground">
								The crimson and gold now work as rubric and illumination rather
								than glossy decoration, which gets much closer to aged vellum.
							</p>
						</div>
					</CardContent>
				</Card>
			</section>
		</div>
	)
}
