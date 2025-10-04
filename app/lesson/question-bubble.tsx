import Image from 'next/image'
import { useAudio } from 'react-use'

type QuestionSource =
	| { type: 'audio'; src: string }
	| { type: 'image'; src: string }
	| { type: 'hebNiqqud'; content: string }

type Props = {
	// question: QuestionSource | null
	audio: string | null
	image: string | null
	hebNiqqud: string | null
}

export const QuestionBubble = ({ audio, image, hebNiqqud }: Props) => {
	const [audioElement, , controls] = useAudio({
		src: audio || '',
		autoPlay: !!audio,
	})

	return (
		<div className="flex items-center gap-x-4 mb-6">
			<Image
				src="/mascot.svg"
				alt="Mascot"
				height={60}
				width={60}
				className="hidden lg:block"
			/>
			<Image
				src="/mascot.svg"
				alt="Mascot"
				height={40}
				width={40}
				className="block lg:hidden"
			/>
			<div className="relative py-2 px-4 border-2 rounded-xl text-sm lg:text-base max-w-[300px] lg:max-w-[600px]">
				{audio && (
					<>
						{audioElement}
						<button
							onClick={controls.play}
							className="text-xl text-sky-600 hover:text-sky-800"
							aria-label="Play audio"
						>
							🔊
						</button>
					</>
				)}
				{image && (
					<Image
						src={image}
						alt="Question"
						width={200}
						height={200}
						className="rounded-md"
					/>
				)}
				{hebNiqqud && (
					<p className="whitespace-pre-wrap text-4xl font-serif">{hebNiqqud}</p>
				)}

				<div className="absolute -left-3 top-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 transform -translate-y-1/2 rotate-90" />
			</div>
		</div>
	)
}
