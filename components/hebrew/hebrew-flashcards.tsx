'use client'

import { HebrewVocab } from '@/lib/vocab'
import { resolveVocabMediaUrl } from '@/lib/vocab-media'
import { matchesSelectedCategory } from '@/lib/category'
import Image from 'next/image'
import { Bookmark, Star } from 'lucide-react'
import {
	useState,
	useMemo,
	useEffect,
	useCallback,
	useLayoutEffect,
} from 'react'
import { useCelebration } from '@/hooks/useCelebration'
import { useLessonCards } from '@/hooks/useLessonCards'
import CategoryFilter from '../filters/filter-category'
import LessonFilter from '../filters/filter-lesson'
import ProgressBar from '../progress-bar'
import { useUserId } from '@/hooks/useUserId'
import { toast } from 'sonner'

type FontChoice =
	| 'arial'
	| 'times'
	| 'sans'
	| 'frank'
	| 'tinos'
	| 'nunito'
	| 'cardo'
	| 'rashi'
	| 'suez'

interface HebrewVocabProps {
	data: HebrewVocab[]
	allFields: (keyof HebrewVocab)[]
	currentLesson: string
	layout: string
	// userId: string
	courseId: number
	lockedLesson?: string
	hideFilters?: boolean
}

type HebrewCardFilterType = 'all' | 'word' | 'phrase' | 'stack'

type CardStatus = {
	isMastered: boolean
	inMyStack: boolean
}

type DisplayField =
	| keyof HebrewVocab
	| 'none'
	| 'rootSummary'
	| 'suffixSummary'
	| 'grammarSummary'

