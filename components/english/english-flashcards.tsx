'use client'

import { EnglishVocab } from '@/lib/vocab'
import Image from 'next/image'
import { useState, useMemo, useEffect, useCallback } from 'react'
import ReactConfetti from 'react-confetti'
import { useAudio, useWindowSize } from 'react-use'
import { toast } from 'sonner'
import { useUserId } from '@/hooks/useUserId'
import {
	applyReview,
	type FlashcardScheduling,
	type ReviewRating,
} from '@/lib/flashcards/scheduler'

type FontChoice = 'arial' | 'times' | 'nunito'

interface EnglishFlashcardsProps {
	data: EnglishVocab[]
	allFields: (keyof EnglishVocab)[]
	currentLesson: string
	courseId: number | null
	layout: string
}

const FONT_SIZE_MAP = {
	s: 16,
	m: 20,
	lg: 28,
	xl: 36,
	twoxl: 48,
	threexl: 72,
} as const

type FontSizeKey = keyof typeof FONT_SIZE_MAP

const FONT_SIZE_LABELS: Record<FontSizeKey, string> = {
	s: 'S',
	m: 'M',
	lg: 'LG',
	xl: 'XL',
	twoxl: '2XL',
	threexl: '3XL',
}

const FIELD_LABELS: Partial<Record<keyof EnglishVocab, string>> = {
	eng: 'English',
	spa: 'Spanish',
	por: 'Portuguese',
	engDefinition: 'Definition',
	gender: 'Gender',
	person: 'Person',
	partOfSpeech: 'Part of Speech',
	ipa: 'IPA (Pronunciation)',
	spaTransliteration: 'Spanish Transliteration',
	porTransliteration: 'Portuguese Transliteration',
	images: 'Image',
	engAudio: 'Audio',
}

const FONT_CLASS_MAP: Record<FontChoice, string> = {
	arial: 'font-arial',
	times: 'font-serif',
	nunito: 'font-nunito',
}

