import Image from 'next/image'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
	title: string
	id: number
	imageSrc: string
	proficiencyLevel: string | null
	endingProficiencyLevel?: string | null
	onClick: (id: number) => void
	disabled?: boolean
	active?: boolean
}

const levelColors: Record<string, string> = {
	Pre: 'bg-red-600',
	A1: 'bg-orange-600',
	A2: 'bg-yellow-600',
	B1: 'bg-green-600',
	B2: 'bg-sky-600',
	C1: 'bg-indigo-600',
	C2: 'bg-purple-600',
}

export const Card = ({
	title,
	id,
	imageSrc,
	proficiencyLevel,
	endingProficiencyLevel,
	disabled,
	onClick,
	active,
}: Props) => {
	const startColor = proficiencyLevel ? levelColors[proficiencyLevel] : ''
	const endColor = endingProficiencyLevel
		? levelColors[endingProficiencyLevel]
		: ''

	return (
		<div
			onClick={() => onClick(id)}
			className={cn(
				'relative h-full border-2 rounded-xl border-b-4 hover:bg-black/5 cursor-pointer active:border-b-2 flex flex-col items-center justify-between p-3 pb-6 min-h-[217px] min-w-[200px]',
				disabled && 'pointer-events-none opacity-50'
			)}
		>
			{/* Colored dots with text */}
			<div className="absolute top-2 left-2 flex gap-1">
				{proficiencyLevel && (
					<div
						className={cn(
							'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white',
							startColor
						)}
					>
						{proficiencyLevel}
					</div>
				)}
				{proficiencyLevel && endingProficiencyLevel && <span>→</span>}
				{endingProficiencyLevel && (
					<div
						className={cn(
							'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white',
							endColor
						)}
					>
						{endingProficiencyLevel}
					</div>
				)}
			</div>

			<div className="min-[24px] w-full flex items-center justify-end">
				{active && (
					<div className="rounded-md bg-sky-600 flex items-center justify-center p-1.5">
						<Check className="text-white stroke-[4] h-4 w-4" />
					</div>
				)}
			</div>
			<Image
				src={imageSrc}
				alt={title}
				height={70}
				width={93.33}
				className="rounded-lg drop-shadow-md border object-cover"
			/>
			<p className="text-neutral-700 text-center font-bold mt-3">{title}</p>
		</div>
	)
}