type FlashcardPreset = {
	label: string
	front: {
		topLeft: DisplayField
		topCenter: DisplayField
		topRight: DisplayField
		middle: DisplayField
		bottomLeft: DisplayField
		bottomCenter: DisplayField
		bottomRight: DisplayField
		font: FontChoice
		size: FontSizeKey
	}
	back: {
		topLeft: DisplayField
		topCenter: DisplayField
		topRight: DisplayField
		middle: DisplayField
		bottomLeft: DisplayField
		bottomCenter: DisplayField
		bottomRight: DisplayField
		font: FontChoice
		size: FontSizeKey
	}
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

const CARD_FLIP_DURATION_MS = 700

const FIELD_LABELS: Partial<Record<DisplayField, string>> = {
	heb: 'Without Niqqud',
	hebNiqqud: 'With Niqqud',
	eng: 'Translation',
	engDefinition: 'Definition',
	rootSummary: 'Root',
	suffixSummary: 'Suffix',
	grammarSummary: 'Grammar',
	partOfSpeech: 'Part of Speech',
	category: 'Category',
	state: 'State',
	ipa: 'IPA (Pronunciation)',
	engTransliteration: 'English Transliteration',
	images: 'Image',
	hebAudio: 'Audio',
	introduction: 'Video',
}

const FONT_CLASS_MAP: Record<FontChoice, string> = {
	arial: 'font-arial',
	times: 'font-serif',
	frank: 'font-frank',
	sans: 'font-sans',
	tinos: 'font-tinos',
	nunito: 'font-nunito',
	cardo: 'font-cardo',
	rashi: 'font-rashi',
	suez: 'font-suez',
}

export default function HebrewFlashcards({
	data,
	allFields,
	currentLesson,
	layout,
	courseId,
	lockedLesson,
	hideFilters = false,
}: // userId,
HebrewVocabProps) {
	const {
		selectedLessons,
		setSelectedLessons,
		currentIndex,
		setCurrentIndex,
		lessonOptions,
	} = useLessonCards(data, currentLesson)
	const [selectedType, setSelectedType] = useState<HebrewCardFilterType>('word')
	const [frontField, setFrontField] = useState<keyof HebrewVocab>('hebNiqqud')
	const [backField, setBackField] = useState<keyof HebrewVocab>('eng')
	const [showBack, setShowBack] = useState(false)
	const [filteredCards, setFilteredCards] = useState<HebrewVocab[]>([])
	const [selectedCategory, setSelectedCategory] = useState<string>('all')

	const [frontFont, setFrontFont] = useState<FontChoice>('times')
	const [backFont, setBackFont] = useState<FontChoice>('times')

	const [frontFontSize, setFrontFontSize] = useState<FontSizeKey>('threexl')
	const [backFontSize, setBackFontSize] = useState<FontSizeKey>('threexl')
	const [showCustomize, setShowCustomize] = useState(false)
	const [showFilter, setShowFilter] = useState(false)
	const [audioVolume, setAudioVolume] = useState(1) // full volume
	const [audioSpeed, setAudioSpeed] = useState(1) // normal speed
	const [frontTopLeft, setFrontTopLeft] = useState<DisplayField>('none')
	const [frontTopCenter, setFrontTopCenter] = useState<DisplayField>('none')
	const [frontTopRight, setFrontTopRight] = useState<DisplayField>('none')
	const [frontMiddleCenter, setFrontMiddleCenter] =
		useState<DisplayField>('images')
	const [frontBottomLeft, setFrontBottomLeft] =
		useState<DisplayField>('suffixSummary')
	const [frontBottomCenter, setFrontBottomCenter] =
		useState<DisplayField>('rootSummary')
	const [frontBottomRight, setFrontBottomRight] =
		useState<DisplayField>('grammarSummary')
	const [backTopLeft, setBackTopLeft] = useState<DisplayField>('eng')
	const [backTopCenter, setBackTopCenter] = useState<DisplayField>('none')
	const [backTopRight, setBackTopRight] = useState<DisplayField>('hebNiqqud')
	const [backMiddleCenter, setBackMiddleCenter] =
		useState<DisplayField>('hebAudio')
	const [backBottomLeft, setBackBottomLeft] = useState<DisplayField>('none')
	const [backBottomCenter, setBackBottomCenter] = useState<DisplayField>('ipa')
	const [backBottomRight, setBackBottomRight] =
		useState<DisplayField>('engTransliteration')
	const [cardsCompleted, setCardsCompleted] = useState(0)
	const [isRandomized, setIsRandomized] = useState(false)
	const [hideMasteredCards, setHideMasteredCards] = useState(true)
	const [filterVersion, setFilterVersion] = useState(0)
	const [cardStatuses, setCardStatuses] = useState<Record<number, CardStatus>>(
		{},
	)
	const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

	const { userId, isGuest, ready } = useUserId()
	const canUseSavedWordFeatures = ready && !isGuest
	// console.log('newUserId in local', userId)

	useEffect(() => {
		if (!lockedLesson) return
		setSelectedLessons([lockedLesson])
	}, [lockedLesson, setSelectedLessons])

	const PRESETS: FlashcardPreset[] = [
		{
			label: 'Picture → Audio',
			front: {
				topLeft: 'none',
				topCenter: 'none',
				topRight: 'none',
				middle: 'images',
				bottomLeft: 'suffixSummary',
				bottomCenter: 'rootSummary',
				bottomRight: 'grammarSummary',
				font: 'times',
				size: 'threexl',
			},
			back: {
				topLeft: 'eng',
				topCenter: 'none',
				topRight: 'none',
				middle: 'hebAudio',
				bottomLeft: 'none',
				bottomCenter: 'ipa',
				bottomRight: 'engTransliteration',
				font: 'times',
				size: 'threexl',
			},
		},
		{
			label: 'Picture → Word',
			front: {
				topLeft: 'none',
				topCenter: 'none',
				topRight: 'none',
				middle: 'images',
				bottomLeft: 'none',
				bottomCenter: 'rootSummary',
				bottomRight: 'grammarSummary',
				font: 'sans',
				size: 'xl',
			},
			back: {
				topLeft: 'none',
				topCenter: 'none',
				topRight: 'none',
				middle: 'hebNiqqud',
				bottomLeft: 'none',
				bottomCenter: 'ipa',
				bottomRight: 'engTransliteration',
				font: 'times',
				size: 'threexl',
			},
		},
		{
			label: 'Audio → Picture',
			front: {
				topLeft: 'none',
				topCenter: 'none',
				topRight: 'none',
				middle: 'hebAudio',
				bottomLeft: 'none',
				bottomCenter: 'rootSummary',
				bottomRight: 'grammarSummary',
				font: 'sans',
				size: 'xl',
			},
			back: {
				topLeft: 'none',
				topCenter: 'none',
				topRight: 'none',
				middle: 'images',
				bottomLeft: 'none',
				bottomCenter: 'ipa',
				bottomRight: 'engTransliteration',
				font: 'times',
				size: 'threexl',
			},
		},
		{
			label: 'Sightread',
			front: {
				topLeft: 'none',
				topCenter: 'none',
				topRight: 'none',
				middle: 'heb',
				bottomLeft: 'none',
				bottomCenter: 'rootSummary',
				bottomRight: 'grammarSummary',
				font: 'times',
				size: 'threexl',
			},
			back: {
				topLeft: 'none',
				topCenter: 'none',
				topRight: 'none',
				middle: 'hebAudio',
				bottomLeft: 'none',
				bottomCenter: 'ipa',
				bottomRight: 'engTransliteration',
				font: 'arial',
				size: 'lg',
			},
		},
		{
			label: 'Translation',
			front: {
				topLeft: 'none',
				topCenter: 'none',
				topRight: 'none',
				middle: 'hebNiqqud',
				bottomLeft: 'none',
				bottomCenter: 'rootSummary',
				bottomRight: 'grammarSummary',
				font: 'times',
				size: 'threexl',
			},
			back: {
				topLeft: 'none',
				topCenter: 'none',
				topRight: 'none',
				middle: 'eng',
				bottomLeft: 'none',
				bottomCenter: 'ipa',
				bottomRight: 'engTransliteration',
				font: 'times',
				size: 'lg',
			},
		},
	]

	const { Confetti, celebrate } = useCelebration()

	function applyPreset(preset: FlashcardPreset) {
		setFrontTopLeft(preset.front.topLeft)
		setFrontTopCenter(preset.front.topCenter)
		setFrontTopRight(preset.front.topRight)
		setFrontMiddleCenter(preset.front.middle)
		setFrontBottomLeft(preset.front.bottomLeft)
		setFrontBottomCenter(preset.front.bottomCenter)
		setFrontBottomRight(preset.front.bottomRight)
		setFrontFont(preset.front.font)
		setFrontFontSize(preset.front.size)

		setBackTopLeft(preset.back.topLeft)
		setBackTopCenter(preset.back.topCenter)
		setBackTopRight(preset.back.topRight)
		setBackMiddleCenter(preset.back.middle)
		setBackBottomLeft(preset.back.bottomLeft)
		setBackBottomCenter(preset.back.bottomCenter)
		setBackBottomRight(preset.back.bottomRight)
		setBackFont(preset.back.font)
		setBackFontSize(preset.back.size)
		setShowCustomize(false)
	}

	// Filter to this prefix
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

	useEffect(() => {
		const newFiltered = cardsForPrefix.filter((card) => {
			const matchesSelectedLesson =
				selectedLessons.length === 0 ||
				card.lessons.some((l) => selectedLessons.includes(l))

			const matchesType =
				selectedType === 'all'
					? true
					: selectedType === 'stack'
						? !!card.id && stackCardIds.has(card.id)
						: card.type === selectedType
			const matchesCategory = matchesSelectedCategory(
				card.category,
				selectedCategory,
			)
			const isMasteredCard =
				card.id != null && !!cardStatuses[card.id]?.isMastered
			const matchesMasteredFilter = !hideMasteredCards || !isMasteredCard

			// Ensure middle-center image/audio (front)
			const hasMiddleFrontImage =
				frontMiddleCenter !== 'images' || card.images.length > 0
			const hasMiddleFrontAudio =
				frontMiddleCenter !== 'hebAudio' || !!card.hebAudio

			// Ensure middle-center image/audio (back)
			const hasMiddleBackImage =
				backMiddleCenter !== 'images' || card.images.length > 0
			const hasMiddleBackAudio =
				backMiddleCenter !== 'hebAudio' || !!card.hebAudio

			const hasValidFront =
				(frontField === 'images' && card.images.length > 0) ||
				(frontField === 'hebAudio' && !!card.hebAudio) ||
				(frontField !== 'images' &&
					frontField !== 'hebAudio' &&
					!!card[frontField])

			const hasValidBack =
				(backField === 'images' && card.images.length > 0) ||
				(backField === 'hebAudio' && !!card.hebAudio) ||
				(backField !== 'images' &&
					backField !== 'hebAudio' &&
					!!card[backField])

			return (
				matchesSelectedLesson &&
				matchesType &&
				matchesCategory &&
				matchesMasteredFilter &&
				hasValidFront &&
				hasValidBack &&
				hasMiddleFrontImage &&
				hasMiddleBackImage &&
				hasMiddleFrontAudio &&
				hasMiddleBackAudio
			)
		})

		// Shuffle the filtered cards
		let finalCards = [...newFiltered]
		if (isRandomized) {
			finalCards.sort(() => Math.random() - 0.5)
		}
		setFilteredCards(finalCards)

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
		selectedCategory,
		frontField,
		backField,
		stackCardIds,
		cardStatuses,
		hideMasteredCards,
		frontMiddleCenter,
		backMiddleCenter,
		setCurrentIndex,
		filterVersion,
		isRandomized,
		currentCard?.id,
	])
	const currentCardStatus =
		currentCard?.id != null ? cardStatuses[currentCard.id] : undefined
	const isCurrentCardMastered = !!currentCardStatus?.isMastered
	const isCurrentCardInMyStack = !!currentCardStatus?.inMyStack

	useLayoutEffect(() => {
		setShowBack(false)
	}, [currentCard?.id])

	const typeOptions = useMemo(
		() =>
			canUseSavedWordFeatures
				? (['all', 'word', 'phrase', 'stack'] as HebrewCardFilterType[])
				: (['all', 'word', 'phrase'] as HebrewCardFilterType[]),
		[canUseSavedWordFeatures],
	)

	function playWithBoostedVolume(url: string, volume: number, speed: number) {
		const audioContext = new (
			window.AudioContext || (window as any).webkitAudioContext
		)()
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
	// const frontAudioRef = useMemo(() => {
	// 	if (frontField === 'hebAudio' && currentCard?.hebAudio)
	// 		return new Audio(currentCard.hebAudio)
	// 	return null
	// }, [frontField, currentCard])

	const backAudioRef = useMemo(() => {
		if (backField === 'hebAudio' && currentCard?.hebAudio)
			return new Audio(currentCard.hebAudio)
		return null
	}, [backField, currentCard])

	const fontOptions: {
		value: FontChoice
		label: string
		className: string
	}[] = [
		{ value: 'times', label: 'Times', className: 'font-serif' },
		{
			value: 'frank',
			label: 'Frank',
			className: 'font-frank',
		},
		{
			value: 'tinos',
			label: 'Tinos',
			className: 'font-tinos',
		},
		{
			value: 'cardo',
			label: 'Cardo',
			className: 'font-cardo',
		},
		{
			value: 'rashi',
			label: 'Rashi',
			className: 'font-rashi',
		},
		{
			value: 'suez',
			label: 'Suez',
			className: 'font-suez',
		},
		{ value: 'arial', label: 'Arial', className: 'font-arial' },
		{
			value: 'sans',
			label: 'Sans',
			className: 'font-sans',
		},

		{
			value: 'nunito',
			label: 'Nunito',
			className: 'font-nunito',
		},
	]

	useEffect(() => {
		if (frontMiddleCenter === 'hebAudio' && currentCard?.hebAudio) {
			playWithBoostedVolume(currentCard.hebAudio, audioVolume, audioSpeed)
		}
	}, [currentCard, frontMiddleCenter, audioVolume, audioSpeed])

	useEffect(() => {
		if (showBack && backField === 'hebAudio' && backAudioRef) {
			backAudioRef.play().catch(console.error)
		}
	}, [showBack, backField, backAudioRef])

	function handleNextCard() {
		setShowBack(false) // flip to front first

		// Wait for flip animation to complete before changing the card
		setTimeout(() => {
			const nextIndex = currentIndex + 1
			if (nextIndex >= filteredCards.length) {
				celebrate()
			}
			setCardsCompleted((prev) => prev + 1)

			setCurrentIndex(nextIndex % filteredCards.length)
		}, 700) // ⏱ adjust this to match your card flip duration
	}

	const awardPoints = useCallback(
		async (points: number) => {
			try {
				await fetch('/api/award-points', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ userId, courseId, points }),
				})
			} catch (error) {
				console.error('Failed to award points', error)
			}
		},
		[userId, courseId],
	)

	useEffect(() => {
		if (cardsCompleted > 0 && cardsCompleted % 25 === 0) {
			const pointsToAward = cardsCompleted / 25
			awardPoints(pointsToAward)
		}
	}, [cardsCompleted, awardPoints])

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
	}, [canUseSavedWordFeatures, courseId, userId])

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

	function handlePreviousCard() {
		setShowBack(false)

		setTimeout(() => {
			setCurrentIndex(
				(prev) => (prev - 1 + filteredCards.length) % filteredCards.length,
			)
		}, 700) // match the flip animation duration
	}

	// Auto set optimal font size on load
	useEffect(() => {
		const width = window.innerWidth
		if (width < 400) {
			setFrontFontSize('threexl')
			setBackFontSize('threexl')
		} else if (width < 768) {
			setFrontFontSize('threexl')
			setBackFontSize('threexl')
		} else {
			setFrontFontSize('threexl')
			setBackFontSize('threexl')
		}
	}, [])

	const allDisplayFields = allFields.filter((f) => f !== 'dictionaryUrl')
	const miniPositionFields: DisplayField[] = [
		'heb',
		'hebNiqqud',
		'ipa',
		'hebAudio',
		'rootSummary',
		'suffixSummary',
		'grammarSummary',
		'partOfSpeech',
		'category',
		'state',
		'engTransliteration',
		'eng',
	]

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

	function formatGrammarSummary() {
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

	function formatLegacyMorphologyField(
		field: keyof HebrewVocab,
		value: string,
	) {
		switch (field) {
			case 'rootPerson':
				return formatLabelValue('Root', compactPersonValue(value) ?? value)
			case 'rootGender':
				return formatLabelValue('Root', compactGenderValue(value) ?? value)
			case 'rootNumber':
				return formatLabelValue('Root', compactNumberValue(value) ?? value)
			case 'suffixPerson':
				return formatLabelValue('Suffix', compactPersonValue(value) ?? value)
			case 'suffixGender':
				return formatLabelValue('Suffix', compactGenderValue(value) ?? value)
			case 'suffixNumber':
				return formatLabelValue('Suffix', compactNumberValue(value) ?? value)
			default:
				return value
		}
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

	function fixHebrewPunctuation(text: string): string {
		// Replace ? at the end of a line with RTL-friendly question mark
		// Only if the text contains Hebrew characters
		const hebrewRegex = /[\u0590-\u05FF]/ // matches Hebrew script
		if (!hebrewRegex.test(text)) return text

		// Replace ? at the end or before a line break
		return text.replace(/\?/g, '؟') // Arabic-style RTL question mark
	}

	function convertToEmbedUrl(url: string): string {
		try {
			const parsed = new URL(url)
			const videoId = parsed.pathname.split('/').pop()
			const start = parsed.searchParams.get('t')?.replace(/\D/g, '') // extract seconds
			return `https://www.youtube.com/embed/${videoId}?autoplay=1${
				start ? `&start=${start}` : ''
			}`
		} catch {
			return url
		}
	}

	function InlineVideoPlayer({ url }: { url: string }) {
		const [isPlaying, setIsPlaying] = useState(false)
		const embedUrl = convertToEmbedUrl(url)

		if (!isPlaying) {
			return (
				<button
					onClick={(e) => {
						e.stopPropagation()
						setIsPlaying(true)
					}}
					className="flex flex-col items-center gap-1"
				>
					<Image
						src={'/icons/iconYoutube.png'}
						alt="Play video"
						width={50}
						height={50}
						className="cursor-pointer hover:opacity-80"
					/>
					<span className="text-sky-600 text-sm font-semibold">Watch</span>
				</button>
			)
		}

		return (
			<div className="w-full h-full flex justify-center items-center rounded overflow-hidden">
				<iframe
					src={embedUrl}
					title="YouTube video"
					className="w-full h-full border-0 rounded object-cover"
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					allowFullScreen
				></iframe>
			</div>
		)
	}

	function renderMiniContent(field: DisplayField, isMiddle = false) {
		if (!currentCard || field === 'none') return null

		if (field === 'rootSummary') {
			const formatted = buildCompactMorphologyLabel(
				'Root',
				currentCard.rootPerson,
				currentCard.rootGender,
				currentCard.rootNumber,
			)
			return formatted ? <span>{formatted}</span> : null
		}

		if (field === 'suffixSummary') {
			const formatted = buildCompactMorphologyLabel(
				'Suffix',
				currentCard.suffixPerson,
				currentCard.suffixGender,
				currentCard.suffixNumber,
			)
			return formatted ? <span>{formatted}</span> : null
		}

		if (field === 'grammarSummary') {
			const formatted = formatGrammarSummary()
			return formatted ? <span>{formatted}</span> : null
		}

		const value = currentCard[field]

		if (field === 'images' && Array.isArray(value)) {
			if (value.length > 0) {
				const imageUrl = resolveVocabMediaUrl(value[0])
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
							alt="HebrewVocab image"
							fill={isMiddle}
							className="object-contain rounded"
							sizes="(max-width: 768px) 100vw, 50vw"
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

		if (field === 'hebAudio' && typeof value === 'string') {
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

		if (field === 'introduction' && typeof value === 'string') {
			return <InlineVideoPlayer url={value} />
		}

		if (
			field === 'rootPerson' ||
			field === 'rootGender' ||
			field === 'rootNumber' ||
			field === 'suffixPerson' ||
			field === 'suffixGender' ||
			field === 'suffixNumber'
		) {
			const formatted = formatLegacyMorphologyField(field, String(value))
			return formatted ? <span>{formatted}</span> : null
		}

		if (field === 'partOfSpeech') {
			const formatted = formatPartOfSpeechValue(value as string | string[])
			return formatted ? <span>{formatted}</span> : null
		}

		if (field === 'category') {
			const normalized = String(value).trim().toLowerCase()
			return normalized === 'possessive' ? <span>Possessive</span> : null
		}

		if (field === 'state') {
			const normalized = String(value).trim()
			if (normalized) return <span>{toTitleCase(normalized)}</span>
			return hasConstructMarker() ? <span>Construct</span> : null
		}

		if (Array.isArray(value)) {
			return value.join(', ')
		}

		const isHebrewField = field === 'heb' || field === 'hebNiqqud'
		const className = !isMiddle && isHebrewField ? 'font-serif text-4xl' : ''

		return (
			<span className={className}>{fixHebrewPunctuation(value as string)}</span>
		)
	}

	return (
		<div className="p-4 max-w-3xl mx-auto text-center w-full">
			{Confetti}

			{/* Customize Section Toggle */}
			<div className="mb-6 flex justify-center gap-4">
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
				{!hideFilters ? (
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
				) : null}
			</div>

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
						className="accent-sky-600"
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
						className="accent-sky-600"
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
								className="px-3 py-2 bg-violet-600 text-white rounded shadow hover:bg-violet-500"
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
										setFrontTopLeft(e.target.value as DisplayField)
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
										setFrontTopCenter(e.target.value as DisplayField)
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
										setFrontTopRight(e.target.value as DisplayField)
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
										setFrontMiddleCenter(e.target.value as DisplayField)
									}
								>
									<option value="none">None</option>
									{allDisplayFields.map((field) => (
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
										setFrontBottomLeft(e.target.value as DisplayField)
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
										setFrontBottomCenter(e.target.value as DisplayField)
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
										setFrontBottomRight(e.target.value as DisplayField)
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
										setBackTopLeft(e.target.value as DisplayField)
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
										setBackTopCenter(e.target.value as DisplayField)
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
										setBackTopRight(e.target.value as DisplayField)
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
										setBackMiddleCenter(e.target.value as DisplayField)
									}
								>
									<option value="none">None</option>
									{/* Explicit list so only these fields are allowed */}
									{[
										'heb',
										'hebNiqqud',
										'eng',
										'rootPerson',
										'rootGender',
										'rootNumber',
										'partOfSpeech',
										'ipa',
										'engTransliteration',
										'images',
										'hebAudio',
										'introduction',
									].map((field) => (
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
										setBackBottomLeft(e.target.value as DisplayField)
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
										setBackBottomCenter(e.target.value as DisplayField)
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
										setBackBottomRight(e.target.value as DisplayField)
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

			{showFilter && !hideFilters && (
				<>
					<div className="space-y-3 mb-4">
						<h2 className="text-xl font-semibold">Select Type</h2>
						<div className="flex flex-row-reverse flex-wrap justify-center gap-2">
							{typeOptions.map((type) => (
								<button
									key={type}
									onClick={() => setSelectedType(type)}
									className={`px-3 py-1 border rounded-full text-xs ${
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
					<CategoryFilter
						data={data}
						selectedCategory={selectedCategory}
						setSelectedCategory={setSelectedCategory}
					/>
					<LessonFilter
						data={data}
						selectedLessons={selectedLessons}
						setSelectedLessons={setSelectedLessons}
						showRanges={true}
					/>
					<div className="flex items-center justify-center my-4 gap-2 flex-wrap">
						{!isRandomized ? (
							<button
								onClick={() => {
									setIsRandomized(true)
									setFilteredCards((prev) =>
										[...prev].sort(() => Math.random() - 0.5),
									)
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
						<button
							onClick={() => setHideMasteredCards((prev) => !prev)}
							className={`px-4 py-2 rounded shadow transition ${
								hideMasteredCards
									? 'bg-amber-500 text-white hover:bg-amber-400'
									: 'bg-gray-300 text-gray-800 hover:bg-gray-200'
							}`}
						>
							{hideMasteredCards ? 'Filter out Mastered' : 'Show All Words'}
						</button>
					</div>
				</>
			)}

			{filteredCards.length > 0 ? (
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
							<div className="grid grid-cols-3 gap-2 text-sm sm:text-base font-nunito">
								<div className="min-w-0 text-left whitespace-normal break-words leading-tight">
									{renderMiniContent(frontTopLeft, false)}
								</div>
								<div className="min-w-0 text-center whitespace-normal break-words leading-tight">
									{renderMiniContent(frontTopCenter, false)}
								</div>
								<div className="min-w-0 text-right whitespace-normal break-words leading-tight">
									{renderMiniContent(frontTopRight, false)}
								</div>
							</div>

							{/* Middle Row (flexes to fill) */}
							{/* <div className="flex-1 flex items-center justify-center text-center overflow-hidden"> */}
							<div className="flex-1 relative overflow-hidden flex items-center justify-center leading-none">
								{(isCurrentCardMastered || isCurrentCardInMyStack) && (
									<div className="absolute right-3 top-3 z-10 flex items-center gap-2">
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
								<span
									className={FONT_CLASS_MAP[frontFont]}
									style={{ fontSize: FONT_SIZE_MAP[frontFontSize] }}
								>
									{renderMiniContent(frontMiddleCenter, true)}
								</span>
							</div>
							{/* </div> */}

							{/* Bottom Row */}
							<div className="grid grid-cols-3 gap-2 text-sm sm:text-base font-nunito">
								<div className="min-w-0 self-end text-left whitespace-normal break-words leading-tight">
									{renderMiniContent(frontBottomLeft, false)}
								</div>
								<div className="min-w-0 self-end text-center whitespace-normal break-words leading-tight">
									{renderMiniContent(frontBottomCenter, false)}
								</div>
								<div className="min-w-0 self-end text-right whitespace-normal break-words leading-tight">
									{renderMiniContent(frontBottomRight, false)}
								</div>
							</div>
						</div>

						{/* Back */}
						<div className="absolute w-full h-full backface-hidden rotate-y-180 bg-sky-100 border rounded-xl p-2 sm:p-6 grid grid-rows-[auto,1fr,auto] grid-cols-[0.5fr,2fr,0.5fr] gap-1">
							{/* Top Row */}
							<div className="min-w-0 text-sm sm:text-base font-nunito text-left whitespace-normal break-words leading-tight">
								{renderMiniContent(backTopLeft, false)}
							</div>
							<div className="min-w-0 text-sm sm:text-base font-nunito text-center whitespace-normal break-words leading-tight">
								{renderMiniContent(backTopCenter, false)}
							</div>
							<div className="min-w-0 text-sm sm:text-base font-nunito text-right whitespace-normal break-words leading-tight">
								{renderMiniContent(backTopRight, false)}
							</div>

							{/* Middle */}
							<div
								className="flex-1 col-span-3 relative overflow-hidden flex items-center justify-center"
								style={{ fontSize: FONT_SIZE_MAP[backFontSize] }}
							>
								{(isCurrentCardMastered || isCurrentCardInMyStack) && (
									<div className="absolute right-3 top-3 z-10 flex items-center gap-2">
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
								<span className={FONT_CLASS_MAP[backFont]}>
									{renderMiniContent(backMiddleCenter, true)}
								</span>
							</div>

							{/* Bottom Row */}
							<div className="min-w-0 text-sm sm:text-base font-nunito text-left self-end whitespace-normal break-words leading-tight">
								{renderMiniContent(backBottomLeft, false)}
							</div>
							<div className="min-w-0 text-sm sm:text-base font-nunito text-center self-end whitespace-normal break-words leading-tight">
								{renderMiniContent(backBottomCenter, false)}
							</div>
							<div className="min-w-0 text-sm sm:text-base font-nunito text-right self-end whitespace-normal break-words leading-tight">
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
					No cards available with these customizations.
					<br />
					Please select a different lesson or choose different card sides.
				</div>
			)}

			{/* 🔵 Progress bar */}
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
						className="px-4 py-2 bg-amber-500 text-white rounded shadow disabled:opacity-60"
					>
						{isCurrentCardMastered ? 'Remove Mastered' : 'Mark as Mastered'}
					</button>
				)}
				<button
					onClick={handlePreviousCard}
					className="px-4 py-2 bg-gray-500 text-white rounded shadow"
					aria-label="Previous Card"
				>
					&lt;
				</button>
				<button
					onClick={handleNextCard}
					className="px-4 py-2 bg-sky-600 text-white rounded shadow"
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
						className="px-4 py-2 bg-emerald-600 text-white rounded shadow disabled:opacity-60"
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
