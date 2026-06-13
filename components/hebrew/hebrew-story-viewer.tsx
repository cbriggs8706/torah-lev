'use client'

import { useMemo, useState } from 'react'
import { Button } from '../ui/button'
import { useRouter } from 'next/navigation'
import AudioPlayer from '@/components/media/audio-player'
import { isSpotifyUrl } from '@/components/media/audio-utils'
import Image from 'next/image'

const hebrewFonts = [
	{ label: 'Arial', value: 'font-arial' },
	{ label: 'Times', value: 'font-serif' },
	{ label: 'Frank Ruhl Libre', value: 'font-frank' },
	{ label: 'Sans', value: 'font-sans' },
	{ label: 'Tinos', value: 'font-tinos' },
	{ label: 'Nunito', value: 'font-nunito' },
	{ label: 'Cardo', value: 'font-cardo' },
	{ label: 'Rashi', value: 'font-rashi' },
	{ label: 'Suez', value: 'font-suez' },
]

type HebrewStory = {
	id: number
	title: string
	hebTitle: string | null
	titleTransliteration: string | null
	video: string | null
	image: string | null
	content: string | null
	contentPlain: string | null
	audio: string | null
	lessonId: number | null
	courseId: number[] | null
	category: string
	public: boolean
	scriptureBook?: string | null
	scriptureChapter?: number | null
	scriptureVerses?: string | null
}

type Story = {
	story: HebrewStory
	backHref?: string
	backLabel?: string
}

function toYouTubeEmbedUrl(videoUrl: string) {
	try {
		const url = new URL(videoUrl)
		const videoId =
			url.hostname === 'youtu.be'
				? url.pathname.slice(1)
				: url.pathname.startsWith('/embed/')
					? url.pathname.split('/')[2]
					: url.searchParams.get('v')

		if (!videoId) return videoUrl

		const start =
			url.searchParams.get('start') ??
			url.searchParams.get('t')?.replace(/s$/, '')
		const embedUrl = new URL(`https://www.youtube.com/embed/${videoId}`)
		if (start) embedUrl.searchParams.set('start', start)
		return embedUrl.toString()
	} catch {
		return videoUrl
			.replace('youtu.be/', 'www.youtube.com/embed/')
			.replace('watch?v=', 'embed/')
			.split('?')[0]
	}
}

export default function HebrewStoryViewer({
	story,
	backHref = '/he/stories',
	backLabel = 'Back to Story List',
}: Story) {
	// export default function HebrewStoryViewer({ story }: { story: Story }) {
	const [fontClass, setFontClass] = useState('font-serif')
	const [fontSize, setFontSize] = useState(36)
	const [mediaType, setMediaType] = useState<'video' | 'audio'>('video') // Default to audio

	const router = useRouter()

	const audioIsSpotify = useMemo(
		() => isSpotifyUrl(story.audio),
		[story.audio]
	)
	const audioSrcClean = useMemo(() => {
		const a = story.audio
		if (!a) return null
		try {
			const u = new URL(a)
			u.search = ''
			return u.toString()
		} catch {
			return a
		}
	}, [story.audio])

	// Handle font change from dropdown
	const handleFontChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		setFontClass(event.target.value)
	}

	// Increment font size
	const handleIncreaseFontSize = () => {
		setFontSize((prevSize) => prevSize + 2)
	}

	// Decrement font size with minimum limit of 12px
	const handleDecreaseFontSize = () => {
		setFontSize((prevSize) => Math.max(12, prevSize - 2))
	}

	return (
		<div className="w-full space-y-4">
			<h2 className="text-4xl font-bold text-center">{story.title}</h2>
			{story.image && (
				<div className="flex justify-center">
					<Image
						src={story.image}
						alt={`${story.title} thumbnail`}
						width={300} // scale down: adjust as needed
						height={0} // height auto (ignored when fill not used)
						className="h-auto w-auto max-w-full rounded-md border shadow"
					/>
				</div>
			)}

			{/* Toggle Buttons */}
			<div className="flex flex-wrap gap-4 mb-4 justify-center">
				<Button
					onClick={() => setMediaType('video')}
					disabled={!story.video}
				>
					Video
				</Button>
				<Button
					onClick={() => setMediaType('audio')}
					disabled={!story.audio}
				>
					Audio
				</Button>
				<Button
					variant={'default'}
					onClick={() => {
						router.push(backHref)
						router.refresh() // revalidate the next route after the push
					}}
				>
					{backLabel}
				</Button>
			</div>
			{/* Media block */}
			<div className="flex flex-col gap-4 mb-8">
				{mediaType === 'video' && story.video && (
					<div className="relative w-full" style={{ paddingTop: '56.25%' }}>
						<iframe
							className="absolute inset-0 w-full h-full rounded-md"
							src={toYouTubeEmbedUrl(story.video)}
							title="YouTube video player"
							frameBorder={0}
							allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
							allowFullScreen
						/>
					</div>
				)}

				{mediaType === 'audio' &&
					story.audio &&
					(audioIsSpotify ? (
						<iframe
							className="w-full rounded-md"
							src={audioSrcClean || undefined}
							height={152}
							frameBorder={0}
							allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
							loading="lazy"
						/>
					) : (
						<AudioPlayer
							src={audioSrcClean!}
							skipSeconds={10}
							defaultRate={1}
							defaultVolume={1}
							startTime={0}
							label={`Audio for ${story.title}`}
							onEnded={() => {
								/* optional: mark complete */
							}}
						/>
					))}
			</div>
			{/* Font Selector and Size Controls */}
			<div className="flex gap-4 mb-4 justify-center">
				{/* Font Selector */}
				<select
					value={fontClass}
					onChange={handleFontChange}
					className="border p-1 rounded"
				>
					{hebrewFonts.map((font) => (
						<option key={font.value} value={font.value}>
							{font.label}
						</option>
					))}
				</select>

				{/* Font Size Control */}
				<button
					onClick={handleIncreaseFontSize}
					className="px-2 py-1 border rounded"
				>
					A+
				</button>
				<button
					onClick={handleDecreaseFontSize}
					className="px-2 py-1 border rounded"
				>
					A-
				</button>
			</div>
			{/* Lesson Content with Dynamic Font and Size */}
			<div
				dir="rtl"
				className={`whitespace-pre-wrap bg-gray-50 p-4 border rounded shadow leading-loose ${fontClass}`}
				style={{ fontSize: `${fontSize}px` }} // Apply dynamic font size here
			>
				<div
					dangerouslySetInnerHTML={{
						__html: story.content ?? 'No content for this lesson.',
					}}
				/>
			</div>
		</div>
	)
}
