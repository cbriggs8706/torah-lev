import Image from 'next/image'
import { redirect } from 'next/navigation'
import { FeedWrapper } from '@/components/feed-wrapper'
import bookList from '@/public/data/english/index.json'
import VerseSelector from '@/components/english/english-verse-selector'

const EnglishMemorizePage = async () => {
	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/brain-svgrepo-com.svg"
						alt="Memorize"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						Memorize
					</h1>
					{/* <DismissibleAlert storageKey="matchup" className="mb-4">
            {' '}
            Musics
          </DismissibleAlert> */}
				</div>
				<VerseSelector bookList={bookList} />
				<div className="space-y-4"></div>
			</FeedWrapper>
		</div>
	)
}

export default EnglishMemorizePage
