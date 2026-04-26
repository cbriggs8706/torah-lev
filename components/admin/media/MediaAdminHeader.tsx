import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface ActionLink {
	href: string
	label: string
	variant?: 'default' | 'outline' | 'secondary'
}

interface Props {
	eyebrow?: string
	title: string
	description: string
	actions?: ActionLink[]
}

export function MediaAdminHeader({
	eyebrow = 'Media Library',
	title,
	description,
	actions = [],
}: Props) {
	return (
		<section className="tl-papyrus-scroll px-1 py-4">
			<div className="tl-papyrus-sheet px-5 py-7 md:px-8 md:py-8">
				<div className="tl-vellum-panel rounded-[2rem] px-6 py-6 md:px-8 md:py-7">
					<div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
						<div className="space-y-3">
							<p className="text-[1rem] uppercase tracking-[0.22em] text-[#8c6a57]">
								{eyebrow}
							</p>
							<h1 className="font-cardo text-[2.4rem] leading-none font-semibold text-[#2f1b12] md:text-[3.35rem]">
								{title}
							</h1>
							<p className="max-w-3xl text-[1.12rem] leading-8 text-[#7a5a4a] md:text-[1.22rem]">
								{description}
							</p>
						</div>
						{actions.length > 0 ? (
							<div className="flex flex-wrap gap-2 md:justify-end">
								{actions.map((action) => (
									<Button
										key={action.href}
										asChild
										variant={action.variant ?? 'outline'}
										className={
											action.variant === 'default'
												? 'h-11 rounded-full px-5 text-base'
												: 'h-11 rounded-full border-border/70 bg-background/80 px-5 text-base'
										}
									>
										<Link href={action.href}>{action.label}</Link>
									</Button>
								))}
							</div>
						) : null}
					</div>
				</div>
			</div>
		</section>
	)
}
