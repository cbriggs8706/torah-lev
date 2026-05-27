'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '../ui/button'
import { useRouter } from 'next/navigation'
import AudioPlayer from '@/components/media/audio-player'
import { isSpotifyUrl } from '@/components/media/audio-utils'

const hebrewFonts = [
	{ label: 'Arial', value: 'font-arial' },
	{ label: 'Times', value: 'font-serif' },
	{ label: 'Nunito', value: 'font-nunito' },
	{ label: 'Frank', value: 'font-frank' },
	{ label: 'Tinos', value: 'font-tinos' },
	{ label: 'Cardo', value: 'font-cardo' },
	{ label: 'Rashi', value: 'font-rashi' },
	{ label: 'Suez', value: 'font-suez' },
]

type LessonScript = {
	id: number
	content: string | null
	contentPlain: string | null
	audio: string | null
	audioSrc: string | null
	videoUrl: string | null
	lessonId: number | null
	courseId: number[] | null
}

export default function LessonScriptViewer({
	lessonScript,
}: {
	lessonScript: LessonScript
}) {
	const [fontClass, setFontClass] = useState('font-serif')
	const [fontSize, setFontSize] = useState(36)
	const [mediaType, setMediaType] = useState<'video' | 'audio'>(
		lessonScript.videoUrl ? 'video' : 'audio'
	)
	const router = useRouter()
	const audioSource = lessonScript.audio ?? lessonScript.audioSrc

	const audioIsSpotify = useMemo(
		() => isSpotifyUrl(audioSource),
		[audioSource]
	)
	const audioSrcClean = useMemo(() => {
		if (!audioSource) return null
		try {
			const u = new URL(audioSource)
			u.search = ''
			return u.toString()
		} catch {
			return audioSource
		}
	}, [audioSource])

	useEffect(() => {
		window.scrollTo({ top: 0, behavior: 'auto' })
	}, [])

	useEffect(() => {
		setMediaType(lessonScript.videoUrl ? 'video' : 'audio')
	}, [lessonScript.videoUrl, lessonScript.id])

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
			{/* Toggle Buttons */}
			<div className="flex flex-wrap gap-4 mb-4 justify-center">
				<Button
					onClick={() => setMediaType('video')}
					disabled={!lessonScript.videoUrl}
				>
					Video
				</Button>
				<Button onClick={() => setMediaType('audio')} disabled={!audioSource}>
					Audio
				</Button>
				<Button
					variant={'default'}
					onClick={() => {
						router.push('/he/lesson-scripts', { scroll: true })
						router.refresh() // revalidate the next route after the push
					}}
				>
					Back to Lesson Script List
				</Button>
			</div>

			{/* Media block */}
			<div className="flex flex-col gap-4 mb-8">
				{mediaType === 'video' && lessonScript.videoUrl && (
					<div className="relative w-full" style={{ paddingTop: '56.25%' }}>
						<iframe
							className="absolute inset-0 w-full h-full rounded-md"
							src={lessonScript.videoUrl
								.replace('youtu.be/', 'www.youtube.com/embed/')
								.replace('watch?v=', 'embed/')
								.split('?')[0]}
							title="Lesson video player"
							frameBorder={0}
							allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
							allowFullScreen
						/>
					</div>
				)}

				{mediaType === 'audio' &&
					audioSource &&
					(audioIsSpotify ? (
						<iframe
							data-testid="embed-iframe"
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
							label={`Audio for lesson ${lessonScript.lessonId ?? lessonScript.id}`}
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
						__html: lessonScript.content ?? 'No content for this lesson.',
					}}
				/>
			</div>
		</div>
	)
}
