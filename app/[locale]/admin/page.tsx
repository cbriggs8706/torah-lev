import Link from 'next/link'
import {
	BookOpenText,
	FolderKanban,
	GraduationCap,
	ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface AdminHomePageProps {
	params: Promise<{ locale: string }>
}

const adminSections = [
	{
		title: 'Media Library',
		description:
			'Upload public media, organize folders, manage tags, and prepare reusable assets for lessons.',
		href: 'media',
		icon: FolderKanban,
		badge: 'New',
	},
	{
		title: 'Courses',
		description:
			'Review the courses you lead, jump into course management, and keep the teaching side organized.',
		href: 'courses',
		icon: GraduationCap,
		badge: 'Core',
	},
	{
		title: 'Hebrew Ingest',
		description:
			'Ingest lesson script content and other Hebrew text workflows from the admin workspace.',
		href: 'hebrew-ingest',
		icon: BookOpenText,
		badge: 'Tools',
	},
]

export default async function AdminHomePage({
	params,
}: AdminHomePageProps) {
	const { locale } = await params

	return (
		<div className="space-y-6">
			<div className="rounded-3xl border border-border/60 bg-gradient-to-br from-stone-50 via-background to-amber-50 p-6 shadow-sm">
				<p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
					Admin
				</p>
				<h1 className="mt-2 font-[family:var(--font-eczar)] text-4xl text-balance">
					Teaching Workspace
				</h1>
				<p className="mt-3 max-w-3xl text-sm text-muted-foreground">
					This is the front door for the admin area. Jump into course setup,
					media management, and content tooling from one place instead of
					landing on a dead route.
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{adminSections.map((section) => {
					const Icon = section.icon

					return (
						<Card
							key={section.href}
							className="flex h-full flex-col border-border/60"
						>
							<CardHeader className="space-y-4">
								<div className="flex items-start justify-between gap-3">
									<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
										<Icon className="h-5 w-5" />
									</div>
									<Badge variant="secondary">{section.badge}</Badge>
								</div>
								<div className="space-y-2">
									<CardTitle>{section.title}</CardTitle>
									<p className="text-sm text-muted-foreground">
										{section.description}
									</p>
								</div>
							</CardHeader>
							<CardContent className="mt-auto">
								<Button asChild className="w-full justify-between">
									<Link href={`/${locale}/admin/${section.href}`}>
										Open {section.title}
										<ArrowRight className="h-4 w-4" />
									</Link>
								</Button>
							</CardContent>
						</Card>
					)
				})}
			</div>
		</div>
	)
}
