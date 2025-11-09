import Image from 'next/image'
import { redirect } from 'next/navigation'
import { FeedWrapper } from '@/components/feed-wrapper'
import bookList from '@/public/data/hebrew/index.json'
import HebrewVerseSelector from '@/components/hebrew/hebrew-verse-selector'

const HebrewMemorizePage = async () => {
	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/icons/iconBrain.png"
						alt="Memorize"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-cardo text-neutral-800 text-6xl my-6">
						זָכַר
					</h1>
					<p className="text-center font-bold text-neutral-800 mb-2">
						Memorize
					</p>
					{/* <DismissibleAlert storageKey="matchup" className="mb-4">
            {' '}
            Musics
          </DismissibleAlert> */}
				</div>
				<HebrewVerseSelector bookList={bookList} />
				<div className="space-y-4"></div>
			</FeedWrapper>
		</div>
	)
}

export default HebrewMemorizePage
