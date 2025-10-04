import Image from 'next/image'
import { useCallback } from 'react'
import { useAudio, useKey } from 'react-use'

import { cn } from '@/lib/utils'
import { challenges } from '@/db/schema'

type Props = {
	id: number
	imageSrc: string | null
	audioSrc: string | null
	hebNiqqud: string | null
	shortcut: string
	selected?: boolean
	onClick: () => void
	disabled?: boolean
	status?: 'correct' | 'wrong' | 'none'
	type: (typeof challenges.$inferSelect)['type']
}

export const Card = ({
	id,
	imageSrc,
	audioSrc,
	hebNiqqud,
	shortcut,
	selected,
	onClick,
	status,
	disabled,
	type,
}: Props) => {
	const [audioElement, , controls] = useAudio({
		src: audioSrc ?? '',
		autoPlay: false,
	})
	// 🔊 Central handler that plays audio and calls onClick
	const playAndSelect = useCallback(() => {
		if (disabled) return
		if (audioSrc) controls.play()
		onClick()
	}, [disabled, onClick, controls, audioSrc])

	useKey(shortcut, playAndSelect, {}, [playAndSelect])

	const showText = type === 'AUDIO-TEXT' || type === 'VISUAL-TEXT'
	const showAudio = !!audioSrc
	const showImage = !!imageSrc

	return (
		<div
			onClick={playAndSelect}
			className={cn(
				'h-full border-2 rounded-xl border-b-4 hover:bg-black/5 p-4 lg:p-6 cursor-pointer active:border-b-2',
				selected && 'border-sky-300 bg-sky-100 hover:bg-sky-100',
				selected &&
					status === 'correct' &&
					'border-green-300 bg-green-100 hover:bg-green-100',
				selected &&
					status === 'wrong' &&
					'border-rose-300 bg-rose-100 hover:bg-rose-100',
				disabled && 'pointer-events-none hover:bg-white',
				type === 'ASSIST' && 'lg:p-3 w-full'
			)}
		>
			{/* Ensure audio element is rendered */}
			{audioSrc && audioElement}

			{/* Image */}
			{showImage && (
				<div className="relative aspect-[4/3] mb-4 w-full">
					<Image
						src={imageSrc!}
						alt={hebNiqqud || ''}
						fill
						sizes="(max-width: 768px) 100vw, 25vw"
						className="object-contain"
					/>
				</div>
			)}

			{/* Speaker icon */}
			{showAudio && (
				<div className="mb-2">
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation() // prevent bubbling to card
							controls.play()
						}}
						aria-label="Play audio"
						className="text-xl text-sky-600 hover:text-sky-800"
					>
						🔊
					</button>
				</div>
			)}

			{/* Text */}
			{showText && (
				<p
					className={cn(
						'text-neutral-600 text-4xl font-serif',
						selected && 'text-sky-600',
						selected && status === 'correct' && 'text-green-500',
						selected && status === 'wrong' && 'text-rose-500'
					)}
				>
					{hebNiqqud}
				</p>
			)}

			{/* Shortcut key */}
			<div
				className={cn(
					'lg:w-[30px] lg:h-[30px] w-[20px] h-[20px] border-2 flex items-center justify-center rounded-lg text-neutral-400 lg:text-[15px] text-xs font-semibold mt-2',
					selected && 'border-sky-300 text-sky-600',
					selected && status === 'correct' && 'border-green-500 text-green-500',
					selected && status === 'wrong' && 'border-rose-500 text-rose-500'
				)}
			>
				{shortcut}
			</div>
		</div>
	)
}
