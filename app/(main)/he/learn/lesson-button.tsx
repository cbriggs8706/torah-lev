'use client'

import { useRouter } from 'next/navigation'
import { Check, Star, LockKeyhole } from 'lucide-react'
import { CircularProgressbarWithChildren } from 'react-circular-progressbar'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import 'react-circular-progressbar/dist/styles.css'
import { format } from 'date-fns'
import type { SidebarLocale } from '@/types/sidebar'

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
	reviewDate?: Date | null
	lessonNumber: string
	courseId?: number // ✅ optional, defaults to Hebrew
	startLabel?: string
	startLocale?: SidebarLocale
}

export const HebrewLessonButton = ({
	id,
	title,
	index,
	totalCount,
	locked,
	completed,
	current,
	percentage,
	targetDate,
	reviewDate,
	lessonNumber,
	courseId = 6, // ✅ default Hebrew
	startLabel = 'החל',
	startLocale = 'he',
}: Props) => {
	const router = useRouter()

	const handleClick = (e: React.MouseEvent) => {
		if (locked) return e.preventDefault()

		try {
			localStorage.setItem(
				'userProgress',
				JSON.stringify({
					activeCourseId: courseId,
					activeLessonId: id,
					lastSeen: new Date().toISOString(),
				})
			)
			console.log('✅ Saved userProgress:', { courseId, id })
		} catch (err) {
			console.error('❌ Failed to save userProgress:', err)
		}

		router.push(`/lesson/${id}`)
	}

	const isCompleted = !current && completed
	const isIncompleted = !current && !completed

	let Icon
	if (current) Icon = Star
	else if (isCompleted) Icon = Check
	else Icon = LockKeyhole

	const rawDate = reviewDate ?? targetDate ?? null
	const dateObj = rawDate ?? null
	const dateLabel =
		dateObj && !isNaN(+dateObj) ? format(dateObj, 'MMM d') : null

	return (
		<div
			onClick={handleClick}
			className={cn(
				'cursor-pointer relative flex flex-col items-center transition-transform active:scale-95'
			)}
		>
			{/* Floating start banner */}
			{current && (
				<div
					className={cn(
						'absolute -top-6 inset-x-0 mx-auto w-fit rounded-xl border-2 bg-white px-3 py-2.5 text-sky-600 animate-bounce z-20',
						startLocale === 'he'
							? 'font-cardo text-3xl uppercase tracking-wide'
							: 'font-nunito text-md font-bold uppercase tracking-wide'
					)}
				>
					{startLabel}
					<div className="absolute left-1/2 -bottom-2 w-0 h-0 border-x-8 border-x-transparent border-t-8 transform -translate-x-1/2" />
				</div>
			)}

			{/* Main card */}
			<div
				className={cn(
					'flex flex-col rounded-xl border border-gray-00 w-[120px] min-h-[220px] transition hover:shadow-md text-center overflow-hidden',
					current ? 'bg-sky-100' : 'bg-white'
				)}
			>
				<div className="flex flex-col items-center flex-grow p-4">
					{/* ICON AREA */}
					<div className="flex flex-col items-center">
						{current ? (
							<CircularProgressbarWithChildren
								value={Number.isNaN(percentage) ? 0 : percentage}
								styles={{
									path: { stroke: '#16a34a' },
									trail: { stroke: '#e5e7eb' },
								}}
							>
								<Button
									size="rounded"
									variant="secondary"
									className="h-[70px] w-[70px] border-b-8"
								>
									<Icon className="h-10 w-10 text-primary-foreground fill-white" />
								</Button>
							</CircularProgressbarWithChildren>
						) : (
							<Button
								size="rounded"
								variant={completed ? 'secondary' : 'locked'}
								className="h-[70px] w-[70px] border-b-8"
							>
								<Icon
									className={cn(
										'h-10 w-10',
										isIncompleted
											? 'stroke-neutral-400 stroke-[2.5]'
											: 'fill-primary-foreground text-primary-foreground',
										isCompleted && 'fill-none stroke-[4]'
									)}
								/>
							</Button>
						)}
					</div>

					{/* LESSON NUMBER */}
					<div
						dir="rtl"
						className="flex items-baseline gap-1 mt-1 text-gray-800"
					>
						<span className="text-xl font-cardo">שיעור</span>
						<span className="text-md font-nunito font-semibold">
							{lessonNumber}
						</span>
					</div>

					{/* TITLE */}
					<span
						className="text-xs font-nunito font-semibold mt-1 leading-tight"
						dir="ltr"
					>
						{title}
					</span>
				</div>

				{/* DATE */}
				{dateLabel ? (
					<div
						className="w-full bg-green-600 text-white text-xs font-semibold text-center py-2 rounded-b-xl"
						title={format(dateObj!, 'PPP')}
					>
						Goal: {dateLabel}
					</div>
				) : isCompleted ? (
					<div className="w-full bg-sky-600 text-white text-xs font-semibold text-center py-2 rounded-b-xl">
						Review Lesson
					</div>
				) : (
					<div className="w-full bg-gray-400 text-white text-xs font-semibold text-center py-2 rounded-b-xl">
						Jump Ahead
					</div>
				)}
			</div>
		</div>
	)
}
