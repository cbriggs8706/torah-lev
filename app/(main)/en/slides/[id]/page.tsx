import Image from 'next/image'
import { FeedWrapper } from '@/components/feed-wrapper'
import { notFound } from 'next/navigation'
import { getEnglishSlideDeck } from '@/db/queries'
import SlideDeckViewer from '@/components/english/english-slide-deck-viewer'

export const dynamic = 'force-dynamic' // 👈 ensures fresh fetch

export default async function EnglishSlideDeckPage({ params }: any) {
	const { id } = await params
	const slideDeck = await getEnglishSlideDeck(Number(id))

	if (!slideDeck) return notFound()

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/framed-picture-svgrepo-com.svg"
						alt="Slide Deck"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						Slide Deck
					</h1>
				</div>
				<SlideDeckViewer slideDeck={slideDeck} />
			</FeedWrapper>
		</div>
	)
}
