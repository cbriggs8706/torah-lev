import Image from 'next/image'
import { cn } from '@/lib/utils'

type Props = {
	value: number
	variant: 'points' | 'hearts' | 'tribe'
	tribePointAdded?: boolean // ✅ new prop
}

export const ResultCard = ({ value, variant, tribePointAdded }: Props) => {
	const imageSrc =
		variant === 'hearts'
			? '/icons/iconHeart.png'
			: variant === 'tribe'
				? '/trophy-svgrepo-com.svg'
				: '/icons/iconLightning.png'
	// const imageSrc = variant === 'hearts' ? '/heart.svg' : '/points.svg'

	return (
		<div
				className={cn(
					'rounded-2xl border-2 w-full',
					variant === 'tribe' && 'bg-amber-500 border-amber-500',
					variant === 'points' && 'bg-orange-400 border-orange-400',
					variant === 'hearts' && 'bg-rose-500 border-rose-500'
				)}
		>
			<div
				className={cn(
					'p-1.5 text-white rounded-t-xl font-bold text-center uppercase text-xs',
					variant === 'tribe' && 'bg-amber-500',
					variant === 'hearts' && 'bg-rose-500',
					variant === 'points' && 'bg-orange-400'
				)}
			>
				{variant === 'hearts'
					? 'Hearts Left'
					: variant === 'tribe'
						? 'Tribe Point'
						: 'Total XP'}
			</div>

			<div
				className={cn(
					'rounded-2xl bg-white items-center flex flex-col justify-center p-6 font-bold text-lg',
					variant === 'tribe' && 'text-amber-500',
					variant === 'hearts' && 'text-rose-500',
					variant === 'points' && 'text-orange-400'
				)}
			>
				<div className="flex items-center">
					<Image
						alt="Icon"
						src={imageSrc}
						height={30}
						width={30}
						className="mr-1.5"
					/>
					{value}
				</div>

				{tribePointAdded && variant === 'points' && (
					<span className="mt-2 text-green-600 text-sm font-semibold">
						+1 Tribe Point!
					</span>
				)}
			</div>
		</div>
	)
}
