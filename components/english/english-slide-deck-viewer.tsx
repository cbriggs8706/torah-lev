'use client'

import { useRouter } from 'next/navigation'
import { Button } from '../ui/button'

type SlideDeck = {
	id: number
	googleUrl: string | null
	lessonId: string | null
}

export default function SlideDeckViewer({
	slideDeck,
}: {
	slideDeck: SlideDeck
}) {
	const router = useRouter()

	// Convert the normal share URL into an embeddable version if needed
	const embedUrl = slideDeck.googleUrl
		? slideDeck.googleUrl
				.replace('/edit', '/preview')
				.replace('/view', '/preview')
		: null

	return (
		<div className="flex flex-col w-full h-[calc(100vh-4rem)]">
			{/* Back Button */}
			<div className="p-4 flex justify-center">
				<Button
					variant="default"
					onClick={() => {
						router.push('/en/slides')
						router.refresh()
					}}
				>
					Back to Slide Deck List
				</Button>
			</div>

			{/* Slide Deck */}
			<div className="flex-1 flex justify-center items-center bg-black">
				{embedUrl ? (
					<iframe
						src={embedUrl}
						title="Google Slide Deck"
						className="w-full h-full border-0"
						allowFullScreen
					/>
				) : (
					<p className="text-white text-lg">
						No slide deck available for this lesson.
					</p>
				)}
			</div>
		</div>
	)
}
