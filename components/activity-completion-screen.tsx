'use client'

import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useCelebration } from '@/hooks/useCelebration'
import { ActivityFinalScreen } from '@/components/activity-final-screen'
import { ResultCard } from '@/app/lesson/result-card'
import { Button } from '@/components/ui/button'

type ActivityCompletionScreenProps = {
	title: string
	description?: ReactNode
	rewardMessage?: ReactNode
	points: number
	hearts: number
	tribePointAwarded?: boolean
	showTribeBox?: boolean
	playCelebrationSound?: boolean
	leftActionLabel: string
	leftActionOnClick: () => void
	rightActionLabel: string
	rightActionOnClick: () => void
	className?: string
	cardClassName?: string
}

export function ActivityCompletionScreen({
	title,
	description,
	rewardMessage,
	points,
	hearts,
	tribePointAwarded = false,
	showTribeBox = true,
	playCelebrationSound = true,
	leftActionLabel,
	leftActionOnClick,
	rightActionLabel,
	rightActionOnClick,
	className,
	cardClassName,
}: ActivityCompletionScreenProps) {
	const { Confetti, celebrate } = useCelebration()
	const didCelebrateRef = useRef(false)

	useEffect(() => {
		if (didCelebrateRef.current) return
		didCelebrateRef.current = true
		celebrate({ playSound: playCelebrationSound })
	}, [celebrate, playCelebrationSound])

	return (
		<ActivityFinalScreen
			celebration={Confetti}
			title={title}
			description={description}
			className={className}
			cardClassName={cardClassName}
			rewards={
				<div className="mx-auto w-full max-w-4xl">
					{rewardMessage ? (
						<p className="mb-5 text-lg font-semibold text-slate-800">
							{rewardMessage}
						</p>
					) : null}

					<div className="grid gap-4 md:grid-cols-3">
						<ResultCard variant="points" value={points} />
						<ResultCard variant="hearts" value={hearts} />
						{showTribeBox ? (
							<ResultCard
								variant="tribe"
								value={tribePointAwarded ? 1 : 0}
							/>
						) : null}
					</div>
				</div>
			}
			actions={
				<div className="flex flex-col justify-center gap-3 sm:flex-row">
					<Button variant="secondaryOutline" onClick={leftActionOnClick}>
						{leftActionLabel}
					</Button>
					<Button onClick={rightActionOnClick}>{rightActionLabel}</Button>
				</div>
			}
		/>
	)
}
