'use client'

import Link from 'next/link'
import { Check, Crown, Star } from 'lucide-react'
import { CircularProgressbarWithChildren } from 'react-circular-progressbar'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

import 'react-circular-progressbar/dist/styles.css'
import { format } from 'date-fns'

type Props = {
	id: number
	title: string
	index: number
	totalCount: number
	locked?: boolean
	completed?: boolean
	current?: boolean
	percentage: number
	targetDate?: Date | null
}

export const LessonButton = ({
	id,
	title,
	index,
	totalCount,
	locked,
	completed,
	current,
	percentage,
	targetDate,
}: Props) => {
	// const lessonNumber = title.match(/AwB (\d+)/)?.[1] ?? '?'
	const match = title.match(/AwB(?: Classroom Lesson)? (\d+)/)
	const lessonNumber = match ? match[1] : '?'
	const cycleLength = 8
	const cycleIndex = index % cycleLength

	let indentationLevel

	if (cycleIndex <= 2) {
		indentationLevel = cycleIndex
	} else if (cycleIndex <= 4) {
		indentationLevel = 4 - cycleIndex
	} else if (cycleIndex <= 6) {
		indentationLevel = 4 - cycleIndex
	} else {
		indentationLevel = cycleIndex - 8
	}

	const rightPosition = indentationLevel * 40

	const isFirst = index === 0
	const isLast = index === totalCount
	const isCompleted = !current
	// const isCompleted = !current && !locked

	const Icon = isCompleted ? Check : isLast ? Crown : Star

	const href = isCompleted ? `/lesson/${id}` : '/lesson'

	return (
		<Link
			href={href}
			aria-disabled={locked}
			style={{ pointerEvents: locked ? 'none' : 'auto' }}
		>
			<div
				className="relative"
				style={{
					right: `${rightPosition}px`,
					marginTop: isFirst && !isCompleted ? 60 : 24,
				}}
			>
				{current ? (
					<div className="h-[102px] w-[102px] relative">
						<div className="absolute -top-6 left-2.5 px-3 py-2.5 border-2 font-bold uppercase text-sky-500 bg-white rounded-xl animate-bounce tracking-wide z-10">
							Start
							<div className="absolute left-1/2 -bottom-2 w-0 h-0 border-x-8 border-x-transparent border-t-8 transform -translate-x-1/2" />
						</div>
						<CircularProgressbarWithChildren
							value={Number.isNaN(percentage) ? 0 : percentage}
							styles={{
								path: {
									stroke: '#4ade80',
								},
								trail: {
									stroke: '#e5e7eb',
								},
							}}
						>
							<Button
								size="rounded"
								variant={locked ? 'locked' : 'secondary'}
								className="h-[70px] w-[70px] border-b-8"
							>
								<Icon
									className={cn(
										'h-10 w-10',
										locked
											? 'fill-neutral-400 text-neutral-400 stroke-neutral-400'
											: 'fill-primary-foreground text-primary-foreground',
										isCompleted && 'fill-none stroke-[4]'
									)}
								/>
							</Button>
						</CircularProgressbarWithChildren>
					</div>
				) : (
					<Button
						size="rounded"
						variant={completed ? 'secondary' : 'locked'}
						className="h-[70px] w-[70px] border-b-8"
					>
						{/* <Icon
							className={cn(
								'h-10 w-10',
								locked
									? 'fill-neutral-400 text-neutral-400 stroke-neutral-400'
									: 'fill-primary-foreground text-primary-foreground',
								isCompleted && 'fill-none stroke-[4]'
							)}
						/> */}
						<span
							className={cn(
								'text-2xl font-bold',
								locked ? 'text-neutral-400' : 'text-primary-foreground'
							)}
						>
							{lessonNumber}
						</span>
					</Button>
				)}
				{/* ✅ Display target date */}
				{targetDate && (
					<span className="text-lg text-muted-foreground mt-1 ml-2">
						{format(targetDate, 'MMM d')}
					</span>
				)}
			</div>
		</Link>
	)
}
