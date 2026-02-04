import Image from 'next/image'
import { FeedWrapper } from '@/components/feed-wrapper'
import { getSongsWithLines } from '@/db/queries'
import { notFound } from 'next/navigation'
import { HebrewMusicWithLines } from '@/db/types'
import MusicLinesTable from '@/components/hebrew/hebrew-music-lines-table'

export default async function MusicDetailPage({ params }: any) {
	const { id } = await params
	const songId = Number(id)
	if (isNaN(songId)) return notFound()

	const song: HebrewMusicWithLines | undefined = await getSongsWithLines(songId)
	if (!song) return notFound()

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/icons/iconMusic.png"
						// src="/musical-note-svgrepo-com.svg"
						alt="Music"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-cardo text-neutral-800 text-6xl my-6">
						שִׁיר{' '}
					</h1>
					<p className="text-center font-bold text-neutral-800 mb-2">Song</p>
					<h1 className="text-center font-bold text-neutral-800 text-2xl">
						{song.title}
					</h1>
				</div>

				{song.hebTitle && (
					<h2 className="text-center text-2xl font-hebrew mb-1">
						{song.hebTitle}
					</h2>
				)}
				{song.titleTransliteration && (
					<p className="text-center italic text-gray-600 mb-4">
						{song.titleTransliteration}
					</p>
				)}

				<MusicLinesTable
					lines={song.lines}
					audio={song.audio}
					video={song.video}
				/>
			</FeedWrapper>
		</div>
	)
}
