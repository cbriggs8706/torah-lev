import Link from 'next/link'
import { ChevronDown, ChevronUp, NotebookText } from 'lucide-react'

import { Button } from '@/components/ui/button'

type Props = {
	title: string
	description: string
	isCollapsed: boolean
	isCompleted: boolean
	onToggle: () => void
}

export const HebrewUnitBanner = ({
	title,
	description,
	isCollapsed,
	isCompleted,
	onToggle,
}: Props) => {
	return (
		<div
			className={`flex w-full flex-col items-start gap-4 rounded-xl bg-sky-600 text-white sm:flex-row sm:items-center sm:justify-between ${
				isCollapsed ? 'mb-6 px-4 py-4 sm:px-5' : 'px-4 py-5 sm:p-5'
			}`}
		>
			<div className="min-w-0 space-y-2 sm:max-w-[65%]">
				<h3 className="break-words text-lg font-bold leading-tight sm:text-2xl">
					{title}
				</h3>
				{!isCollapsed ? (
					<p className="text-base leading-relaxed sm:text-lg">{description}</p>
				) : null}
				{isCompleted && !isCollapsed ? (
					<p className="text-sm font-semibold text-sky-100">
						All lessons completed
					</p>
				) : null}
			</div>
			<div className="flex w-full items-center gap-3 sm:w-auto">
				<Button
					type="button"
					size="lg"
					variant="secondary"
					className="w-full border-2 border-b-4 px-4 text-sm uppercase tracking-wide active:border-b-2 sm:w-auto"
					onClick={onToggle}
				>
					{isCollapsed ? (
						<>
							<ChevronDown className="mr-2 h-5 w-5" />
							Show lessons
						</>
					) : (
						<>
							<ChevronUp className="mr-2 h-5 w-5" />
							Hide lessons
						</>
					)}
				</Button>
				<Link href="/lesson">
					<Button
						size="lg"
						variant="secondary"
						className="hidden xl:flex border-2 border-b-4 active:border-b-2"
					>
						<NotebookText className="mr-2" />
						Continue
					</Button>
				</Link>
			</div>
		</div>
	)
}
