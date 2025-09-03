'use client'

import { toast } from 'sonner'
import Image from 'next/image'
import { useTransition } from 'react'

import { Button } from '@/components/ui/button'
import { POINTS_TO_REFILL } from '@/constants'
import { refillHearts } from '@/actions/user-progress'
import { createStripeUrl } from '@/actions/user-subscription'
import { exchangePointsForTribe } from '@/actions/user-progress'

type Props = {
	hearts: number
	points: number
	hasActiveSubscription: boolean
	hasTribe: boolean
	tribeImg?: string | null
}

export const Items = ({
	hearts,
	points,
	hasActiveSubscription,
	hasTribe,
	tribeImg,
}: Props) => {
	const [pending, startTransition] = useTransition()

	const onRefillHearts = () => {
		if (pending || hearts === 5 || points < POINTS_TO_REFILL) {
			return
		}

		startTransition(() => {
			refillHearts().catch(() => toast.error('Something went wrong'))
		})
	}

	const onUpgrade = () => {
		startTransition(() => {
			createStripeUrl()
				.then((response) => {
					if (response.data) {
						window.location.href = response.data
					}
				})
				.catch(() => toast.error('Something went wrong'))
		})
	}

	return (
		<ul className="w-full">
			<div className="flex items-center w-full p-4 gap-x-4 border-t-2">
				<Image src="/heart.svg" alt="Heart" height={60} width={60} />
				<div className="flex-1">
					<p className="text-neutral-700 text-base lg:text-xl font-bold">
						Refill hearts back to 5 (max)
					</p>
				</div>
				<Button
					onClick={onRefillHearts}
					disabled={pending || hearts === 5 || points < POINTS_TO_REFILL}
				>
					{hearts === 5 ? (
						'full'
					) : (
						<div className="flex items-center">
							<Image src="/points.svg" alt="Points" height={20} width={20} />
							<p>{POINTS_TO_REFILL}</p>
						</div>
					)}
				</Button>
			</div>
			{/* Exchange Tribe Points */}
			{hasTribe && (
				<div className="flex items-center w-full p-4 gap-x-4 border-t-2">
					<Image
						src={tribeImg || '/tribe-placeholder.svg'}
						alt="Tribe"
						height={60}
						width={60}
					/>
					<div className="flex-1">
						<p className="text-neutral-700 text-base lg:text-xl font-bold">
							Exchange 100 points for 1 Tribe Point
						</p>
					</div>
					<Button
						onClick={() =>
							startTransition(() => {
								exchangePointsForTribe()
									.then(() =>
										toast.success('Exchanged 100 points for 1 tribe point!')
									)
									.catch((err) =>
										toast.error(err.message || 'Something went wrong')
									)
							})
						}
						disabled={pending || points < 100}
					>
						<div className="flex items-center">
							<Image src="/points.svg" alt="Points" height={20} width={20} />
							<p>100</p>
						</div>
					</Button>
				</div>
			)}

			{/* <div className="flex items-center w-full p-4 pt-8 gap-x-4 border-t-2">
				<Image src="/unlimited.svg" alt="Unlimited" height={60} width={60} />
				<div className="flex-1">
					<p className="text-neutral-700 text-base lg:text-xl font-bold">
						Unlimited hearts
					</p>
				</div>
				<Button onClick={onUpgrade} disabled={pending}>
					{hasActiveSubscription ? 'settings' : 'upgrade'}
				</Button>
			</div> */}
		</ul>
	)
}
