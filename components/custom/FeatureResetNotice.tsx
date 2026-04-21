import Link from 'next/link'
import { ArrowLeft, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FeatureResetNoticeProps {
	title: string
	description: string
	backHref?: string
	backLabel?: string
}

export function FeatureResetNotice({
	title,
	description,
	backHref,
	backLabel = 'Back',
}: FeatureResetNoticeProps) {
	return (
		<div className="rounded-3xl border border-dashed border-border/70 bg-muted/30 p-8">
			<div className="flex max-w-3xl flex-col gap-4">
				<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background shadow-sm">
					<RefreshCcw className="h-5 w-5" />
				</div>
				<div className="space-y-2">
					<p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
						Reset In Progress
					</p>
					<h1 className="font-[family:var(--font-eczar)] text-3xl text-balance">
						{title}
					</h1>
					<p className="max-w-2xl text-sm text-muted-foreground">
						{description}
					</p>
				</div>
				{backHref ? (
					<div>
						<Button asChild variant="outline">
							<Link href={backHref}>
								<ArrowLeft className="h-4 w-4" />
								{backLabel}
							</Link>
						</Button>
					</div>
				) : null}
			</div>
		</div>
	)
}
