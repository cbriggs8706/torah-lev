import Link from 'next/link'
import {
	ArrowRight,
	BookOpen,
	Heart,
	LibraryBig,
	ScrollText,
	Sparkles,
	Star,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface CoursesPageProps {
	params: Promise<{ locale: string }>
}

const coursePaths = [
	{
		title: 'Aleph to Reading',
		descriptor: 'Foundational manuscript path',
		description:
			'Build script confidence, sound recognition, and early sacred vocabulary in a gentle sequence.',
		progress: 68,
		hearts: 5,
		lessons: 12,
		icon: ScrollText,
	},
	{
		title: 'Prayer Language',
		descriptor: 'Heart-centered phrasework',
		description:
			'Short lines for prayer and devotion, paced with repetition and memorable imagery.',
		progress: 34,
		hearts: 3,
		lessons: 7,
		icon: Heart,
	},
	{
		title: 'Scripture Immersion',
		descriptor: 'Context before complexity',
		description:
			'Move from isolated words into guided reading with more breathing room and clearer continuity.',
		progress: 22,
		hearts: 4,
		lessons: 9,
		icon: BookOpen,
	},
]

export default async function CoursesPage({ params }: CoursesPageProps) {
	const { locale } = await params

	return (
		<div className="space-y-6">
			<section className="tl-papyrus-scroll px-1 py-4">
				<div className="tl-papyrus-sheet px-5 py-7 md:px-8 md:py-8">
					<div className="tl-vellum-panel rounded-[2rem] px-6 py-6 md:px-8 md:py-7">
						<div className="grid gap-8 md:grid-cols-[minmax(0,1.35fr)_21rem]">
							<div className="space-y-5">
								<div className="space-y-3">
									<p className="font-nunito text-[1.35rem] leading-none text-[#6f5546] md:text-[1.5rem]">
										Course sanctuary
									</p>
									<h1 className="font-cardo max-w-3xl text-4xl leading-tight font-semibold text-[#2f1b12] md:text-5xl">
										Study paths that feel curated like a manuscript, not stacked like admin objects.
									</h1>
									<p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
										This page now treats courses as guided paths through sacred
										language. The structure stays minimal, but the surfaces,
										framing, and rhythm carry more Torah-scroll atmosphere.
									</p>
								</div>

								<div className="flex flex-wrap items-center gap-3">
									<Button
										asChild
										size="lg"
										className="h-12 rounded-full bg-primary px-6 text-primary-foreground hover:bg-primary/90"
									>
										<Link href={`/${locale}/dashboard`}>
											Return to study home
											<ArrowRight className="size-4" />
										</Link>
									</Button>
									<Button
										asChild
										size="lg"
										variant="outline"
										className="h-12 rounded-full border-border/80 bg-background/75 px-6"
									>
										<Link href={`/${locale}/reader/hebrew`}>Open reader</Link>
									</Button>
								</div>
							</div>

							<div className="rounded-[1.9rem] border border-border/70 bg-[rgba(255,249,236,0.72)] p-5">
								<div className="space-y-5">
									<div className="flex items-center justify-between">
										<p className="tl-kicker">Featured path</p>
										<div className="rounded-full border border-border/70 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
											Recommended
										</div>
									</div>
									<div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
										<LibraryBig className="size-5" />
									</div>
									<div className="space-y-2">
										<h2 className="tl-heading text-2xl font-semibold">
											Foundations of Biblical Hebrew
										</h2>
										<p className="text-sm leading-6 text-muted-foreground">
											A manuscript-style flagship card gives the page one ceremonial
											centerpiece while the rest of the layout stays clean.
										</p>
									</div>
									<div className="space-y-2">
										<div className="flex items-center justify-between text-sm">
											<span className="text-muted-foreground">Path completion</span>
											<span className="font-semibold">68%</span>
										</div>
										<Progress value={68} className="h-2.5 bg-primary/10" />
									</div>
									<div className="rounded-[1.4rem] border border-border/70 bg-background/84 p-4">
										<p className="font-semibold">Next lesson</p>
										<p className="mt-1 text-sm leading-6 text-muted-foreground">
											Letter families, vowel flow, and a first scripture phrase.
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			<div className="flex items-center justify-center py-2">
				<div className="tl-scroll-divider text-center text-xs uppercase tracking-[0.24em] text-muted-foreground">
					Study paths
				</div>
			</div>

			<section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
				<div className="grid gap-4">
					{coursePaths.map((course) => (
						<Card
							key={course.title}
							className="tl-panel rounded-[1.8rem] border-border/70 py-0"
						>
							<CardContent className="grid gap-5 px-6 py-6 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
								<div className="flex size-14 items-center justify-center rounded-[1.4rem] bg-primary/10 text-primary">
									<course.icon className="size-6" />
								</div>
								<div className="space-y-3">
									<div>
										<p className="tl-kicker text-[0.66rem]">{course.descriptor}</p>
										<h2 className="tl-heading mt-2 text-3xl font-semibold">
											{course.title}
										</h2>
									</div>
									<p className="max-w-2xl text-sm leading-6 text-muted-foreground">
										{course.description}
									</p>
									<div className="space-y-2">
										<div className="flex items-center justify-between text-sm">
											<span className="text-muted-foreground">Progress</span>
											<span className="font-semibold">{course.progress}%</span>
										</div>
										<Progress value={course.progress} className="h-2.5 bg-primary/10" />
									</div>
								</div>
								<div className="flex flex-col gap-3 md:items-end">
									<div className="flex gap-2">
										<div className="rounded-full border border-border/70 bg-background/80 px-3 py-1 text-sm font-semibold">
											{course.lessons} lessons
										</div>
										<div className="rounded-full border border-border/70 bg-background/80 px-3 py-1 text-sm font-semibold text-primary">
											{course.hearts} hearts
										</div>
									</div>
									<Button
										asChild
										className="h-11 rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90"
									>
										<Link href={`/${locale}/dashboard`}>
											Resume path
											<ArrowRight className="size-4" />
										</Link>
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				<div className="grid gap-4">
					<Card className="tl-panel rounded-[1.8rem] border-border/70 py-0">
						<CardHeader className="gap-3 px-6 pt-6">
							<p className="tl-kicker">Curator notes</p>
							<CardTitle className="tl-heading text-3xl font-semibold">
								Why this reads more like manuscript
							</CardTitle>
							<CardDescription className="text-base leading-7">
								The courses page now uses framed surfaces, softer parchment
								texture, and more ceremonial spacing so it feels collected and
								sacred instead of utilitarian.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4 px-6 pb-6">
							<div className="rounded-[1.4rem] border border-border/70 bg-background/82 p-4">
								<div className="flex items-start gap-3">
									<div className="mt-0.5 flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
										<Star className="size-4" />
									</div>
									<div>
										<p className="font-semibold">Featured path first</p>
										<p className="mt-1 text-sm leading-6 text-muted-foreground">
											One highlighted manuscript block creates a visual anchor
											before the course list begins.
										</p>
									</div>
								</div>
							</div>
							<div className="rounded-[1.4rem] border border-border/70 bg-background/82 p-4">
								<div className="flex items-start gap-3">
									<div className="mt-0.5 flex size-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
										<Sparkles className="size-4" />
									</div>
									<div>
										<p className="font-semibold">Texture without clutter</p>
										<p className="mt-1 text-sm leading-6 text-muted-foreground">
											The parchment treatment comes from layered gradients and
											fine grain, not loud assets or heavy illustrations.
										</p>
									</div>
								</div>
							</div>
							<div className="rounded-[1.5rem] border border-dashed border-primary/30 bg-primary/5 p-5">
								<p className="font-semibold text-primary">Next natural step</p>
								<p className="mt-2 text-sm leading-6 text-muted-foreground">
									Apply the same manuscript system to the reader and alphabet
									pages so the study journey feels cohesive.
								</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</section>
		</div>
	)
}
