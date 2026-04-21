import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import {
	ArrowRight,
	BookOpen,
	Flame,
	Heart,
	LibraryBig,
	ScrollText,
	Sparkles,
	Stars,
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

export default async function Page({ params }: DashboardPageProps) {
	const { locale } = await params
	const session = await getServerSession(authOptions)

	if (!session) redirect(`/${locale}`)

	const learnerName = session.user.name?.split(' ')[0] ?? 'Student'

	return (
		<div className="space-y-6">
			<section className="tl-scroll-stage rounded-[2.4rem]">
				<div className="tl-scroll-body grid gap-8 px-6 py-8 md:grid-cols-[minmax(0,1.4fr)_21rem] md:px-10 md:py-10">
					<div className="space-y-6">
						<div className="space-y-3">
							<p className="tl-kicker">Student home</p>
							<h1 className="tl-heading max-w-2xl text-4xl leading-tight font-semibold text-balance md:text-5xl">
								Continue your study, {learnerName}.
							</h1>
							<p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
								TorahLev is shifting from a blank dashboard into a calmer
								sanctuary for scripture, repetition, and heart-led progress.
								Your next lesson and study rhythm now sit front and center.
							</p>
						</div>

						<div className="flex flex-wrap items-center gap-3">
							<Button
								asChild
								size="lg"
								className="h-12 rounded-full bg-primary px-6 text-primary-foreground hover:bg-primary/90"
							>
								<Link href={`/${locale}/courses`}>
									Resume lesson
									<ArrowRight className="size-4" />
								</Link>
							</Button>
							<Button
								asChild
								size="lg"
								variant="outline"
								className="h-12 rounded-full border-border/80 bg-background/70 px-6"
							>
								<Link href={`/${locale}/reader/hebrew`}>Open scripture reader</Link>
							</Button>
						</div>

						<div className="grid gap-3 sm:grid-cols-3">
							<div className="tl-scroll-card rounded-[1.4rem] p-4">
								<div className="flex items-center gap-2 text-primary">
									<Heart className="size-4 fill-current" />
									<span className="text-sm font-semibold">5 hearts</span>
								</div>
								<p className="mt-2 text-sm text-muted-foreground">
									Study vitality carried into today&apos;s practice.
								</p>
							</div>
							<div className="tl-scroll-card rounded-[1.4rem] p-4">
								<div className="flex items-center gap-2 text-primary">
									<Flame className="size-4" />
									<span className="text-sm font-semibold">12 day streak</span>
								</div>
								<p className="mt-2 text-sm text-muted-foreground">
									Steady rhythm is part of the design now, not an afterthought.
								</p>
							</div>
							<div className="tl-scroll-card rounded-[1.4rem] p-4">
								<div className="flex items-center gap-2 text-primary">
									<Stars className="size-4" />
									<span className="text-sm font-semibold">Lev Path</span>
								</div>
								<p className="mt-2 text-sm text-muted-foreground">
									Your current study lane stays visible and easy to resume.
								</p>
							</div>
						</div>
					</div>

					<div className="tl-scroll-card rounded-[1.85rem] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_12%,transparent),transparent)] p-5">
						<div className="space-y-5">
							<div className="flex items-center justify-between">
								<p className="tl-kicker">Current lesson</p>
								<div className="rounded-full border border-border/70 bg-background/82 px-3 py-1 text-xs font-semibold text-muted-foreground">
									Week 2
								</div>
							</div>
							<div className="space-y-2">
								<h2 className="tl-heading text-2xl font-semibold">
									Letters, sound, and first sacred words
								</h2>
								<p className="text-sm leading-6 text-muted-foreground">
									A softer lesson card like this gives the dashboard a clear
									center of gravity and mirrors the guided feeling you liked in
									IdiomGo.
								</p>
							</div>
							<div className="space-y-2">
								<div className="flex items-center justify-between text-sm">
									<span className="text-muted-foreground">Lesson progress</span>
									<span className="font-semibold">68%</span>
								</div>
								<Progress value={68} className="h-2.5 bg-primary/10" />
							</div>
							<div className="rounded-[1.4rem] border border-border/60 bg-background/82 p-4">
								<p className="text-sm font-semibold">Next step</p>
								<p className="mt-1 text-sm text-muted-foreground">
									Review consonants, then continue into your reading passage.
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
				<Card className="tl-panel rounded-[1.8rem] border-border/70 py-0">
					<CardHeader className="gap-3 px-6 pt-6">
						<p className="tl-kicker">Focus areas</p>
						<CardTitle className="tl-heading text-3xl font-semibold">
							What to touch next
						</CardTitle>
						<CardDescription className="max-w-2xl text-base leading-7">
							The home screen should gently route you into study instead of
							looking like an empty admin canvas.
						</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-4 px-6 pb-6 md:grid-cols-3">
						{focusCards.map((card) => (
							<div
								key={card.title}
								className="rounded-[1.5rem] border border-border/70 bg-background/82 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
							>
								<div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
									<card.icon className="size-5" />
								</div>
								<h3 className="tl-heading mt-4 text-2xl font-semibold">
									{card.title}
								</h3>
								<p className="mt-2 text-sm leading-6 text-muted-foreground">
									{card.description}
								</p>
								<Button
									asChild
									variant="ghost"
									className="mt-4 h-auto px-0 text-primary hover:bg-transparent hover:text-primary/80"
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

				<Card className="tl-panel rounded-[1.8rem] border-border/70 py-0">
					<CardHeader className="gap-3 px-6 pt-6">
						<p className="tl-kicker">Gentle gamification</p>
						<CardTitle className="tl-heading text-3xl font-semibold">
							Hearts with purpose
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4 px-6 pb-6">
						<div className="rounded-[1.4rem] border border-border/70 bg-background/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
							<div className="flex items-center gap-3">
								<div className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
									<Heart className="size-4 fill-current" />
								</div>
								<div>
									<p className="font-semibold">Heart vitality</p>
									<p className="text-sm text-muted-foreground">
										Track the energy you bring into practice.
									</p>
								</div>
							</div>
						</div>
						<div className="rounded-[1.4rem] border border-border/70 bg-background/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
							<div className="flex items-center gap-3">
								<div className="flex size-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
									<Sparkles className="size-4" />
								</div>
								<div>
									<p className="font-semibold">Daily blessing</p>
									<p className="text-sm text-muted-foreground">
										Offer a small ritualized reward when a study session is completed.
									</p>
								</div>
							</div>
						</div>
						<div className="rounded-[1.6rem] border border-dashed border-primary/30 bg-primary/5 p-5">
							<p className="text-sm font-semibold text-primary">
								Design note
							</p>
							<p className="mt-2 text-sm leading-6 text-muted-foreground">
								The heart motif now belongs to meaningful metrics, not generic
								decoration, which keeps the interface symbolic and restrained.
							</p>
						</div>
					</CardContent>
				</Card>
			</section>
		</div>
	)
}
