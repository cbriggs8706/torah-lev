'use client'

import { useEffect, useMemo, useState } from 'react'
import { ActivityFinalScreen } from '@/components/activity-final-screen'
import { ResultCard } from '@/app/lesson/result-card'
import { Button } from '../ui/button'
import { useRouter } from 'next/navigation'
import AudioPlayer from '@/components/media/audio-player'
import { isSpotifyUrl } from '@/components/media/audio-utils'
import { awardVideoCompletion } from '@/actions/video-progress'

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
	showScript = true,
	returnTo,
	initialCompleted = false,
	allowLocalCompletionCache = false,
}: {
	lessonScript: LessonScript
	showScript?: boolean
	returnTo?: string
	initialCompleted?: boolean
	allowLocalCompletionCache?: boolean
}) {
	const [fontClass, setFontClass] = useState('font-serif')
	const [fontSize, setFontSize] = useState(36)
	const [mediaType, setMediaType] = useState<'video' | 'audio'>(
		lessonScript.videoUrl ? 'video' : 'audio'
	)
	const router = useRouter()
	const audioSource = lessonScript.audio ?? lessonScript.audioSrc
	const [videoCompleted, setVideoCompleted] = useState(false)
	const [completionSaved, setCompletionSaved] = useState(initialCompleted)
	const [savingCompletion, setSavingCompletion] = useState(false)
	const [completionScreen, setCompletionScreen] = useState(false)
	const [awardedPoints, setAwardedPoints] = useState(20)
	const completionStorageKey = useMemo(
		() => `he-video-complete:${lessonScript.id}`,
		[lessonScript.id]
	)
	const backHref =
		typeof returnTo === 'string' && returnTo.startsWith('/')
			? returnTo
			: '/he/videos'
	const backLabel = backHref.startsWith('/courses/public/')
		? 'Back to Course'
		: 'Back to Video List'

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

	const youtubeVideoId = useMemo(() => {
		if (!lessonScript.videoUrl) return null

		try {
			const parsed = new URL(lessonScript.videoUrl)
			if (parsed.hostname.includes('youtu.be')) {
				return parsed.pathname.replace('/', '') || null
			}
			if (parsed.hostname.includes('youtube.com')) {
				if (parsed.searchParams.get('v')) {
					return parsed.searchParams.get('v')
				}
				const parts = parsed.pathname.split('/').filter(Boolean)
				const embedIndex = parts.findIndex((part) => part === 'embed')
				if (embedIndex >= 0) {
					return parts[embedIndex + 1] ?? null
				}
			}
		} catch {
			return null
		}

		return null
	}, [lessonScript.videoUrl])

	useEffect(() => {
		if (!youtubeVideoId) return

		let cancelled = false
		const playerElementId = `lesson-script-player-${lessonScript.id}`

		function setupPlayer() {
			if (cancelled) return
			const YT = (window as Window & { YT?: any }).YT
			if (!YT?.Player) return

			new YT.Player(playerElementId, {
				events: {
					onStateChange: (event: { data: number }) => {
						if (event.data === 0) {
							setVideoCompleted(true)
						}
					},
				},
			})
		}

		if ((window as Window & { YT?: any }).YT?.Player) {
			setupPlayer()
			return () => {
				cancelled = true
			}
		}

		const existingScript = document.querySelector<HTMLScriptElement>(
			'script[data-youtube-iframe-api="1"]'
		)
		if (!existingScript) {
			const script = document.createElement('script')
			script.src = 'https://www.youtube.com/iframe_api'
			script.async = true
			script.dataset.youtubeIframeApi = '1'
			document.body.appendChild(script)
		}

		const previousHandler = (window as Window & { onYouTubeIframeAPIReady?: () => void })
			.onYouTubeIframeAPIReady
		;(window as Window & { onYouTubeIframeAPIReady?: () => void }).onYouTubeIframeAPIReady =
			() => {
				previousHandler?.()
				setupPlayer()
			}

		return () => {
			cancelled = true
		}
	}, [lessonScript.id, youtubeVideoId])

	useEffect(() => {
		window.scrollTo({ top: 0, behavior: 'auto' })
	}, [])

	useEffect(() => {
		setMediaType(lessonScript.videoUrl ? 'video' : 'audio')
		setVideoCompleted(false)
		setCompletionSaved(initialCompleted)
		setCompletionScreen(false)
		setSavingCompletion(false)
		setAwardedPoints(20)
	}, [initialCompleted, lessonScript.videoUrl, lessonScript.id])

	useEffect(() => {
		if (!allowLocalCompletionCache || typeof window === 'undefined') return

		if (completionSaved) return

		const stored = window.localStorage.getItem(completionStorageKey)
		if (stored === '1') {
			setCompletionSaved(true)
		}
	}, [allowLocalCompletionCache, completionSaved, completionStorageKey])

	const handleMarkComplete = async () => {
		if (!videoCompleted || completionSaved || savingCompletion) {
			return
		}

		setSavingCompletion(true)

		try {
			const result = await awardVideoCompletion({
				videoId: lessonScript.id,
				points: 20,
			})

			if (result.guest && allowLocalCompletionCache) {
				window.localStorage.setItem(completionStorageKey, '1')
			}

			const points = typeof result.awardedPoints === 'number' ? result.awardedPoints : 20
			setAwardedPoints(points)
			setCompletionSaved(true)
			setCompletionScreen(true)
		} catch (error) {
			console.error('Failed to save public course video progress', error)
		} finally {
			setSavingCompletion(false)
		}
	}

	const handleReturn = () => {
		router.push(backHref)
		router.refresh()
	}

	if (completionScreen) {
		return (
			<ActivityFinalScreen
				title="Video Complete"
				description={
					<>
						You earned <span className="font-semibold">{awardedPoints}</span>{' '}
						point{awardedPoints === 1 ? '' : 's'} for finishing this video.
					</>
				}
				stats={[
					{
						label: 'Points',
						value: awardedPoints,
						valueClassName: 'text-emerald-600',
					},
				]}
				rewards={
					<div className="mx-auto flex w-full max-w-md items-center gap-x-4">
						<ResultCard variant="points" value={awardedPoints} />
					</div>
				}
				actions={
					<div className="flex justify-center">
						<Button onClick={handleReturn}>{backLabel}</Button>
					</div>
				}
			/>
		)
	}

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
					variant="default"
					onClick={handleReturn}
				>
					{backLabel}
				</Button>
				<Button
					variant="default"
					onClick={() => {
						void handleMarkComplete()
					}}
					disabled={
						!videoCompleted ||
						completionSaved ||
						savingCompletion
					}
				>
					{completionSaved
						? 'Completed'
						: savingCompletion
							? 'Saving...'
							: 'Mark Complete'}
				</Button>
			</div>

			{/* Media block */}
			<div className="flex flex-col gap-4 mb-8">
				{mediaType === 'video' && lessonScript.videoUrl && (
					<div className="relative w-full" style={{ paddingTop: '56.25%' }}>
						<iframe
							id={`lesson-script-player-${lessonScript.id}`}
							className="absolute inset-0 w-full h-full rounded-md"
							src={
								youtubeVideoId
									? `https://www.youtube.com/embed/${youtubeVideoId}?enablejsapi=1&rel=0`
									: lessonScript.videoUrl
							}
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
								setVideoCompleted(true)
							}}
						/>
					))}
			</div>
			{/* Font Selector and Size Controls */}
			{showScript ? (
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
			) : null}
			{/* Lesson Content with Dynamic Font and Size */}
			{showScript ? (
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
			) : null}
		</div>
	)
}
