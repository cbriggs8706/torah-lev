'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { awardVideoCompletion } from '@/actions/video-progress'
import { ActivityCompletionScreen } from '@/components/activity-completion-screen'
import { Button } from '@/components/ui/button'
import { dispatchUserProgressUpdated } from '@/lib/user-progress-events'
import MusicLinesTable from '@/components/hebrew/hebrew-music-lines-table'
import type { HebrewMusicWithLines } from '@/db/types'

export default function HebrewMusicViewer({
	song,
	courseId,
	returnTo,
	initialCompleted = false,
	allowLocalCompletionCache = false,
}: {
	song: HebrewMusicWithLines
	courseId: number
	returnTo?: string
	initialCompleted?: boolean
	allowLocalCompletionCache?: boolean
}) {
	const router = useRouter()
	const [completionSaved, setCompletionSaved] = useState(initialCompleted)
	const [savingCompletion, setSavingCompletion] = useState(false)
	const [completionScreen, setCompletionScreen] = useState(false)
	const [awardedPoints, setAwardedPoints] = useState(20)
	const [completionRewards, setCompletionRewards] = useState<{
		awardedPoints: number
		hearts: number
		tribePointAwarded: boolean
	} | null>(null)
	const lastSongIdRef = useRef<number | null>(null)
	const completionStorageKey = useMemo(
		() => `he-music-complete:${song.id}`,
		[song.id],
	)
	const backHref =
		typeof returnTo === 'string' && returnTo.startsWith('/')
			? returnTo
			: '/he/music'
	const backLabel = backHref.startsWith('/courses/public/')
		? 'Back to Course'
		: 'Back to Songs'

	useEffect(() => {
		if (lastSongIdRef.current === song.id) {
			return
		}

		lastSongIdRef.current = song.id
		setCompletionSaved(initialCompleted)
		setCompletionScreen(false)
		setSavingCompletion(false)
		setAwardedPoints(20)
		setCompletionRewards(null)
	}, [initialCompleted, song.id])

	useEffect(() => {
		if (!allowLocalCompletionCache || typeof window === 'undefined') return
		if (completionSaved) return

		const stored = window.localStorage.getItem(completionStorageKey)
		if (stored === '1') {
			setCompletionSaved(true)
		}
	}, [allowLocalCompletionCache, completionSaved, completionStorageKey])

	const handleMarkComplete = async () => {
		if (savingCompletion) return

		setSavingCompletion(true)

		try {
			const result = await awardVideoCompletion({
				courseId,
				videoId: song.id,
				points: 20,
			})

			if (result.guest && allowLocalCompletionCache) {
				window.localStorage.setItem(completionStorageKey, '1')
			}

			const points = typeof result.awardedPoints === 'number' ? result.awardedPoints : 20
			const hearts = typeof result.hearts === 'number' ? result.hearts : 5
			const tribePointAwarded = Boolean(result.tribePointAwarded)
			setAwardedPoints(points)
			setCompletionRewards({
				awardedPoints: points,
				hearts,
				tribePointAwarded,
			})
			dispatchUserProgressUpdated({
				hearts,
				points,
			})
			setCompletionSaved(true)
			setCompletionScreen(true)
		} catch (error) {
			console.error('Failed to save music progress', error)
		} finally {
			setSavingCompletion(false)
		}
	}

	const handleReturn = () => {
		router.push(backHref)
	}

	const handleReturnToSong = () => {
		setCompletionScreen(false)
		window.scrollTo({ top: 0, behavior: 'smooth' })
	}

	if (completionScreen) {
		const currentAwardedPoints = completionRewards?.awardedPoints ?? awardedPoints
		const currentHearts = completionRewards?.hearts ?? 5
		const isRewatch = currentAwardedPoints === 0

		return (
			<ActivityCompletionScreen
				title="Song Complete"
				description={
					isRewatch
						? 'You revisited this song and replenished your hearts.'
						: 'You earned points, refilled your hearts, and helped your tribe.'
				}
				rewardMessage={
					isRewatch ? (
						<>
							This revisit restored your hearts to full. No extra points or tribe
							points were added.
						</>
					) : (
						<>
							You earned {currentAwardedPoints} point
							{currentAwardedPoints === 1 ? '' : 's'}
							, fully refilled your hearts, and earned +1 Tribe Point.
						</>
					)
				}
				points={currentAwardedPoints}
				hearts={currentHearts}
				tribePointAwarded={completionRewards?.tribePointAwarded ?? false}
				leftActionLabel="Return to Song"
				leftActionOnClick={handleReturnToSong}
				rightActionLabel={backLabel}
				rightActionOnClick={handleReturn}
			/>
		)
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap gap-4 justify-center">
				<Button variant="default" onClick={handleReturn}>
					{backLabel}
				</Button>
				<Button
					variant="default"
					onClick={() => {
						void handleMarkComplete()
					}}
					disabled={savingCompletion}
				>
					{savingCompletion
						? 'Saving...'
						: completionSaved
							? 'Replenish Hearts'
							: 'Mark Complete'}
				</Button>
			</div>

			<div className="space-y-4">
				<div className="w-full flex flex-col items-center">
					<h1 className="text-center font-cardo text-neutral-800 text-6xl my-6">
						שִׁיר
					</h1>
					<p className="text-center font-bold text-neutral-800 mb-2">Song</p>
					<h2 className="text-center font-bold text-neutral-800 text-2xl">
						{song.title}
					</h2>
				</div>

				{song.hebTitle ? (
					<h3 className="text-center text-2xl font-hebrew mb-1">
						{song.hebTitle}
					</h3>
				) : null}
				{song.titleTransliteration ? (
					<p className="text-center italic text-gray-600 mb-4">
						{song.titleTransliteration}
					</p>
				) : null}

				<MusicLinesTable
					lines={song.lines}
					audio={song.audio}
					video={song.video}
				/>
			</div>
		</div>
	)
}
