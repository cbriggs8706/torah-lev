import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
	backHref: string
	backLabel?: string
	updateHref?: string
	deleteHref?: string
	deleteLabel?: string
}

export function LearningPageActions({
	backHref,
	backLabel = 'Back to list',
	updateHref,
	deleteHref,
	deleteLabel = 'item',
}: Props) {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Button asChild variant="outline">
				<Link href={backHref}>{backLabel}</Link>
			</Button>
			{updateHref ? (
				<Button asChild size="sm" variant="outline">
					<Link href={updateHref}>Update</Link>
				</Button>
			) : null}
			{deleteHref ? (
				<Button
					asChild
					size="icon"
					variant="destructive"
					className="h-8 w-8"
				>
					<Link
						href={deleteHref}
						aria-label={`Delete ${deleteLabel}`}
						title={`Delete ${deleteLabel}`}
					>
						<Trash2 className="h-4 w-4" />
						<span className="sr-only">Delete</span>
					</Link>
				</Button>
			) : null}
		</div>
	)
}
