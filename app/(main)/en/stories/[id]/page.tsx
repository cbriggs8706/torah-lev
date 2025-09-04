import Image from 'next/image'
import { FeedWrapper } from '@/components/feed-wrapper'
import { notFound } from 'next/navigation'
import { getEnglishStory } from '@/db/queries'
import EnglishStoryViewer from '@/components/english/english-story-viewer'

export default async function EnglishStoryPage({
	params,
}: {
	params: { id: string }
}) {
	const story = await getEnglishStory(Number(params.id))

	if (!story) return notFound()

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/books-svgrepo-com.svg"
						alt="Story"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						Story
					</h1>
				</div>
				<EnglishStoryViewer story={story} />
			</FeedWrapper>
		</div>
	)
}