export default function EnglishFlashcards({
	data,
	allFields,
	currentLesson,
	courseId,
	layout,
}: EnglishFlashcardsProps) {
	console.log('Initial data count:', data.length)
	const [selectedType, setSelectedType] = useState<'all' | 'word' | 'phrase'>(
		'word'
	)
	const [selectedLessons, setSelectedLessons] = useState<string[]>([])

	const [frontField, setFrontField] = useState<keyof EnglishVocab>('eng')
	const [backField, setBackField] = useState<keyof EnglishVocab>('eng')
	const [currentIndex, setCurrentIndex] = useState(0)
	const [showBack, setShowBack] = useState(false)
	const [showConfetti, setShowConfetti] = useState(false)
	const [finishAudioElement, _, finishControls] = useAudio({
		src: '/finish.mp3',
	})
	const [filteredCards, setFilteredCards] = useState<EnglishVocab[]>([])
	const [sessionCards, setSessionCards] = useState<EnglishVocab[]>([])
	const [sessionStates, setSessionStates] = useState<
		Array<{ cardId: number; state: FlashcardScheduling }>
	>([])
	const [isLoadingSession, setIsLoadingSession] = useState(false)
	const [isSubmittingReview, setIsSubmittingReview] = useState(false)
	const [sessionTotal, setSessionTotal] = useState(0)
	const [sessionCompleted, setSessionCompleted] = useState(0)
	const [showScheduleEditor, setShowScheduleEditor] = useState(false)
	const [showAdvancedEditor, setShowAdvancedEditor] = useState(false)
	const [showHistory, setShowHistory] = useState(false)
	const [reviewHistory, setReviewHistory] = useState<any[]>([])
	const [isLoadingHistory, setIsLoadingHistory] = useState(false)
	const [historyStats, setHistoryStats] = useState<any | null>(null)
	const [editDueAt, setEditDueAt] = useState('')
	const [editIntervalDays, setEditIntervalDays] = useState('0')
	const [editEase, setEditEase] = useState('2.5')
	const [editState, setEditState] = useState<FlashcardScheduling['state']>('new')
	const [editLearningStep, setEditLearningStep] = useState('0')
	const [editLapses, setEditLapses] = useState('0')
	const [editReps, setEditReps] = useState('0')
	const [sessionSize, setSessionSize] = useState(20)
	const [newRatio, setNewRatio] = useState(0.2)
	const [selectedCategory, setSelectedCategory] = useState<string>('all')

	const [frontFont, setFrontFont] = useState<FontChoice>('nunito')
	const [backFont, setBackFont] = useState<FontChoice>('nunito')

	const [frontFontSize, setFrontFontSize] = useState<FontSizeKey>('xl')
	const [backFontSize, setBackFontSize] = useState<FontSizeKey>('xl')
	const [showCustomize, setShowCustomize] = useState(false)
	const [showFilter, setShowFilter] = useState(false)
	const [audioVolume, setAudioVolume] = useState(1) // full volume
	const [audioSpeed, setAudioSpeed] = useState(1) // normal speed
	const [frontTopLeft, setFrontTopLeft] = useState<keyof EnglishVocab | 'none'>(
		'none'
	)
	const [frontTopCenter, setFrontTopCenter] = useState<
		keyof EnglishVocab | 'none'
	>('none')
	const [frontTopRight, setFrontTopRight] = useState<
		keyof EnglishVocab | 'engAudio'
	>('engAudio')
	const [frontMiddleCenter, setFrontMiddleCenter] = useState<
		keyof EnglishVocab | 'spa'
	>('spa')
	const [frontBottomLeft, setFrontBottomLeft] = useState<
		keyof EnglishVocab | 'none'
	>('none')
	const [frontBottomCenter, setFrontBottomCenter] = useState<
		keyof EnglishVocab | 'none'
	>('none')
	const [frontBottomRight, setFrontBottomRight] = useState<
		keyof EnglishVocab | 'none'
	>('none')
	const [backTopLeft, setBackTopLeft] = useState<keyof EnglishVocab | 'none'>(
		'none'
	)
	const [backTopCenter, setBackTopCenter] = useState<
		keyof EnglishVocab | 'none'
	>('none')
	const [backTopRight, setBackTopRight] = useState<
		keyof EnglishVocab | 'engAudio'
	>('engAudio')
	const [backMiddleCenter, setBackMiddleCenter] = useState<
		keyof EnglishVocab | 'eng'
	>('eng')
	const [backBottomLeft, setBackBottomLeft] = useState<
		keyof EnglishVocab | 'spaTransliteration'
	>('spaTransliteration')
	const [backBottomCenter, setBackBottomCenter] = useState<
		keyof EnglishVocab | 'ipa'
	>('ipa')
	const [backBottomRight, setBackBottomRight] = useState<
		keyof EnglishVocab | 'porTransliteration'
	>('porTransliteration')
	const [isRandomized, setIsRandomized] = useState(false)
	const [filterVersion, setFilterVersion] = useState(0)

	const { isGuest } = useUserId()
	const [useSpacedRepetition, setUseSpacedRepetition] = useState(false)
	const SETTINGS_KEY = 'englishFlashcardsSrsSettings'

	const { width, height } = useWindowSize()

	const PRESETS = [
		{
			label: 'Picture → Word',
			front: { middle: 'images', font: 'sans', size: 'xl' },
			back: { middle: 'eng', font: 'nunito', size: 'xl' },
		},
		{
			label: 'Audio → Picture',
			front: { middle: 'engAudio', font: 'sans', size: 'xl' },
			back: { middle: 'images', font: 'nunito', size: 'xl' },
		},
		{
			label: 'Spa Translation',
			front: { middle: 'spa', font: 'nunito', size: 'xl' },
			back: { middle: 'eng', font: 'nunito', size: 'xl' },
		},
		{
			label: 'Por Translation',
			front: { middle: 'por', font: 'nunito', size: 'xl' },
			back: { middle: 'eng', font: 'nunito', size: 'xl' },
		},
	] as const

	function applyPreset(preset: (typeof PRESETS)[number]) {
		setFrontMiddleCenter(preset.front.middle as keyof EnglishVocab)
		setFrontFont(preset.front.font as FontChoice)
		setFrontFontSize(preset.front.size as FontSizeKey)

		setBackMiddleCenter(preset.back.middle as keyof EnglishVocab)
		setBackFont(preset.back.font as FontChoice)
		setBackFontSize(preset.back.size as FontSizeKey)

		// Reset positions to default for simplicity
		setFrontTopLeft('none')
		setFrontTopCenter('none')
		setFrontTopRight('engAudio')
		setFrontBottomLeft('none')
		setFrontBottomCenter('gender')
		setFrontBottomRight('none')

		setBackTopLeft('none')
		setBackTopCenter('none')
		setBackTopRight('engAudio')
		setBackBottomLeft('spaTransliteration')
		setBackBottomCenter('ipa')
		setBackBottomRight('porTransliteration')
		setShowCustomize(false)
	}

	// Filter to this prefix
	const cardsForPrefix = useMemo(() => data, [data])
	const cardById = useMemo(() => {
		const map = new Map<number, EnglishVocab>()
		for (const card of data) {
			if (card.id != null) map.set(card.id, card)
		}
		return map
	}, [data])

	useEffect(() => {
		setUseSpacedRepetition(!isGuest)
	}, [isGuest])

	useEffect(() => {
		if (typeof window === 'undefined') return
		if (!isGuest) return
		const raw = window.localStorage.getItem(SETTINGS_KEY)
		if (!raw) return
		try {
			const parsed = JSON.parse(raw)
			if (typeof parsed?.sessionSize === 'number') {
				setSessionSize(Math.max(5, Math.min(100, parsed.sessionSize)))
			}
			if (typeof parsed?.newRatio === 'number') {
				const clamped = Math.min(Math.max(parsed.newRatio, 0), 0.5)
				setNewRatio(clamped)
			}
		} catch (error) {
			console.error('Failed to load SRS settings', error)
		}
	}, [isGuest])

	useEffect(() => {
		if (typeof window === 'undefined') return
		if (!isGuest) return
		const payload = JSON.stringify({ sessionSize, newRatio })
		window.localStorage.setItem(SETTINGS_KEY, payload)
	}, [isGuest, newRatio, sessionSize])

	useEffect(() => {
		if (isGuest || !useSpacedRepetition) return
		let isMounted = true
		if (!courseId) return
		fetch(`/api/flashcards/settings?courseId=${courseId}&language=en`)
			.then((res) => res.json())
			.then((payload) => {
				if (!isMounted) return
				const settings = payload?.settings
				if (!settings) return
				if (typeof settings.sessionSize === 'number') {
					setSessionSize(Math.max(5, Math.min(100, settings.sessionSize)))
				}
				if (typeof settings.newRatio === 'number') {
					setNewRatio(Math.min(Math.max(settings.newRatio, 0), 0.5))
				}
			})
			.catch((error) => {
				console.error('Failed to load flashcard settings', error)
			})
		return () => {
			isMounted = false
		}
	}, [courseId, isGuest, useSpacedRepetition])

	useEffect(() => {
		if (isGuest || !useSpacedRepetition) return
		if (!courseId) return
		const timer = window.setTimeout(() => {
			fetch('/api/flashcards/settings', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					courseId,
					language: 'en',
					sessionSize,
					newRatio,
				}),
			}).catch((error) => {
				console.error('Failed to save flashcard settings', error)
			})
		}, 500)
		return () => window.clearTimeout(timer)
	}, [courseId, isGuest, newRatio, sessionSize, useSpacedRepetition])

	const fetchSession = useCallback(async () => {
		if (isGuest || !useSpacedRepetition || !courseId) return
		setIsLoadingSession(true)
		try {
			const res = await fetch(
				`/api/flashcards/session?courseId=${courseId}&language=en&limit=${sessionSize}&newRatio=${newRatio}`
			)
			const payload = await res.json()
			const rawRows = payload.cards ?? []
			const nextCards = rawRows
				.map((row: { cardId: number }) => cardById.get(row.cardId))
				.filter(Boolean) as EnglishVocab[]
			const nextStates = rawRows
				.map((row: any) => {
					if (!row?.cardId) return null
					return {
						cardId: row.cardId,
						state: {
							state: row.state,
							dueAt: new Date(row.dueAt),
							learningStep: row.learningStep ?? 0,
							intervalDays: row.intervalDays ?? 0,
							ease: row.ease ?? 2.5,
							reps: row.reps ?? 0,
							lapses: row.lapses ?? 0,
							leech: row.leech ?? false,
							lastReviewedAt: row.lastReviewedAt
								? new Date(row.lastReviewedAt)
								: null,
						} as FlashcardScheduling,
					}
				})
				.filter(Boolean) as Array<{ cardId: number; state: FlashcardScheduling }>
			setSessionCards(nextCards)
			setSessionStates(nextStates)
			setSessionTotal(sessionSize)
			setSessionCompleted(0)
			setCurrentIndex(0)
			setShowBack(false)
		} catch (error) {
			console.error('Failed to load flashcard session', error)
		} finally {
			setIsLoadingSession(false)
		}
	}, [cardById, courseId, isGuest, newRatio, sessionSize, useSpacedRepetition])

	useEffect(() => {
		if (useSpacedRepetition && !isGuest) {
			fetchSession()
		}
	}, [fetchSession, isGuest, useSpacedRepetition])

	useEffect(() => {
		if (useSpacedRepetition && !isGuest) {
			setFilteredCards(sessionCards)
			setCurrentIndex(0)
			setShowBack(false)
		}
	}, [isGuest, sessionCards, useSpacedRepetition])

	// Collect lesson keys like 'awb1' and sort numerically by suffix
	function parseLessonKey(key: string) {
		// Separate number and text parts
		const match = key.match(/^(\d+)?([a-zA-Z]*)$/)
		if (!match) return { num: NaN, text: key }
		return {
			num: match[1] ? parseInt(match[1], 10) : NaN,
			text: match[2] || (match[1] ? '' : key), // text part if present
		}
	}

	const lessonOptions = useMemo(() => {
		const allLessons = cardsForPrefix.flatMap((card) => card.lessons)
		const uniqueLessons = Array.from(new Set(allLessons))

		return uniqueLessons.sort((a, b) => {
			const A = parseLessonKey(a)
			const B = parseLessonKey(b)

			// Sort by number if both have numbers
			if (!isNaN(A.num) && !isNaN(B.num)) {
				if (A.num !== B.num) return A.num - B.num
				return A.text.localeCompare(B.text)
			}

			// Numbers come before pure strings
			if (!isNaN(A.num) && isNaN(B.num)) return -1
			if (isNaN(A.num) && !isNaN(B.num)) return 1

			// Both are pure strings → alphabetical
			return a.localeCompare(b)
		})
	}, [cardsForPrefix])

	useEffect(() => {
		if (!currentLesson) return

		const currentParsed = parseLessonKey(currentLesson)

		const allLessonsUpToCurrent = lessonOptions.filter((lesson) => {
			const lParsed = parseLessonKey(lesson)

			// Both numeric
			if (!isNaN(currentParsed.num) && !isNaN(lParsed.num)) {
				if (lParsed.num < currentParsed.num) return true
				if (lParsed.num > currentParsed.num) return false
				return lParsed.text <= currentParsed.text
			}

			// If current is number and lesson is string → exclude
			if (!isNaN(currentParsed.num) && isNaN(lParsed.num)) return false

			// If current is string, include only strings <= current alphabetically
			if (isNaN(currentParsed.num) && isNaN(lParsed.num)) {
				return lesson.localeCompare(currentLesson) <= 0
			}

			return false
		})

		setSelectedLessons(allLessonsUpToCurrent)
	}, [currentLesson, lessonOptions])

	const categoryOptions = useMemo(() => {
		const all = cardsForPrefix
			.map((card) => card.category)
			.filter((c): c is string => typeof c === 'string')
		const unique = Array.from(new Set(all))
		return unique.sort()
	}, [cardsForPrefix])

	useEffect(() => {
		if (useSpacedRepetition && !isGuest) return
		const newFiltered = cardsForPrefix.filter((card) => {
			const matchesSelectedLesson =
				selectedLessons.length === 0 ||
				card.lessons.some((l) => selectedLessons.includes(l))

			const matchesType = selectedType === 'all' || card.type === selectedType
			const matchesCategory =
				selectedCategory === 'all' || card.category === selectedCategory

			const hasMiddleFrontImage =
				frontMiddleCenter !== 'images' || card.images.length > 0
			const hasMiddleFrontAudio =
				frontMiddleCenter !== 'engAudio' || !!card.engAudio

			const hasMiddleBackImage =
				backMiddleCenter !== 'images' || card.images.length > 0
			const hasMiddleBackAudio =
				backMiddleCenter !== 'engAudio' || !!card.engAudio

			const hasValidFront =
				(frontField === 'images' && card.images.length > 0) ||
				(frontField === 'engAudio' && !!card.engAudio) ||
				(frontField !== 'images' &&
					frontField !== 'engAudio' &&
					!!card[frontField])

			const hasValidBack =
				(backField === 'images' && card.images.length > 0) ||
				(backField === 'engAudio' && !!card.engAudio) ||
				(backField !== 'images' &&
					backField !== 'engAudio' &&
					!!card[backField])

			return (
				matchesSelectedLesson &&
				matchesType &&
				matchesCategory &&
				hasValidFront &&
				hasValidBack &&
				hasMiddleFrontImage &&
				hasMiddleBackImage &&
				hasMiddleFrontAudio &&
				hasMiddleBackAudio
			)
		})

		// ✅ Keep cards in order unless randomized
		const finalCards = isRandomized
			? [...newFiltered].sort(() => Math.random() - 0.5)
			: newFiltered

		setFilteredCards(finalCards)
		setCurrentIndex(0)
		setShowBack(false)
	}, [
		cardsForPrefix,
		selectedLessons,
		selectedType,
		selectedCategory,
		frontField,
		backField,
		frontMiddleCenter,
		backMiddleCenter,
		isRandomized,
		filterVersion,
		isGuest,
		useSpacedRepetition,
	])

	const currentCard = filteredCards[currentIndex]

	//TODO add award points

	function playWithBoostedVolume(url: string, volume: number, speed: number) {
		const audioContext = new (window.AudioContext ||
			(window as any).webkitAudioContext)()
		const audio = new Audio(url)
		audio.crossOrigin = 'anonymous'
		audio.playbackRate = speed

		const source = audioContext.createMediaElementSource(audio)
		const gainNode = audioContext.createGain()

		// Allow volume up to 2.0 (200%)
		gainNode.gain.value = Math.min(volume, 2.0)

		source.connect(gainNode).connect(audioContext.destination)
		audio.play().catch(console.error)
	}

	// Refs for controlling playback programmatically
	const frontAudioRef = useMemo(() => {
		if (frontField === 'engAudio' && currentCard?.engAudio)
			return new Audio(currentCard.engAudio)
		return null
	}, [frontField, currentCard])

	const backAudioRef = useMemo(() => {
		if (backField === 'engAudio' && currentCard?.engAudio)
			return new Audio(currentCard.engAudio)
		return null
	}, [backField, currentCard])

	const fontOptions: {
		value: FontChoice
		label: string
		className: string
	}[] = [
		{ value: 'times', label: 'Times', className: 'font-serif' },
		{ value: 'arial', label: 'Arial', className: 'font-arial' },
		{
			value: 'nunito',
			label: 'Nunito',
			className: 'font-nunito',
		},
	]

	//AUTO PLAY OF ALL CARDS
	// useEffect(() => {
	// 	const isFrontAudio = [
	// 		frontTopLeft,
	// 		frontTopCenter,
	// 		frontTopRight,
	// 		frontMiddleCenter,
	// 		frontBottomLeft,
	// 		frontBottomCenter,
	// 		frontBottomRight,
	// 	].includes('engAudio')

	// 	if (isFrontAudio && currentCard?.engAudio) {
	// 		const audio = new Audio(currentCard.engAudio)
	// 		audio.volume = audioVolume
	// 		audio.playbackRate = audioSpeed
	// 		audio.play().catch(console.error)
	// 	}
	// }, [
	// 	currentCard,
	// 	frontTopLeft,
	// 	frontTopCenter,
	// 	frontTopRight,
	// 	frontMiddleCenter,
	// 	frontBottomLeft,
	// 	frontBottomCenter,
	// 	frontBottomRight,
	// 	audioVolume,
	// 	audioSpeed,
	// ])

	useEffect(() => {
		if (frontMiddleCenter === 'engAudio' && currentCard?.engAudio) {
			playWithBoostedVolume(currentCard.engAudio, audioVolume, audioSpeed)
		}
	}, [currentCard, frontMiddleCenter, audioVolume, audioSpeed])

	useEffect(() => {
		if (showBack && backField === 'engAudio' && backAudioRef) {
			backAudioRef.play().catch(console.error)
		}
	}, [showBack, backField, backAudioRef])

	function handleNextCard() {
		if (useSpacedRepetition && !isGuest) return
		setShowBack(false) // flip to front first

		// Wait for flip animation to complete before changing the card
		setTimeout(() => {
			const nextIndex = currentIndex + 1
			if (nextIndex >= filteredCards.length) {
				setShowConfetti(true)
				finishControls.play()
				toast.success('Session complete! Great work.')
				setTimeout(() => setShowConfetti(false), 12000)
			}
			setCurrentIndex(nextIndex % filteredCards.length)
		}, 700) // ⏱ adjust this to match your card flip duration
	}

	function handlePreviousCard() {
		if (useSpacedRepetition && !isGuest) return
		setShowBack(false)

		setTimeout(() => {
			setCurrentIndex(
				(prev) => (prev - 1 + filteredCards.length) % filteredCards.length
			)
		}, 700) // match the flip animation duration
	}

	function formatIntervalDays(days: number) {
		if (!Number.isFinite(days)) return ''
		if (days < 1 / 24) return 'minutes'
		if (days < 1) return `${Math.round(days * 24)}h`
		if (days < 7) return `${Math.round(days)}d`
		if (days < 30) return `${Math.round(days / 7)}w`
		if (days < 365) return `${Math.round(days / 30)}mo`
		return `${Math.round(days / 365)}y`
	}

	const currentSessionState = sessionStates[currentIndex]?.state ?? null

	const fetchHistory = useCallback(async () => {
		if (isGuest || !useSpacedRepetition || !currentCard?.id || !courseId) return
		setIsLoadingHistory(true)
		try {
			const res = await fetch(
				`/api/flashcards/history?courseId=${courseId}&language=en&cardId=${currentCard.id}&limit=10`
			)
			const payload = await res.json()
			setReviewHistory(payload.history ?? [])
			setHistoryStats(payload.stats ?? null)
		} catch (error) {
			console.error('Failed to load review history', error)
		} finally {
			setIsLoadingHistory(false)
		}
	}, [courseId, currentCard?.id, isGuest, useSpacedRepetition])

	useEffect(() => {
		if (!showHistory) return
		fetchHistory()
	}, [fetchHistory, showHistory, currentCard?.id])

	function formatSuccessRate(stats: any | null) {
		const total = Number(stats?.total ?? 0)
		if (!Number.isFinite(total) || total <= 0) return '—'
		const success = Number(stats?.good ?? 0) + Number(stats?.easy ?? 0)
		return `${Math.round((success / total) * 100)}%`
	}

	function formatAvgInterval(stats: any | null) {
		const days = Number(stats?.avgNextInterval)
		if (!Number.isFinite(days)) return '—'
		if (days < 1) return `${Math.round(days * 24)}h`
		if (days < 7) return `${Math.round(days)}d`
		if (days < 30) return `${Math.round(days / 7)}w`
		if (days < 365) return `${Math.round(days / 30)}mo`
		return `${Math.round(days / 365)}y`
	}
	useEffect(() => {
		if (!currentSessionState) return
		setEditDueAt(currentSessionState.dueAt.toISOString().slice(0, 16))
		setEditIntervalDays(String(currentSessionState.intervalDays ?? 0))
		setEditEase(String(currentSessionState.ease ?? 2.5))
		setEditState(currentSessionState.state)
		setEditLearningStep(String(currentSessionState.learningStep ?? 0))
		setEditLapses(String(currentSessionState.lapses ?? 0))
		setEditReps(String(currentSessionState.reps ?? 0))
	}, [currentSessionState])

	const previewByRating = useMemo(() => {
		if (!currentSessionState) return null
		const now = new Date()
		const ratings: ReviewRating[] = ['again', 'hard', 'good', 'easy']
		const previews: Record<ReviewRating, string> = {
			again: '',
			hard: '',
			good: '',
			easy: '',
		}
		for (const rating of ratings) {
			const { next } = applyReview(currentSessionState, rating, now)
			previews[rating] = formatIntervalDays(next.intervalDays)
		}
		return previews
	}, [currentSessionState])

	async function handleGrade(rating: ReviewRating) {
		if (isGuest || !useSpacedRepetition || !currentCard?.id || !courseId) return
		if (isSubmittingReview) return
		setIsSubmittingReview(true)
		try {
			const res = await fetch('/api/flashcards/review', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					cardId: currentCard.id,
					courseId,
					language: 'en',
					rating,
				}),
			})
			const payload = await res.json()
			if (payload?.next?.leech && payload?.next?.state === 'suspended') {
				toast.info('This card became a leech and was suspended.')
			}
			setSessionCompleted((prev) => prev + 1)
			setSessionCards((prev) => {
				const next = prev.filter((_, idx) => idx !== currentIndex)
				const nextIndex = Math.min(currentIndex, next.length - 1)
				setCurrentIndex(nextIndex < 0 ? 0 : nextIndex)
				if (next.length === 0) {
					toast.success('Session complete! Great work.')
					fetchSession()
				}
				return next
			})
			setSessionStates((prev) => prev.filter((_, idx) => idx !== currentIndex))
			setShowBack(false)
		} catch (error) {
			console.error('Failed to submit review', error)
		} finally {
			setIsSubmittingReview(false)
		}
	}

	async function updateSchedule(
		action: 'reset' | 'suspend' | 'unsuspend' | 'update'
	) {
		if (isGuest || !currentCard?.id || !courseId) return
		try {
			const payload =
				action === 'update'
					? {
							action,
							cardId: currentCard.id,
							courseId,
							language: 'en',
							updates: {
								dueAt: new Date(editDueAt).toISOString(),
								intervalDays: Number(editIntervalDays),
								ease: Number(editEase),
								state: editState,
								learningStep: Number(editLearningStep),
								lapses: Number(editLapses),
								reps: Number(editReps),
							},
					  }
					: {
							action,
							cardId: currentCard.id,
							courseId,
							language: 'en',
					  }

			await fetch('/api/flashcards/update', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			})
			await fetchSession()
		} catch (error) {
			console.error('Failed to update schedule', error)
		}
	}

	function toggleLesson(lesson: string) {
		setSelectedLessons((prev) =>
			prev.includes(lesson)
				? prev.filter((l) => l !== lesson)
				: [...prev, lesson]
		)
	}

	// Auto set optimal font size on load
	useEffect(() => {
		const width = window.innerWidth
		if (width < 400) {
			setFrontFontSize('xl')
			setBackFontSize('xl')
		} else if (width < 768) {
			setFrontFontSize('xl')
			setBackFontSize('xl')
		} else {
			setFrontFontSize('xl')
			setBackFontSize('xl')
		}
	}, [])

	const miniPositionFields: (keyof EnglishVocab)[] = [
		'eng',
		'ipa',
		'engAudio',
		'gender',
		'person',
		'number',
		'spa',
		'por',
		'spaTransliteration',
		'porTransliteration',
	]

	function getAdaptiveFontSize(text: string, baseSize: FontSizeKey): number {
		if (text.length > 40) return FONT_SIZE_MAP.s
		if (text.length > 30) return FONT_SIZE_MAP.m
		if (text.length > 20) return FONT_SIZE_MAP.lg
		if (text.length > 15) return FONT_SIZE_MAP.xl
		return FONT_SIZE_MAP[baseSize]
	}

	function fixHebrewPunctuation(text: string): string {
		// Replace ? at the end of a line with RTL-friendly question mark
		// Only if the text contains Hebrew characters
		const hebrewRegex = /[\u0590-\u05FF]/ // matches Hebrew script
		if (!hebrewRegex.test(text)) return text

		// Replace ? at the end or before a line break
		return text.replace(/\?/g, '؟') // Arabic-style RTL question mark
	}

	function renderMiniContent(
		field: keyof EnglishVocab | 'none',
		isMiddle = false
	) {
		if (!currentCard || field === 'none') return null

		const value = currentCard[field]

		if (field === 'images' && Array.isArray(value)) {
			if (value.length > 0) {
				const imageUrl = value[0]
				return (
					//TODO fix the console errors of position
					<div
						className={
							isMiddle
								? 'w-full h-full flex items-center justify-center'
								: 'w-full h-32 flex items-center justify-center'
						}
					>
						<Image
							src={imageUrl}
							alt="EnglishVocab image"
							fill={isMiddle} // ✅ This enables full-size scaling
							className="object-contain rounded"
							sizes="(max-width: 768px) 100vw, 50vw"
						/>
					</div>
				)
			}

			if (currentCard.engAudio) {
				return (
					<div className="flex flex-col items-center gap-2">
						<button
							className="text-3xl text-sky-600 hover:text-sky-800"
							onClick={(e) => {
								e.stopPropagation()
								playWithBoostedVolume(
									currentCard.engAudio || '',
									audioVolume,
									audioSpeed
								)
							}}
						>
							🔊
						</button>
						<span className="text-xs text-slate-500">No image</span>
					</div>
				)
			}

			if (currentCard.eng) {
				return (
					<div className="flex flex-col items-center gap-2">
						<span className={isMiddle ? 'text-xl font-semibold' : ''}>
							{currentCard.eng}
						</span>
						<span className="text-xs text-slate-500">No image</span>
					</div>
				)
			}

			return null
		}

		if (!value) return null

		if (field === 'engAudio' && typeof value === 'string') {
			return (
				<button
					className="text-3xl text-sky-600 hover:text-sky-800"
					onClick={(e) => {
						e.stopPropagation()
						playWithBoostedVolume(
							currentCard.engAudio || '',
							audioVolume,
							audioSpeed
						)
					}}
				>
					🔊
				</button>
			)
		}

		if (Array.isArray(value)) {
			return value.join(', ')
		}

		const className = !isMiddle ? 'font-serif text-lg' : ''

		return (
			<span className={className}>{fixHebrewPunctuation(value as string)}</span>
		)
	}

	const stringLessons = useMemo(() => {
		return lessonOptions.filter((lesson) => isNaN(parseLessonKey(lesson).num))
	}, [lessonOptions])

	// Group lessons into ranges of 10
	const lessonRanges = useMemo(() => {
		// Get only numeric lessons
		const numericLessons = lessonOptions
			.map((lesson) => ({ lesson, ...parseLessonKey(lesson) }))
			.filter((l) => !isNaN(l.num))

		if (numericLessons.length === 0) return [] // No ranges if all are strings

		const maxNum = Math.max(...numericLessons.map((l) => l.num))
		const ranges = []

		for (let i = 1; i <= maxNum; i += 10) {
			const start = i
			const end = i + 9

			const lessonsInRange = numericLessons
				.filter((l) => l.num >= start && l.num <= end)
				.map((l) => l.lesson)

			if (lessonsInRange.length > 0) {
				ranges.push({ label: `${start}-${end}`, lessons: lessonsInRange })
			}
		}

		return ranges
	}, [lessonOptions])

	return (
		<div className="p-4 max-w-3xl mx-auto text-center w-full">
			{finishAudioElement}

			{showConfetti && (
				<ReactConfetti
					width={width}
					height={height}
					recycle={false}
					numberOfPieces={500}
					tweenDuration={10000}
				/>
			)}

			{/* Customize Section Toggle */}
			<div className="mb-6 flex justify-center gap-4">
				{!isGuest && (
					<button
						onClick={() => setUseSpacedRepetition((prev) => !prev)}
						className={`px-4 py-2 rounded shadow flex items-center justify-center gap-3 ${
							useSpacedRepetition ? 'bg-emerald-600 text-white' : 'bg-gray-200'
						}`}
					>
						<span className="text-lg font-semibold">
							{useSpacedRepetition ? 'Spaced Repetition On' : 'Spaced Repetition Off'}
						</span>
					</button>
				)}
				<button
					onClick={() => setShowCustomize((prev) => !prev)}
					className={`px-4 py-2 rounded shadow flex items-center justify-center gap-4 ${
						showCustomize ? 'bg-sky-600 text-white' : 'bg-gray-200'
					}`}
				>
					<Image
						src="/woman-artist-light-skin-tone-svgrepo-com.svg"
						alt="Filter icon"
						width={30}
						height={30}
						className=""
					/>
					Customize
				</button>
				{!useSpacedRepetition && (
					<button
						onClick={() => setShowFilter((prev) => !prev)}
						className={`px-4 py-2 rounded shadow flex items-center justify-center gap-4 ${
							showFilter ? 'bg-sky-600 text-white' : 'bg-gray-200'
						}`}
					>
						<Image
							src="/books-svgrepo-com.svg"
							alt="Filter icon"
							width={30}
							height={30}
							className=""
						/>
						Filter
					</button>
				)}
			</div>

			{useSpacedRepetition && !isGuest && (
				<div className="mb-6 w-full max-w-xl mx-auto border rounded-lg p-4 bg-slate-50">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
						<label className="text-sm">
							Session Size
							<input
								type="number"
								min={5}
								max={100}
								step={1}
								value={sessionSize}
								onChange={(e) =>
									setSessionSize(Math.max(5, Math.min(100, Number(e.target.value))))
								}
								className="mt-1 w-full border rounded px-2 py-1"
							/>
						</label>
						<label className="text-sm">
							New Card Ratio
							<div className="mt-2 flex items-center gap-3">
								<input
									type="range"
									min={0}
									max={50}
									step={5}
									value={Math.round(newRatio * 100)}
									onChange={(e) => setNewRatio(Number(e.target.value) / 100)}
									className="w-full accent-sky-600"
								/>
								<span className="text-sm text-slate-600 w-12 text-right">
									{Math.round(newRatio * 100)}%
								</span>
							</div>
						</label>
					</div>
				</div>
			)}

			<div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-6">
				<div className="text-sm">
					<label className="block mb-1 font-medium">Volume</label>
					<input
						type="range"
						min="0"
						max="2"
						step="0.05"
						value={audioVolume}
						onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
					/>
					<div className="text-center">{Math.round(audioVolume * 100)}%</div>
				</div>
				<div className="text-sm">
					<label className="block mb-1 font-medium">Audio Speed</label>
					<input
						type="range"
						min="0.5"
						max="1"
						step="0.05"
						value={audioSpeed}
						onChange={(e) => setAudioSpeed(parseFloat(e.target.value))}
					/>
					<div className="text-center">{audioSpeed.toFixed(1)}x</div>
				</div>
			</div>

			{/* Front/Back Customization (Hidden Until Clicked) */}
			{showCustomize && (
				<>
					<div className="mb-4 flex flex-wrap justify-center gap-3">
						<span className="my-auto font-semibold">Presets:</span>
						{PRESETS.map((preset) => (
							<button
								key={preset.label}
								onClick={() => applyPreset(preset)}
								className="px-3 py-2 bg-purple-500 text-white rounded shadow hover:bg-violet-600"
							>
								{preset.label}
							</button>
						))}
					</div>
					<div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="grid grid-cols-3 gap-4 rounded-md p-4 border">
							<div className="font-bold text-center col-span-3 text-xl">
								Front of Card Customization
							</div>
							<div>
								<label className="block text-sm font-medium">Top Left</label>
								<select
									className="w-full p-2 border rounded"
									value={frontTopLeft}
									onChange={(e) =>
										setFrontTopLeft(e.target.value as keyof EnglishVocab)
									}
								>
									<option value="none">None</option>

									{miniPositionFields.map((field) => (
										<option key={field} value={field}>
											{FIELD_LABELS[field] || field}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium">Top Center</label>
								<select
									className="w-full p-2 border rounded"
									value={frontTopCenter}
									onChange={(e) =>
										setFrontTopCenter(e.target.value as keyof EnglishVocab)
									}
								>
									<option value="none">None</option>
									{miniPositionFields.map((field) => (
										<option key={field} value={field}>
											{FIELD_LABELS[field] || field}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium">Top Right</label>
								<select
									className="w-full p-2 border rounded"
									value={frontTopRight}
									onChange={(e) =>
										setFrontTopRight(e.target.value as keyof EnglishVocab)
									}
								>
									<option value="none">None</option>
									{miniPositionFields.map((field) => (
										<option key={field} value={field}>
											{FIELD_LABELS[field] || field}
										</option>
									))}
								</select>
							</div>
							<div className="col-span-3">
								<label className="block text-sm font-medium">
									Middle Center
								</label>
								<select
									className="w-full p-2 border rounded"
									value={frontMiddleCenter}
									onChange={(e) =>
										setFrontMiddleCenter(e.target.value as keyof EnglishVocab)
									}
								>
									<option value="none">None</option>
									{allFields.map((field) => (
										<option key={field} value={field}>
											{FIELD_LABELS[field] || field}
										</option>
									))}
								</select>
							</div>
							<div className="flex gap-2 flex-wrap justify-between mt-1 col-span-3">
								{fontOptions.map(({ label, value, className }) => (
									<button
										key={value}
										type="button"
										onClick={() => setFrontFont(value)}
										className={`px-4 py-1 border rounded-full text-sm ${
											frontFont === value
												? 'bg-sky-600 text-white'
												: 'bg-gray-100'
										} ${className}`}
									>
										{label}
									</button>
								))}
							</div>
							<div className="col-span-3">
								<label className="block text-sm font-medium">Size</label>
								<select
									className="w-full p-2 border rounded"
									value={frontFontSize}
									onChange={(e) =>
										setFrontFontSize(e.target.value as FontSizeKey)
									}
								>
									{Object.keys(FONT_SIZE_MAP).map((size) => (
										<option key={size} value={size}>
											{FONT_SIZE_LABELS[size as FontSizeKey]}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium">Bottom Left</label>
								<select
									className="w-full p-2 border rounded"
									value={frontBottomLeft}
									onChange={(e) =>
										setFrontBottomLeft(e.target.value as keyof EnglishVocab)
									}
								>
									<option value="none">None</option>
									{miniPositionFields.map((field) => (
										<option key={field} value={field}>
											{FIELD_LABELS[field] || field}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium">
									Bottom Center
								</label>
								<select
									className="w-full p-2 border rounded"
									value={frontBottomCenter}
									onChange={(e) =>
										setFrontBottomCenter(e.target.value as keyof EnglishVocab)
									}
								>
									<option value="none">None</option>
									{miniPositionFields.map((field) => (
										<option key={field} value={field}>
											{FIELD_LABELS[field] || field}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium">
									Bottom Right
								</label>
								<select
									className="w-full p-2 border rounded"
									value={frontBottomRight}
									onChange={(e) =>
										setFrontBottomRight(e.target.value as keyof EnglishVocab)
									}
								>
									<option value="none">None</option>
									{miniPositionFields.map((field) => (
										<option key={field} value={field}>
											{FIELD_LABELS[field] || field}
										</option>
									))}
								</select>
							</div>
						</div>
						<div className="grid grid-cols-3 gap-4 bg-sky-100 p-4 rounded-md">
							<div className="font-bold text-center col-span-3 text-xl">
								Back of Card Customization
							</div>
							<div>
								<label className="block text-sm font-medium">Top Left</label>
								<select
									className="w-full p-2 border rounded"
									value={backTopLeft}
									onChange={(e) =>
										setBackTopLeft(e.target.value as keyof EnglishVocab)
									}
								>
									<option value="none">None</option>
									{miniPositionFields.map((field) => (
										<option key={field} value={field}>
											{FIELD_LABELS[field] || field}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium">Top Center</label>
								<select
									className="w-full p-2 border rounded"
									value={backTopCenter}
									onChange={(e) =>
										setBackTopCenter(e.target.value as keyof EnglishVocab)
									}
								>
									<option value="none">None</option>
									{miniPositionFields.map((field) => (
										<option key={field} value={field}>
											{FIELD_LABELS[field] || field}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium">Top Right</label>
								<select
									className="w-full p-2 border rounded"
									value={backTopRight}
									onChange={(e) =>
										setBackTopRight(e.target.value as keyof EnglishVocab)
									}
								>
									<option value="none">None</option>
									{miniPositionFields.map((field) => (
										<option key={field} value={field}>
											{FIELD_LABELS[field] || field}
										</option>
									))}
								</select>
							</div>
							<div className="col-span-3">
								<label className="block text-sm font-medium">
									Middle Center
								</label>
								<select
									className="w-full p-2 border rounded"
									value={backMiddleCenter}
									onChange={(e) =>
										setBackMiddleCenter(e.target.value as keyof EnglishVocab)
									}
								>
									<option value="none">None</option>
									{allFields.map((field) => (
										<option key={field} value={field}>
											{FIELD_LABELS[field] || field}
										</option>
									))}
								</select>
							</div>
							<div className="flex gap-2 flex-wrap justify-between mt-1 col-span-3">
								{fontOptions.map(({ label, value, className }) => (
									<button
										key={value}
										type="button"
										onClick={() => setBackFont(value)}
										className={`px-4 py-1 border rounded-full text-sm ${
											backFont === value
												? 'bg-sky-600 text-white'
												: 'bg-gray-100'
										} ${className}`}
									>
										{label}
									</button>
								))}
							</div>
							<div className="col-span-3">
								<label className="block text-sm font-medium">Size</label>
								<select
									className="w-full p-2 border rounded"
									value={backFontSize}
									onChange={(e) =>
										setBackFontSize(e.target.value as FontSizeKey)
									}
								>
									{Object.keys(FONT_SIZE_MAP).map((size) => (
										<option key={size} value={size}>
											{FONT_SIZE_LABELS[size as FontSizeKey]}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium">Bottom Left</label>
								<select
									className="w-full p-2 border rounded"
									value={backBottomLeft}
									onChange={(e) =>
										setBackBottomLeft(e.target.value as keyof EnglishVocab)
									}
								>
									<option value="none">None</option>
									{miniPositionFields.map((field) => (
										<option key={field} value={field}>
											{FIELD_LABELS[field] || field}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium">
									Bottom Center
								</label>
								<select
									className="w-full p-2 border rounded"
									value={backBottomCenter}
									onChange={(e) =>
										setBackBottomCenter(e.target.value as keyof EnglishVocab)
									}
								>
									<option value="none">None</option>
									{miniPositionFields.map((field) => (
										<option key={field} value={field}>
											{FIELD_LABELS[field] || field}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium">
									Bottom Right
								</label>
								<select
									className="w-full p-2 border rounded"
									value={backBottomRight}
									onChange={(e) =>
										setBackBottomRight(e.target.value as keyof EnglishVocab)
									}
								>
									<option value="none">None</option>
									{miniPositionFields.map((field) => (
										<option key={field} value={field}>
											{FIELD_LABELS[field] || field}
										</option>
									))}
								</select>
							</div>
						</div>
					</div>
				</>
			)}

			{showFilter && !useSpacedRepetition && (
				<>
					<div className="mb-4">
						<h2 className="text-xl font-semibold">Select Type</h2>
						<div className="flex flex-wrap justify-center gap-2">
							{['all', 'word', 'phrase'].map((typeOption) => (
								<button
									key={typeOption}
									onClick={() =>
										setSelectedType(typeOption as 'all' | 'word' | 'phrase')
									}
									className={`px-3 py-1 border rounded-full text-sm ${
										selectedType === typeOption
											? 'bg-sky-600 text-white'
											: 'bg-gray-200'
									}`}
								>
									{typeOption.charAt(0).toUpperCase() + typeOption.slice(1)}
								</button>
							))}
						</div>
					</div>
					<div className="mb-4">
						<h2 className="text-xl font-semibold">Select Category</h2>
						<div className="flex flex-wrap justify-center gap-2">
							<button
								onClick={() => setSelectedCategory('all')}
								className={`px-3 py-1 border rounded-full text-sm ${
									selectedCategory === 'all'
										? 'bg-sky-600 text-white'
										: 'bg-gray-200'
								}`}
							>
								All
							</button>
							{categoryOptions.map((pos) => (
								<button
									key={pos}
									onClick={() => setSelectedCategory(pos)}
									className={`px-3 py-1 border rounded-full text-sm ${
										selectedCategory === pos
											? 'bg-sky-600 text-white'
											: 'bg-gray-200'
									}`}
								>
									{pos}
								</button>
							))}
						</div>
					</div>
					<div className="mb-4">
						<h2 className="text-xl font-semibold mb-2">Select Lessons</h2>

						{/* Lesson Buttons */}
						<div className="flex flex-wrap justify-center gap-2">
							{/* Clear All Button */}
							<button
								onClick={() => setSelectedLessons([])}
								className="px-3 py-1 border rounded-full text-sm bg-red-100 hover:bg-red-200"
							>
								Clear All
							</button>

							{/* All Button */}
							<button
								onClick={() => setSelectedLessons([...lessonOptions])}
								className={`px-3 py-1 border rounded-full text-sm ${
									selectedLessons.length === lessonOptions.length
										? 'bg-sky-600 text-white'
										: 'bg-gray-200'
								}`}
							>
								All
							</button>

							{/* Range Buttons */}
							{lessonRanges.map((range) => (
								<button
									key={range.label}
									onClick={() =>
										setSelectedLessons((prev) => {
											// Toggle all lessons in this range
											const allSelected = range.lessons.every((l) =>
												prev.includes(l)
											)
											if (allSelected) {
												// Remove all lessons in this range
												return prev.filter((l) => !range.lessons.includes(l))
											} else {
												// Add missing lessons
												const newSet = new Set([...prev, ...range.lessons])
												return Array.from(newSet)
											}
										})
									}
									className={`px-3 py-1 border rounded-full text-sm ${
										range.lessons.every((l) => selectedLessons.includes(l))
											? 'bg-sky-600 text-white'
											: 'bg-gray-200'
									}`}
								>
									{range.label}
								</button>
							))}

							{/* Individual Lesson Buttons */}
							{lessonOptions.map((lesson) => {
								const label = lesson
								const isSelected = selectedLessons.includes(lesson)
								return (
									<button
										key={lesson}
										onClick={() => toggleLesson(lesson)}
										className={`px-3 py-1 border rounded-full text-sm ${
											isSelected ? 'bg-sky-600 text-white' : 'bg-gray-200'
										}`}
									>
										{label}
									</button>
								)
							})}

							{/* {stringLessons.length > 0 && (
                <button
                  onClick={() =>
                    setSelectedLessons((prev) => {
                      const allSelected = stringLessons.every((l) =>
                        prev.includes(l)
                      )
                      if (allSelected) {
                        return prev.filter((l) => !stringLessons.includes(l))
                      } else {
                        return Array.from(new Set([...prev, ...stringLessons]))
                      }
                    })
                  }
                  className={`px-3 py-1 border rounded-full text-sm ${
                    stringLessons.every((l) => selectedLessons.includes(l))
                      ? 'bg-sky-600 text-white'
                      : 'bg-gray-200'
                  }`}
                >
                  Other Lessons
                </button>
              )} */}

							<div className="flex items-center justify-center mt-4 gap-2">
								{!isRandomized ? (
									<button
										onClick={() => {
											setIsRandomized(true)
											setCurrentIndex(0)
										}}
										className="px-4 py-2 bg-violet-600 text-white rounded shadow hover:bg-violet-500 transition"
									>
										🔀 Randomize Cards
									</button>
								) : (
									<button
										onClick={() => {
											setIsRandomized(false)
											setFilterVersion((v) => v + 1)
											setCurrentIndex(0)
										}}
										className="px-4 py-2 bg-gray-300 text-gray-800 rounded shadow hover:bg-gray-200 transition"
									>
										↩️ Reset Order
									</button>
								)}
							</div>
						</div>
					</div>
				</>
			)}

			{isLoadingSession && useSpacedRepetition ? (
				<div className="text-center text-gray-500 text-base italic mb-6">
					Loading your session...
				</div>
			) : filteredCards.length > 0 ? (
				<div
					className={`relative w-full mb-4 perspective cursor-pointer ${
						frontMiddleCenter === 'images' ? 'h-96' : 'h-72'
					}`}
					onClick={() => setShowBack((prev) => !prev)}
				>
					<div
						className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
							showBack ? 'rotate-y-180' : ''
						}`}
					>
						{/* Front */}
						<div className="absolute w-full h-full backface-hidden bg-white border rounded-xl p-2 sm:p-6 flex flex-col">
							{/* Top Row */}
							<div className="flex justify-between text-lg font-nunito">
								<div className="text-left w-1/3">
									{renderMiniContent(frontTopLeft, false)}
								</div>
								<div className="text-center w-1/3">
									{renderMiniContent(frontTopCenter, false)}
								</div>
								<div className="text-right w-1/3">
									{renderMiniContent(frontTopRight, false)}
								</div>
							</div>

							{/* Middle Row (flexes to fill) */}
							{/* <div className="flex-1 flex items-center justify-center text-center overflow-hidden"> */}
							<div className="flex-1 relative overflow-hidden flex items-center justify-center leading-none">
								<span
									className={FONT_CLASS_MAP[frontFont]}
									style={{ fontSize: FONT_SIZE_MAP[frontFontSize] }}
								>
									{renderMiniContent(frontMiddleCenter, true)}
								</span>
							</div>
							{/* </div> */}

							{/* Bottom Row */}
							<div className="flex justify-between text-lg font-nunito">
								<div className="text-left w-1/3 self-end">
									{renderMiniContent(frontBottomLeft, false)}
								</div>
								<div className="text-center w-1/3 self-end">
									{renderMiniContent(frontBottomCenter, false)}
								</div>
								<div className="text-right w-1/3 self-end">
									{renderMiniContent(frontBottomRight, false)}
								</div>
							</div>
						</div>

						{/* Back */}
						<div className="absolute w-full h-full backface-hidden rotate-y-180 bg-sky-100 border rounded-xl p-2 sm:p-6 grid grid-rows-3 grid-cols-3 gap-1">
							{/* Top Row */}
							<div className="text-md font-nunito text-left">
								{renderMiniContent(backTopLeft, false)}
							</div>
							<div className="text-md font-nunito text-center">
								{renderMiniContent(backTopCenter, false)}
							</div>
							<div className="text-md font-nunito text-right">
								{renderMiniContent(backTopRight, false)}
							</div>

							{/* Middle */}
							<div
								className="flex-1 col-span-3 relative overflow-hidden flex items-center justify-center"
								style={{ fontSize: FONT_SIZE_MAP[backFontSize] }}
							>
								<span className={FONT_CLASS_MAP[backFont]}>
									{renderMiniContent(backMiddleCenter, true)}
								</span>
							</div>

							{/* Bottom Row */}
							<div className="text-md font-nunito text-left self-end">
								{renderMiniContent(backBottomLeft, false)}
							</div>
							<div className="text-md font-nunito text-center self-end">
								{renderMiniContent(backBottomCenter, false)}
							</div>
							<div className="text-md font-nunito text-right self-end">
								{renderMiniContent(backBottomRight, false)}
							</div>
						</div>
					</div>

					{/* Tap-to-flip hint */}
					<div className="absolute bottom-2 right-3 z-10 text-sm text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
						Tap to flip
					</div>
				</div>
			) : (
				<div className="text-center text-gray-500 text-base italic mb-6">
					{useSpacedRepetition
						? 'You are all caught up. Come back later for more reviews.'
						: 'No cards available with these customizations.'}
					{!useSpacedRepetition && (
						<>
							<br />
							Please select a different lesson or choose different card sides.
						</>
					)}
				</div>
			)}

			{/* 🔵 Progress bar */}
			{filteredCards.length > 0 && (
				<>
					<div className="text-sm font-medium text-gray-600 mb-1">
						{useSpacedRepetition && !isGuest
							? Math.min(sessionCompleted + 1, Math.max(sessionTotal, 1))
							: currentIndex + 1}{' '}
						/ {useSpacedRepetition && !isGuest
							? Math.max(sessionTotal, 1)
							: filteredCards.length}
					</div>
					<div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-6">
						<div
							className="bg-sky-600 h-full transition-all duration-300"
							style={{
								width: `${
									(useSpacedRepetition && !isGuest
										? Math.min(sessionCompleted + 1, Math.max(sessionTotal, 1)) /
											Math.max(sessionTotal, 1)
										: (currentIndex + 1) / filteredCards.length) * 100
								}%`,
							}}
						></div>
					</div>
				</>
			)}

			{useSpacedRepetition && !isGuest ? (
				<div className="flex flex-col items-center gap-3">
					<button
						onClick={() => setShowScheduleEditor((prev) => !prev)}
						className="px-3 py-2 bg-slate-200 text-slate-700 rounded shadow"
					>
						{showScheduleEditor ? 'Hide Schedule' : 'Edit Schedule'}
					</button>
					{showBack ? (
						<div className="flex flex-wrap justify-center gap-2">
							<button
								onClick={(e) => {
									e.stopPropagation()
									handleGrade('again')
								}}
								disabled={isSubmittingReview}
								className="px-4 py-2 bg-rose-600 text-white rounded shadow disabled:opacity-60"
							>
								Again
								{previewByRating?.again ? (
									<span className="ml-2 text-xs opacity-80">
										{previewByRating.again}
									</span>
								) : null}
							</button>
							<button
								onClick={(e) => {
									e.stopPropagation()
									handleGrade('hard')
								}}
								disabled={isSubmittingReview}
								className="px-4 py-2 bg-amber-500 text-white rounded shadow disabled:opacity-60"
							>
								Hard
								{previewByRating?.hard ? (
									<span className="ml-2 text-xs opacity-80">
										{previewByRating.hard}
									</span>
								) : null}
							</button>
							<button
								onClick={(e) => {
									e.stopPropagation()
									handleGrade('good')
								}}
								disabled={isSubmittingReview}
								className="px-4 py-2 bg-emerald-600 text-white rounded shadow disabled:opacity-60"
							>
								Good
								{previewByRating?.good ? (
									<span className="ml-2 text-xs opacity-80">
										{previewByRating.good}
									</span>
								) : null}
							</button>
							<button
								onClick={(e) => {
									e.stopPropagation()
									handleGrade('easy')
								}}
								disabled={isSubmittingReview}
								className="px-4 py-2 bg-sky-600 text-white rounded shadow disabled:opacity-60"
							>
								Easy
								{previewByRating?.easy ? (
									<span className="ml-2 text-xs opacity-80">
										{previewByRating.easy}
									</span>
								) : null}
							</button>
						</div>
					) : (
						<div className="text-sm text-gray-500 italic">
							Tap the card to reveal the answer.
						</div>
					)}
					{showScheduleEditor && currentSessionState && (
						<div className="w-full max-w-xl bg-white border rounded-lg p-4 text-left">
							<div className="flex items-center justify-between mb-2">
								<h3 className="font-semibold text-slate-800">Schedule</h3>
								<button
									onClick={() => setShowAdvancedEditor((prev) => !prev)}
									className="text-sm text-sky-600"
								>
									{showAdvancedEditor ? 'Hide Advanced' : 'Show Advanced'}
								</button>
							</div>
							<div className="flex flex-wrap gap-2 mb-3">
								<button
									onClick={() => updateSchedule('reset')}
									className="px-3 py-2 bg-gray-200 text-gray-800 rounded"
								>
									Reset
								</button>
								<button
									onClick={() => updateSchedule('suspend')}
									className="px-3 py-2 bg-rose-100 text-rose-700 rounded"
								>
									Suspend
								</button>
								<button
									onClick={() => updateSchedule('unsuspend')}
									className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded"
								>
									Unsuspend
								</button>
							</div>
							{showAdvancedEditor && (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
									<label className="text-sm">
										Due At
										<input
											type="datetime-local"
											value={editDueAt}
											onChange={(e) => setEditDueAt(e.target.value)}
											className="mt-1 w-full border rounded px-2 py-1"
										/>
									</label>
									<label className="text-sm">
										State
										<select
											value={editState}
											onChange={(e) =>
												setEditState(
													e.target.value as FlashcardScheduling['state']
												)
											}
											className="mt-1 w-full border rounded px-2 py-1"
										>
											<option value="new">new</option>
											<option value="learning">learning</option>
											<option value="review">review</option>
											<option value="relearning">relearning</option>
											<option value="suspended">suspended</option>
										</select>
									</label>
									<label className="text-sm">
										Interval Days
										<input
											type="number"
											step="0.01"
											value={editIntervalDays}
											onChange={(e) => setEditIntervalDays(e.target.value)}
											className="mt-1 w-full border rounded px-2 py-1"
										/>
									</label>
									<label className="text-sm">
										Ease
										<input
											type="number"
											step="0.01"
											value={editEase}
											onChange={(e) => setEditEase(e.target.value)}
											className="mt-1 w-full border rounded px-2 py-1"
										/>
									</label>
									<label className="text-sm">
										Learning Step
										<input
											type="number"
											step="1"
											value={editLearningStep}
											onChange={(e) => setEditLearningStep(e.target.value)}
											className="mt-1 w-full border rounded px-2 py-1"
										/>
									</label>
									<label className="text-sm">
										Lapses
										<input
											type="number"
											step="1"
											value={editLapses}
											onChange={(e) => setEditLapses(e.target.value)}
											className="mt-1 w-full border rounded px-2 py-1"
										/>
									</label>
									<label className="text-sm">
										Reps
										<input
											type="number"
											step="1"
											value={editReps}
											onChange={(e) => setEditReps(e.target.value)}
											className="mt-1 w-full border rounded px-2 py-1"
										/>
									</label>
								</div>
							)}
							<div className="mt-3 flex justify-end">
								<button
									onClick={() => updateSchedule('update')}
									className="px-4 py-2 bg-sky-600 text-white rounded shadow"
								>
									Save Changes
								</button>
							</div>
						</div>
					)}
					<div className="w-full max-w-xl">
						<button
							onClick={() => setShowHistory((prev) => !prev)}
							className="mt-2 px-3 py-2 bg-slate-200 text-slate-700 rounded shadow"
						>
							{showHistory ? 'Hide Review History' : 'Show Review History'}
						</button>
						{showHistory && (
							<div className="mt-3 bg-white border rounded-lg p-4 text-left">
								<h3 className="font-semibold text-slate-800 mb-2">
									Recent Reviews
								</h3>
								{historyStats && (
									<div className="grid grid-cols-2 gap-2 text-sm text-slate-600 mb-3">
										<div>Total Reviews: {historyStats.total ?? 0}</div>
										<div>Success Rate: {formatSuccessRate(historyStats)}</div>
										<div>Avg Next Interval: {formatAvgInterval(historyStats)}</div>
										<div>Current Streak: {historyStats.currentStreak ?? 0}</div>
										<div>Best Streak: {historyStats.bestStreak ?? 0}</div>
										<div>
											Last Review:{' '}
											{historyStats.lastReviewedAt
												? new Date(historyStats.lastReviewedAt).toLocaleString()
												: '—'}
										</div>
									</div>
								)}
								{isLoadingHistory ? (
									<div className="text-sm text-slate-500">Loading...</div>
								) : reviewHistory.length === 0 ? (
									<div className="text-sm text-slate-500">
										No reviews yet.
									</div>
								) : (
									<div className="flex flex-col gap-2">
										{reviewHistory.map((entry) => (
											<div
												key={entry.id}
												className="flex items-center justify-between text-sm"
											>
												<span className="capitalize font-medium text-slate-700">
													{entry.rating}
												</span>
												<span className="text-slate-500">
													{new Date(entry.reviewedAt).toLocaleString()}
												</span>
											</div>
										))}
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			) : (
				<div className="flex justify-center gap-4">
					<button
						onClick={handlePreviousCard}
						className="px-4 py-2 bg-gray-500 text-white rounded shadow"
					>
						Previous Card
					</button>
					<button
						onClick={handleNextCard}
						className="px-4 py-2 bg-sky-600 text-white rounded shadow"
					>
						Next Card
					</button>
				</div>
			)}
		</div>
	)
}
