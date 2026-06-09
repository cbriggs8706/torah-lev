'use client'

import Image from 'next/image'
import { Bookmark, Star } from 'lucide-react'
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { ActivityCompletionScreen } from '@/components/activity-completion-screen'
import { useLessonCards } from '@/hooks/useLessonCards'
import { useUserId } from '@/hooks/useUserId'
import { dispatchUserProgressUpdated } from '@/lib/user-progress-events'
import { resolveVocabMediaUrl } from '@/lib/vocab-media'
import { HebrewVocab } from '@/lib/vocab'
import LessonFilter from '../filters/filter-lesson'
import ProgressBar from '../progress-bar'
import type { PublicCourseActivityFilters } from '@/lib/public-course-activities'
import { awardFlashcardsCompletion } from '@/actions/flashcards-progress'
import { markPublicCourseActivityComplete } from '@/lib/public-course-progress'

type HebrewCardFilterType = 'all' | 'word' | 'phrase' | 'stack'
type FlashcardSide = 'images' | 'hebAudio' | 'eng' | 'heb' | 'hebNiqqud'

type CardStatus = {
	isMastered: boolean
	inMyStack: boolean
}

interface HebrewVocabProps {
	data: HebrewVocab[]
	currentLesson: string
	layout: string
	courseId: number
	returnTo?: string
	lockedLesson?: string
	hideFilters?: boolean
	initialFilters?: PublicCourseActivityFilters
	completionContext?: {
		enrollmentId: number
		publicCourseLessonId: number
	}
}

const CARD_FLIP_DURATION_MS = 700

const SIDE_OPTIONS: { value: FlashcardSide; label: string }[] = [
	{ value: 'images', label: 'Image' },
	{ value: 'hebAudio', label: 'Audio' },
	{ value: 'eng', label: 'Translation' },
	{ value: 'heb', label: 'Hebrew Word' },
	{ value: 'hebNiqqud', label: 'Hebrew with Vowels' },
]

