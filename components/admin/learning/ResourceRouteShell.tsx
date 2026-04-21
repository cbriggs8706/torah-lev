import { LearningPageActions } from '@/components/admin/learning/LearningPageActions'

interface Props {
	title: string
	description: string
	backHref: string
	updateHref?: string
	deleteHref?: string
	deleteLabel?: string
}

export function ResourceRouteShell({
	title,
	description,
	backHref,
	updateHref,
	deleteHref,
	deleteLabel = title,
}: Props) {
	return (
		<div className="space-y-6">
			<div className="rounded-3xl border border-border/60 bg-gradient-to-br from-stone-50 via-background to-amber-50 p-6 shadow-sm">
				<p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
					Learning
				</p>
				<h1 className="mt-2 font-[family:var(--font-eczar)] text-4xl">
					{title}
				</h1>
				<p className="mt-3 max-w-2xl text-sm text-muted-foreground">
					{description}
				</p>
			</div>
			<LearningPageActions
				backHref={backHref}
				updateHref={updateHref}
				deleteHref={deleteHref}
				deleteLabel={deleteLabel}
			/>
		</div>
	)
}
