import Image from 'next/image'
import { FeedWrapper } from '@/components/feed-wrapper'
import { notFound } from 'next/navigation'
import { getHebrewStory } from '@/db/queries'
import HebrewStoryViewer from '@/components/hebrew/hebrew-story-viewer'

export default async function LessonScriptPage({ params }: any) {
	const { id } = await params
	const story = await getHebrewStory(Number(id))

	if (!story) return notFound()

	// console.log('HERE>>>>', story)

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/icons/iconStories.png"
						// src="/books-svgrepo-com.svg"
						alt="Story"
						height={48}
						width={48}
					/>
					<h1 className="text-center font-cardo text-neutral-800 text-6xl my-6">
						סִפּוּר
					</h1>
					<p className="text-center font-bold text-neutral-800 mb-2">Story</p>
				</div>
				<HebrewStoryViewer story={story} />
			</FeedWrapper>
		</div>
	)
}