export default function HebrewFlashcards({
	data,
	currentLesson,
	courseId,
	returnTo,
	lockedLesson,
	hideFilters = false,
	initialFilters,
	completionContext,
}: HebrewVocabProps) {
	const {
		selectedLessons,
		setSelectedLessons,
		currentIndex,
		setCurrentIndex,
	} = useLessonCards(data, currentLesson)

	const [selectedType, setSelectedType] = useState<HebrewCardFilterType>('all')
	const [frontField, setFrontField] = useState<FlashcardSide>('images')
	const [backField, setBackField] = useState<FlashcardSide>('hebAudio')
	const [showBack, setShowBack] = useState(false)
	const [filteredCards, setFilteredCards] = useState<HebrewVocab[]>([])
	const [showFilter, setShowFilter] = useState(false)
	const [audioVolume, setAudioVolume] = useState(1)
	const [audioSpeed, setAudioSpeed] = useState(1)
	const [isRandomized, setIsRandomized] = useState(false)
	const [hideMasteredCards, setHideMasteredCards] = useState(true)
	const [cardStatuses, setCardStatuses] = useState<Record<number, CardStatus>>({})
	const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
	const [completionScreen, setCompletionScreen] = useState(false)
	const [completionRewards, setCompletionRewards] = useState<{
		awardedPoints: number
		hearts: number
		tribePointAwarded: boolean
	} | null>(null)
	const lastBackAutoplayKeyRef = useRef<string | null>(null)
	const navigationTimeoutRef = useRef<number | null>(null)
	const publicCourseCompletionRef = useRef(false)
	const router = useRouter()

	const { isGuest, ready } = useUserId()
	const canUseSavedWordFeatures = ready && !isGuest

	useEffect(() => {
		if (!lockedLesson) return
		setSelectedLessons([lockedLesson])
	}, [lockedLesson, setSelectedLessons])

	useEffect(() => {
		if (initialFilters?.selectedLessons?.length) {
			setSelectedLessons(initialFilters.selectedLessons)
		}
		if (initialFilters?.selectedType) {
			setSelectedType(initialFilters.selectedType)
		}
	}, [initialFilters, setSelectedLessons])

	useEffect(() => {
		publicCourseCompletionRef.current = false
	}, [completionContext?.enrollmentId, completionContext?.publicCourseLessonId, currentLesson])

	const cardsForPrefix = useMemo(() => data, [data])
	const stackCardIds = useMemo(
		() =>
			new Set(
				Object.entries(cardStatuses)
					.filter(([, status]) => status.inMyStack)
					.map(([cardId]) => Number(cardId)),
			),
		[cardStatuses],
	)
	const currentCard = filteredCards[currentIndex]

	function playWithBoostedVolume(url: string, volume: number, speed: number) {
		const AudioContextCtor =
			window.AudioContext ||
			(window as Window & { webkitAudioContext?: typeof AudioContext })
				.webkitAudioContext

		if (!AudioContextCtor) return

		const audioContext = new AudioContextCtor()
		const audio = new Audio(url)
		audio.crossOrigin = 'anonymous'
		audio.playbackRate = speed

		const source = audioContext.createMediaElementSource(audio)
		const gainNode = audioContext.createGain()
		gainNode.gain.value = Math.min(volume, 2)

		source.connect(gainNode).connect(audioContext.destination)
		audio.play().catch(console.error)
	}

	function hasFieldValue(card: HebrewVocab, field: FlashcardSide) {
		switch (field) {
			case 'images':
				return card.images.length > 0
			case 'hebAudio':
				return !!card.hebAudio
			case 'eng':
				return !!card.eng
			case 'heb':
				return !!card.heb
			case 'hebNiqqud':
				return !!card.hebNiqqud
		}
	}

	function toTitleCase(value: string) {
		return value
			.split(/[\s_-]+/)
			.filter(Boolean)
			.map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
			.join(' ')
	}

	function compactPersonValue(value?: string | null) {
		switch (value?.toLowerCase()) {
			case '1':
			case '1st':
				return '1'
			case '2':
			case '2nd':
				return '2'
			case '3':
			case '3rd':
				return '3'
			default:
				return null
		}
	}

	function compactGenderValue(value?: string | null) {
		switch (value?.toLowerCase()) {
			case 'm':
			case 'masculine':
				return 'm'
			case 'f':
			case 'feminine':
				return 'f'
			default:
				return null
		}
	}

	function compactNumberValue(value?: string | null) {
		switch (value?.toLowerCase()) {
			case 's':
			case 'singular':
				return 's'
			case 'p':
			case 'plural':
				return 'p'
			default:
				return null
		}
	}

	function formatLabelValue(label: string, value: string) {
		return `${label}: ${value}`
	}

	function stripLabelPrefix(value: string | null, label: 'Root' | 'Suffix') {
		if (!value) return null
		return value.replace(new RegExp(`^${label}:\\s*`, 'i'), '')
	}

	function buildCompactMorphologyLabel(
		label: 'Root' | 'Suffix',
		person?: string | null,
		gender?: string | null,
		number?: string | null,
	) {
		const compact = [
			compactPersonValue(person),
			compactGenderValue(gender),
			compactNumberValue(number),
		]
			.filter(Boolean)
			.join('')

		return compact ? formatLabelValue(label, compact) : null
	}

	function formatPartOfSpeechValue(value?: string | string[] | null) {
		const firstValue = Array.isArray(value) ? value[0] : value
		if (!firstValue) return null
		const cleaned = firstValue.replace(/\s*\([^)]*\)\s*/g, ' ').trim()
		return cleaned ? toTitleCase(cleaned) : null
	}

	function hasConstructMarker() {
		const categoryValue = currentCard?.category?.trim().toLowerCase()
		if (categoryValue === 'construct') return true

		const parts = Array.isArray(currentCard?.partOfSpeech)
			? currentCard.partOfSpeech
			: currentCard?.partOfSpeech
				? [currentCard.partOfSpeech]
				: []

		return parts.some((part) => part.toLowerCase().includes('construct'))
	}

	function formatGrammarSummary() {
		if (currentCard?.type === 'phrase') return 'phrase'

		const state =
			currentCard?.state && currentCard.state.trim().length > 0
				? toTitleCase(currentCard.state)
				: hasConstructMarker()
					? 'Construct'
					: null
		const category =
			currentCard?.category && currentCard.category.trim().length > 0
				? toTitleCase(currentCard.category)
				: null
		const partOfSpeech = formatPartOfSpeechValue(currentCard?.partOfSpeech)
		return [state, category, partOfSpeech].filter(Boolean).join(' - ') || null
	}

	function fixHebrewPunctuation(text: string): string {
		const hebrewRegex = /[\u0590-\u05FF]/
		if (!hebrewRegex.test(text)) return text
		return text.replace(/\?/g, '؟')
	}

	function renderContent(field: FlashcardSide, isMiddle = false) {
		if (!currentCard) return null

		if (field === 'images') {
			if (currentCard.images.length > 0) {
				const imageUrl = resolveVocabMediaUrl(currentCard.images[0])
				return (
					<div
						className={`flex w-full items-center justify-center ${
							isMiddle ? 'min-h-[16rem]' : 'h-32'
						}`}
					>
						<Image
							src={imageUrl}
							alt="HebrewVocab image"
							width={isMiddle ? 320 : 160}
							height={isMiddle ? 320 : 160}
							style={{ width: 'auto', height: 'auto' }}
							className="h-auto w-auto max-w-full rounded object-contain"
							sizes={isMiddle ? '(max-width: 768px) 90vw, 320px' : '160px'}
						/>
					</div>
				)
			}

			if (currentCard.hebAudio) {
				return (
					<div className="flex flex-col items-center gap-2">
						<button
							className="text-3xl text-sky-600 hover:text-sky-800"
							onClick={(e) => {
								e.stopPropagation()
								playWithBoostedVolume(
									currentCard.hebAudio || '',
									audioVolume,
									audioSpeed,
								)
							}}
						>
							🔊
						</button>
						<span className="text-xs text-slate-500">No image</span>
					</div>
				)
			}

			return currentCard.eng ? (
				<div className="flex flex-col items-center gap-2">
					<span className={isMiddle ? 'text-xl font-semibold' : ''}>
						{currentCard.eng}
					</span>
					<span className="text-xs text-slate-500">No image</span>
				</div>
			) : null
		}

		if (field === 'hebAudio') {
			if (!currentCard.hebAudio) return null
			return (
				<button
					className="text-3xl text-sky-600 hover:text-sky-800"
					onClick={(e) => {
						e.stopPropagation()
						playWithBoostedVolume(
							currentCard.hebAudio || '',
							audioVolume,
							audioSpeed,
						)
					}}
				>
					🔊
				</button>
			)
		}

		const value = currentCard[field]
		if (!value) return null

		const className =
			field === 'heb' || field === 'hebNiqqud'
				? isMiddle
					? 'font-serif text-4xl sm:text-5xl'
					: 'font-serif text-2xl sm:text-3xl'
				: ''

		if (field === 'eng' || field === 'heb' || field === 'hebNiqqud') {
			return <span className={className}>{fixHebrewPunctuation(value)}</span>
		}

		return <span>{String(value)}</span>
	}

	useEffect(() => {
		const newFiltered = cardsForPrefix.filter((card) => {
			const matchesSelectedLesson =
				selectedLessons.length === 0 ||
				card.lessons.some((lesson) => selectedLessons.includes(lesson))

			const matchesType =
				selectedType === 'all'
					? true
					: selectedType === 'stack'
						? !!card.id && stackCardIds.has(card.id)
						: card.type === selectedType

			const isMasteredCard =
				card.id != null && !!cardStatuses[card.id]?.isMastered
			const matchesMasteredFilter = !hideMasteredCards || !isMasteredCard

			return (
				matchesSelectedLesson &&
				matchesType &&
				matchesMasteredFilter &&
				hasFieldValue(card, frontField) &&
				hasFieldValue(card, backField)
			)
		})

		const finalCards = isRandomized
			? [...newFiltered].sort(() => Math.random() - 0.5)
			: newFiltered

		setFilteredCards(finalCards)
		if (!completionScreen) {
			setCompletionRewards(null)
		}

		if (finalCards.length === 0) {
			setCurrentIndex(0)
			setShowBack(false)
			return
		}

		const currentCardId = currentCard?.id
		if (currentCardId != null) {
			const preservedIndex = finalCards.findIndex(
				(card) => card.id === currentCardId,
			)

			if (preservedIndex !== -1) {
				setCurrentIndex(preservedIndex)
				return
			}
		}

		setCurrentIndex((prev) => Math.min(prev, finalCards.length - 1))
	}, [
		cardsForPrefix,
		selectedLessons,
		selectedType,
		frontField,
		backField,
		stackCardIds,
		cardStatuses,
		hideMasteredCards,
		isRandomized,
		currentCard?.id,
		completionScreen,
		setCurrentIndex,
	])

	useLayoutEffect(() => {
		setShowBack(false)
	}, [currentCard?.id])

	useEffect(() => {
		if (!showBack) {
			lastBackAutoplayKeyRef.current = null
		}
	}, [showBack, currentCard?.id])

	useEffect(() => {
		return () => {
			if (navigationTimeoutRef.current != null) {
				window.clearTimeout(navigationTimeoutRef.current)
			}
		}
	}, [])

	const backIpaSummary = currentCard?.ipa?.trim() || null
	const frontRootSummary = currentCard
		? buildCompactMorphologyLabel(
				'Root',
				currentCard.rootPerson,
				currentCard.rootGender,
				currentCard.rootNumber,
		  )
		: null
	const frontSuffixSummary = currentCard
		? buildCompactMorphologyLabel(
				'Suffix',
				currentCard.suffixPerson,
				currentCard.suffixGender,
				currentCard.suffixNumber,
		  )
		: null
	const frontGrammarSummary = currentCard ? formatGrammarSummary() : null

	const typeOptions = useMemo(
		() =>
			canUseSavedWordFeatures
				? (['all', 'word', 'phrase', 'stack'] as HebrewCardFilterType[])
				: (['all', 'word', 'phrase'] as HebrewCardFilterType[]),
		[canUseSavedWordFeatures],
	)

	const currentCardStatus =
		currentCard?.id != null ? cardStatuses[currentCard.id] : undefined
	const isCurrentCardMastered = !!currentCardStatus?.isMastered
	const isCurrentCardInMyStack = !!currentCardStatus?.inMyStack

	function renderAudioButton() {
		if (!currentCard?.hebAudio) return null

		return (
			<button
				type="button"
				aria-label="Play audio"
				className="rounded-full bg-white/90 p-2 text-sky-600 shadow-sm ring-1 ring-sky-100 transition hover:bg-white hover:text-sky-800"
				onClick={(e) => {
					e.stopPropagation()
					playWithBoostedVolume(currentCard.hebAudio, audioVolume, audioSpeed)
				}}
			>
				🔊
			</button>
		)
	}

	useEffect(() => {
		if (!showBack || backField !== 'hebAudio' || !currentCard?.hebAudio) return

		const autoplayKey = `${currentCard.id ?? 'no-id'}:${backField}`
		if (lastBackAutoplayKeyRef.current === autoplayKey) return
		lastBackAutoplayKeyRef.current = autoplayKey

		const audio = new Audio(currentCard.hebAudio)
		audio.playbackRate = audioSpeed
		audio.play().catch(console.error)
	}, [showBack, backField, currentCard?.id, currentCard?.hebAudio, audioSpeed])

	useEffect(() => {
		if (!canUseSavedWordFeatures) {
			setCardStatuses({})
			return
		}

		let cancelled = false

		const loadStatuses = async () => {
			try {
				const params = new URLSearchParams({
					courseId: String(courseId),
					language: 'he',
				})
				const response = await fetch(
					`/api/flashcards/status?${params.toString()}`,
				)
				if (!response.ok) throw new Error('Failed to fetch statuses')
				const payload = await response.json()
				if (cancelled) return

				const nextStatuses: Record<number, CardStatus> = {}
				for (const status of payload.statuses ?? []) {
					if (typeof status.cardId !== 'number') continue
					nextStatuses[status.cardId] = {
						isMastered: !!status.isMastered,
						inMyStack: !!status.inMyStack,
					}
				}
				setCardStatuses(nextStatuses)
			} catch (error) {
				console.error('Failed to load card statuses', error)
			}
		}

		loadStatuses()

		return () => {
			cancelled = true
		}
	}, [canUseSavedWordFeatures, courseId])

	async function updateCardStatus(
		action: 'master' | 'unmaster' | 'addToStack' | 'removeFromStack',
	) {
		if (!currentCard?.id || !canUseSavedWordFeatures) return

		setIsUpdatingStatus(true)
		try {
			const response = await fetch('/api/flashcards/status', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					cardId: currentCard.id,
					courseId,
					language: 'he',
					action,
				}),
			})

			if (!response.ok) {
				throw new Error('Failed to update card status')
			}

			const payload = await response.json()
			const nextStatus = payload.status
			const shouldAdvanceToFront =
				action === 'master' && hideMasteredCards && !!nextStatus?.isMastered

			if (shouldAdvanceToFront) {
				setShowBack(false)
				await new Promise((resolve) =>
					window.setTimeout(resolve, CARD_FLIP_DURATION_MS),
				)
			}

			if (typeof nextStatus?.cardId === 'number') {
				setCardStatuses((prev) => ({
					...prev,
					[nextStatus.cardId]: {
						isMastered: !!nextStatus.isMastered,
						inMyStack: !!nextStatus.inMyStack,
					},
				}))
			}
		} catch (error) {
			console.error('Failed to update card status', error)
			toast.error('Could not update this word right now.')
		} finally {
			setIsUpdatingStatus(false)
		}
	}

	function handleNextCard() {
		if (completionScreen) return
		if (navigationTimeoutRef.current != null) {
			window.clearTimeout(navigationTimeoutRef.current)
		}
		setShowBack(false)
		navigationTimeoutRef.current = window.setTimeout(() => {
			const nextIndex = currentIndex + 1
			if (nextIndex >= filteredCards.length) {
				void handleDeckComplete()
				return
			}
			setCurrentIndex(nextIndex % filteredCards.length)
		}, CARD_FLIP_DURATION_MS)
	}

	function handlePreviousCard() {
		if (completionScreen) return
		if (navigationTimeoutRef.current != null) {
			window.clearTimeout(navigationTimeoutRef.current)
		}
		setShowBack(false)
		navigationTimeoutRef.current = window.setTimeout(() => {
			setCurrentIndex(
				(prev) => (prev - 1 + filteredCards.length) % filteredCards.length,
			)
		}, CARD_FLIP_DURATION_MS)
	}

	const handleDeckComplete = useCallback(async () => {
		if (completionScreen || filteredCards.length === 0) return
		if (navigationTimeoutRef.current != null) {
			window.clearTimeout(navigationTimeoutRef.current)
			navigationTimeoutRef.current = null
		}

		try {
			const result = await awardFlashcardsCompletion({
				courseId,
				points: filteredCards.length,
			})

			setCompletionRewards({
				awardedPoints: result.awardedPoints ?? filteredCards.length,
				hearts: result.hearts ?? 5,
				tribePointAwarded: Boolean(result.tribePointAwarded),
			})
			dispatchUserProgressUpdated({
				hearts: result.hearts ?? 5,
				points: result.awardedPoints ?? filteredCards.length,
			})
			setCompletionScreen(true)
		} catch (error) {
			console.error('Failed to award flashcards completion rewards', error)
			setCompletionRewards({
				awardedPoints: filteredCards.length,
				hearts: 5,
				tribePointAwarded: false,
			})
			dispatchUserProgressUpdated({
				hearts: 5,
				points: filteredCards.length,
			})
			setCompletionScreen(true)
		}
	}, [completionScreen, courseId, filteredCards.length])

	useEffect(() => {
		if (!completionScreen || !completionContext || publicCourseCompletionRef.current) {
			return
		}

		publicCourseCompletionRef.current = true
		void markPublicCourseActivityComplete({
			enrollmentId: completionContext.enrollmentId,
			publicCourseLessonId: completionContext.publicCourseLessonId,
			activityKey: 'flashcards',
			scorePercent: 100,
		}).catch((error) => {
			console.error('Failed to save public course flashcards progress', error)
			publicCourseCompletionRef.current = false
		})
	}, [completionContext, completionScreen])

	if (completionScreen) {
		const awardedPoints = completionRewards?.awardedPoints ?? filteredCards.length
		const tribePointAwarded = completionRewards?.tribePointAwarded ?? false
		const returnHref =
			typeof returnTo === 'string' && returnTo.startsWith('/')
				? returnTo
				: '/he/learn'

		return (
			<ActivityCompletionScreen
				title="Flashcards Complete"
				description="You finished the full flashcards set."
				rewardMessage={
					tribePointAwarded
						? `You earned ${awardedPoints} point${awardedPoints === 1 ? '' : 's'} and +1 Tribe Point.`
						: `You earned ${awardedPoints} point${awardedPoints === 1 ? '' : 's'}.`
				}
				points={awardedPoints}
				hearts={completionRewards?.hearts ?? 5}
				tribePointAwarded={tribePointAwarded}
				leftActionLabel="Return to Flashcards"
				leftActionOnClick={() => {
					setCompletionScreen(false)
					setCompletionRewards(null)
					setCurrentIndex(0)
					setShowBack(false)
				}}
				rightActionLabel={
					returnHref.startsWith('/courses/public/')
						? 'Return to Course'
						: 'Return to Learn'
				}
				rightActionOnClick={() => {
					router.push(returnHref)
				}}
			/>
		)
	}

	return (
		<div className="mx-auto w-full max-w-3xl p-4 text-center">
			<div className="mb-6 flex justify-center gap-4">
				{!hideFilters ? (
					<button
						onClick={() => setShowFilter((prev) => !prev)}
						className={`flex items-center justify-center gap-4 rounded px-4 py-2 shadow ${
							showFilter ? 'bg-sky-600 text-white' : 'bg-gray-200'
						}`}
					>
						<Image
							src="/books-svgrepo-com.svg"
							alt="Filter icon"
							width={30}
							height={30}
						/>
						Filters
					</button>
				) : null}
			</div>

			<div className="mb-6 flex flex-col items-center justify-center gap-6 sm:flex-row">
				<div className="text-sm">
					<label className="mb-1 block font-medium">Volume</label>
					<input
						type="range"
						min="0"
						max="2"
						step="0.05"
						value={audioVolume}
						onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
						className="accent-sky-600"
					/>
					<div className="text-center">{Math.round(audioVolume * 100)}%</div>
				</div>
				<div className="text-sm">
					<label className="mb-1 block font-medium">Audio Speed</label>
					<input
						type="range"
						min="0.5"
						max="1"
						step="0.05"
						value={audioSpeed}
						onChange={(e) => setAudioSpeed(parseFloat(e.target.value))}
						className="accent-sky-600"
					/>
					<div className="text-center">{audioSpeed.toFixed(1)}x</div>
				</div>
			</div>

			{showFilter && !hideFilters && (
				<div className="mb-4 space-y-4 rounded-2xl border bg-white/70 p-4 shadow-sm backdrop-blur">
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="rounded-xl border bg-white p-4 text-left">
							<label className="block text-sm font-semibold uppercase tracking-wide text-neutral-600">
								Front
							</label>
							<select
								className="mt-2 w-full rounded-lg border p-2"
								value={frontField}
								onChange={(e) => setFrontField(e.target.value as FlashcardSide)}
							>
								{SIDE_OPTIONS.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</select>
						</div>
						<div className="rounded-xl border bg-sky-50 p-4 text-left">
							<label className="block text-sm font-semibold uppercase tracking-wide text-neutral-600">
								Back
							</label>
							<select
								className="mt-2 w-full rounded-lg border p-2"
								value={backField}
								onChange={(e) => setBackField(e.target.value as FlashcardSide)}
							>
								{SIDE_OPTIONS.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</select>
						</div>
					</div>

					<div className="space-y-3">
						<h2 className="text-xl font-semibold">Select Type</h2>
						<div className="flex flex-wrap justify-center gap-2">
							{typeOptions.map((type) => (
								<button
									key={type}
									onClick={() => setSelectedType(type)}
									className={`rounded-full border px-3 py-1 text-xs ${
										selectedType === type
											? 'bg-sky-600 text-white'
											: 'bg-gray-200'
									}`}
								>
									{type === 'stack'
										? 'My Stack'
										: type.charAt(0).toUpperCase() + type.slice(1)}
								</button>
							))}
						</div>
					</div>

					<LessonFilter
						data={data}
						selectedLessons={selectedLessons}
						setSelectedLessons={setSelectedLessons}
						showRanges={true}
					/>

					<div className="flex flex-wrap items-center justify-center gap-2">
						{!isRandomized ? (
							<button
								onClick={() => {
									setIsRandomized(true)
									setFilteredCards((prev) =>
										[...prev].sort(() => Math.random() - 0.5),
									)
									setCurrentIndex(0)
								}}
								className="rounded bg-violet-600 px-4 py-2 text-white shadow transition hover:bg-violet-500"
							>
								🔀 Randomize Cards
							</button>
						) : (
							<button
								onClick={() => {
									setIsRandomized(false)
									setCurrentIndex(0)
								}}
								className="rounded bg-gray-300 px-4 py-2 text-gray-800 shadow transition hover:bg-gray-200"
							>
								↩️ Reset Order
							</button>
						)}
						<button
							onClick={() => setHideMasteredCards((prev) => !prev)}
							className={`rounded px-4 py-2 shadow transition ${
								hideMasteredCards
									? 'bg-amber-500 text-white hover:bg-amber-400'
									: 'bg-gray-300 text-gray-800 hover:bg-gray-200'
							}`}
						>
							{hideMasteredCards ? 'Filter out Mastered' : 'Show All Words'}
						</button>
					</div>
				</div>
			)}

			{filteredCards.length > 0 ? (
				<div
					className={`group relative mb-4 w-full cursor-pointer perspective ${
						frontField === 'images' || backField === 'images' ? 'h-96' : 'h-80'
					}`}
					onClick={() => setShowBack((prev) => !prev)}
				>
					<div
						className={`relative h-full w-full transform-style-preserve-3d transition-transform duration-700 ${
							showBack ? 'rotate-y-180' : ''
						}`}
					>
						<div className="absolute inset-0 flex flex-col rounded-xl border bg-white p-4 shadow-sm backface-hidden sm:p-6">
							<div className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 text-sm text-gray-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
								Tap to flip
							</div>
							{(frontField === 'heb' || frontField === 'hebNiqqud') && (
								<div className="absolute right-3 top-3 z-10">
									{renderAudioButton()}
								</div>
							)}
							<div className="relative flex flex-1 items-center justify-center overflow-hidden">
								{(isCurrentCardMastered || isCurrentCardInMyStack) && (
									<div
										className={`absolute top-3 z-10 flex items-center gap-2 ${
											frontField === 'heb' || frontField === 'hebNiqqud'
												? 'right-14'
												: 'right-3'
										}`}
									>
										{isCurrentCardInMyStack && (
											<div className="rounded-full bg-emerald-100 p-1 text-emerald-600 shadow-sm">
												<Bookmark className="h-4 w-4 fill-current" />
											</div>
										)}
										{isCurrentCardMastered && (
											<div className="rounded-full bg-amber-100 p-1 text-amber-500 shadow-sm">
												<Star className="h-4 w-4 fill-current" />
											</div>
										)}
									</div>
								)}
								<div
									className={`flex items-center justify-center ${frontField === 'heb' || frontField === 'hebNiqqud' ? 'font-serif text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl'}`}
								>
									{renderContent(frontField, true)}
								</div>
							</div>

							<div className="grid grid-cols-3 gap-2 border-t pt-3 text-left text-xs text-neutral-700 sm:text-sm">
								<div className="min-w-0">
									<div className="uppercase tracking-wide text-neutral-500">
										Suffix
									</div>
									<div className="font-semibold">
										{frontSuffixSummary ?? '—'}
									</div>
								</div>
								<div className="min-w-0 text-center">
									<div className="uppercase tracking-wide text-neutral-500">
										Root
									</div>
									<div className="font-semibold">
										{stripLabelPrefix(frontRootSummary, 'Root') ?? '—'}
									</div>
								</div>
								<div className="min-w-0 text-right">
									<div className="uppercase tracking-wide text-neutral-500">P.O.S</div>
									<div className="font-semibold">
										{frontGrammarSummary ?? '—'}
									</div>
								</div>
							</div>
						</div>

						<div className="absolute inset-0 flex flex-col rounded-xl border bg-sky-100 p-4 shadow-sm backface-hidden rotate-y-180 sm:p-6">
							{(backField === 'heb' || backField === 'hebNiqqud') && (
								<div className="absolute right-3 top-3 z-10">
									{renderAudioButton()}
								</div>
							)}
							<div className="relative flex flex-1 items-center justify-center overflow-hidden">
								{(isCurrentCardMastered || isCurrentCardInMyStack) && (
									<div
										className={`absolute top-3 z-10 flex items-center gap-2 ${
											backField === 'heb' || backField === 'hebNiqqud'
												? 'right-14'
												: 'right-3'
										}`}
									>
										{isCurrentCardInMyStack && (
											<div className="rounded-full bg-emerald-100 p-1 text-emerald-600 shadow-sm">
												<Bookmark className="h-4 w-4 fill-current" />
											</div>
										)}
										{isCurrentCardMastered && (
											<div className="rounded-full bg-amber-100 p-1 text-amber-500 shadow-sm">
												<Star className="h-4 w-4 fill-current" />
											</div>
										)}
									</div>
								)}
								<div
									className={`flex items-center justify-center ${backField === 'heb' || backField === 'hebNiqqud' ? 'font-serif text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl'}`}
								>
									{renderContent(backField, true)}
								</div>
							</div>

							<div className="border-t pt-3 text-center text-sm text-neutral-700">
								<div className="uppercase tracking-wide text-neutral-500">IPA</div>
								<div className="font-semibold">{backIpaSummary ?? '—'}</div>
							</div>
						</div>
					</div>

				</div>
			) : (
				<div className="mb-6 text-center text-base italic text-gray-500">
					No cards available with these filters.
					<br />
					Try a different lesson or switch the front or back side.
				</div>
			)}

			{filteredCards.length > 0 && (
				<ProgressBar currentIndex={currentIndex} total={filteredCards.length} />
			)}

			<div className="flex flex-wrap justify-center gap-4">
				{showBack && canUseSavedWordFeatures && (
					<button
						onClick={() =>
							updateCardStatus(isCurrentCardMastered ? 'unmaster' : 'master')
						}
						disabled={isUpdatingStatus || !currentCard?.id}
						className="rounded bg-amber-500 px-4 py-2 text-white shadow disabled:opacity-60"
					>
						{isCurrentCardMastered ? 'Remove Mastered' : 'Mark as Mastered'}
					</button>
				)}
				<button
					onClick={handlePreviousCard}
					className="rounded bg-gray-500 px-4 py-2 text-white shadow"
					aria-label="Previous Card"
				>
					&lt;
				</button>
				<button
					onClick={handleNextCard}
					className="rounded bg-sky-600 px-4 py-2 text-white shadow"
					aria-label="Next Card"
				>
					&gt;
				</button>
				{showBack && canUseSavedWordFeatures && (
					<button
						onClick={() =>
							updateCardStatus(
								isCurrentCardInMyStack ? 'removeFromStack' : 'addToStack',
							)
						}
						disabled={
							isUpdatingStatus || !currentCard?.id || isCurrentCardMastered
						}
						className="rounded bg-emerald-600 px-4 py-2 text-white shadow disabled:opacity-60"
					>
						{isCurrentCardMastered
							? 'Mastered Words Leave My Stack'
							: isCurrentCardInMyStack
								? 'Remove from My Stack'
								: 'Add to My Stack'}
					</button>
				)}
			</div>
		</div>
	)
}
