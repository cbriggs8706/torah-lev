import Link from 'next/link'
import { BookOpenText, FolderKanban, Network, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface AdminHomePageProps {
	params: Promise<{ locale: string }>
}

const adminSections = [
	{
		title: 'Learning Model',
		description:
			'Create organizations, target languages, courses, lessons, and long-lived study groups from one workspace.',
		href: 'learning',
		icon: Network,
		badge: 'Core',
	},
	{
		title: 'Media Library',
		description:
			'Upload public media, organize folders, manage tags, and keep reusable assets organized.',
		href: 'media',
		icon: FolderKanban,
		badge: 'New',
	},
	{
		title: 'Hebrew Ingest',
		description:
			'Ingest custom Hebrew text and related content workflows from the admin workspace.',
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
			<div className="tl-panel rounded-[2rem] p-6 md:p-8">
				<p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
					Admin
				</p>
				<h1 className="mt-2 font-[family:var(--font-eczar)] text-4xl text-balance">
					Teaching Workspace
				</h1>
				<p className="mt-3 max-w-3xl text-sm text-muted-foreground">
					This is the front door for the admin area. The old course and lesson
					system has been intentionally removed so the teaching model can be
					rebuilt from scratch.
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{adminSections.map((section) => {
					const Icon = section.icon

					return (
						<Card
							key={section.href}
							className="tl-panel flex h-full flex-col border-border/60"
						>
							<CardHeader className="space-y-4">
								<div className="flex items-start justify-between gap-3">
									<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#c6a15b]/20 text-[#8f2230]">
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
