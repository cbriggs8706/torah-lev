import Image from 'next/image'
import { FeedWrapper } from '@/components/feed-wrapper'
import { getAllSongsWithLines, getUserProgress } from '@/db/queries'
import MusicList from '@/components/hebrew/hebrew-music-list'

const HebrewMusicPage = async () => {
	const [songs, userProgress] = await Promise.all([
		getAllSongsWithLines(),
		getUserProgress(),
	])

	const isHebrewFriend = !!userProgress?.isHebrewFriend

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/musical-note-svgrepo-com.svg"
						alt="Music"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						Music
					</h1>
					{/* <DismissibleAlert storageKey="matchup" className="mb-4">
            {' '}
            Musics
          </DismissibleAlert> */}
				</div>
				<div className="space-y-4">
					<MusicList songs={songs} isFriend={isHebrewFriend} />
				</div>
			</FeedWrapper>
		</div>
	)
}

export default HebrewMusicPage
