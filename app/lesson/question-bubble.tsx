import Image from 'next/image'
import { useAudio } from 'react-use'

type Props = {
	question: string | null
	// question: string
}

export const QuestionBubble = ({ question }: Props) => {
	const [audio, state, controls] = useAudio({
		src: question || '',
		autoPlay: true,
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
			<div className="relative py-2 px-4 border-2 rounded-xl text-sm lg:text-base">
				{/* TODO reverse all of this and only display question to revert */}
				{audio}
				<button
					onClick={controls.play}
					className="text-xl text-blue-600 hover:text-blue-800"
					aria-label="Play audio"
				>
					🔊
				</button>
				{/* {question} */}
				<div className="absolute -left-3 top-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 transform -translate-y-1/2 rotate-90" />
			</div>
		</div>
	)
}
