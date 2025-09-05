'use client'

import { useMemo, useState } from 'react'
import { Button } from '../ui/button'
import { useRouter } from 'next/navigation'
import AudioPlayer from '@/components/media/audio-player'
import { isSpotifyUrl } from '@/components/media/audio-utils'

const englishFonts = [
	{ label: 'Arial', value: 'font-arial' },
	{ label: 'Times', value: 'font-serif' },
	{ label: 'Nunito', value: 'font-nunito' },
]

type EnglishStory = {
	id: number
	title: string
	video: string | null
	image: string | null
	content: string | null
	audio: string | null
	lessonId: string | null
	category: string
	public: boolean
}

type Story = {
	story: EnglishStory
}

export default function EnglishStoryViewer(story: Story) {
	// export default function EnglishStoryViewer({ story }: { story: Story }) {
	const [fontClass, setFontClass] = useState('font-nunito')
	const [fontSize, setFontSize] = useState(36)
	const [mediaType, setMediaType] = useState<'video' | 'audio'>('audio') // Default to audio

	const router = useRouter()

	const audioIsSpotify = useMemo(
		() => isSpotifyUrl(story.story.audio),
		[story.story.audio]
	)
	const audioSrcClean = useMemo(() => {
		const a = story.story.audio
		if (!a) return null
		try {
			const u = new URL(a)
			u.search = ''
			return u.toString()
		} catch {
			return a
		}
	}, [story.story.audio])

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
			<h2 className="text-4xl font-bold text-center">{story.story.title}</h2>
			{/* Toggle Buttons */}
			<div className="flex flex-wrap gap-4 mb-4 justify-center">
				<Button
					onClick={() => setMediaType('video')}
					disabled={!story.story.video}
				>
					Video
				</Button>
				<Button
					onClick={() => setMediaType('audio')}
					disabled={!story.story.audio}
				>
					Audio
				</Button>
				<Button
					variant={'default'}
					onClick={() => {
						router.push('/en/stories')
						router.refresh() // revalidate the next route after the push
					}}
				>
					Back to Story List
				</Button>
			</div>
			{/* Media block */}
			<div className="flex flex-col gap-4 mb-8">
				{mediaType === 'video' && story.story.video && (
					<div className="relative w-full" style={{ paddingTop: '56.25%' }}>
						<iframe
							className="absolute inset-0 w-full h-full rounded-md"
							src={
								story.story.video
									.replace('youtu.be/', 'www.youtube.com/embed/')
									.replace('watch?v=', 'embed/')
									.split('?')[0]
							}
							title="YouTube video player"
							frameBorder={0}
							allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
							allowFullScreen
						/>
					</div>
				)}

				{mediaType === 'audio' &&
					story.story.audio &&
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
							label={`Audio for ${story.story.title}`}
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
					{englishFonts.map((font) => (
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
				className={`whitespace-pre-wrap bg-gray-50 p-4 border rounded shadow leading-loose ${fontClass}`}
				style={{ fontSize: `${fontSize}px` }} // Apply dynamic font size here
			>
				<div
					dangerouslySetInnerHTML={{
						__html: story.story.content ?? 'No content for this lesson.',
					}}
				/>
			</div>
		</div>
	)
}
