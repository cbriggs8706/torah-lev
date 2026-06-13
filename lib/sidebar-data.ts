import {
	BookAudio,
	Brain,
	HeartHandshake,
	Library,
	NotebookPen,
	ScrollText,
	Star,
	Timer,
} from 'lucide-react'

import {
	getSidebarLabel,
	normalizeSidebarLocale,
} from '@/lib/sidebar-translations'
import type { SidebarLocale, SidebarNavSection } from '@/types/sidebar'

type SidebarContext = {
	activeCourseId: number | null
	isHebrewFriend?: boolean
	isSpanishFriend?: boolean
	isEnglishFriend?: boolean
	isTester?: boolean
	locale?: SidebarLocale | string | null
}

function localize(
	locale: SidebarLocale,
	key: Parameters<typeof getSidebarLabel>[1],
) {
	return getSidebarLabel(locale, key)
}

function routeLocale(activeCourseId: number | null): SidebarLocale {
	if (activeCourseId === 12) return 'el'
	if (activeCourseId === 2) return 'es'
	if ([6, 11, 14].includes(activeCourseId ?? -1)) return 'he'
	return 'en'
}

export function buildSidebarSections({
	activeCourseId,
	isHebrewFriend,
	locale,
}: SidebarContext): SidebarNavSection[] {
	const resolvedLocale = normalizeSidebarLocale(
		locale ?? routeLocale(activeCourseId),
	)
	const studyItems = []
	const gameItems = []
	const toolItems = []
	const communityItems = []
	const localItems = []

	if ([6, 11, 14].includes(activeCourseId ?? -1)) {
		studyItems.push(
			{
				key: 'courses',
				label: localize(resolvedLocale, 'nav.courses'),
				href: '/courses',
				iconSrc: '/icons/iconNotebook.png',
			},
			{
				key: 'videos',
				label: localize(resolvedLocale, 'nav.introduction'),
				href: '/he/videos',
				iconSrc: '/icons/iconYoutube.png',
			},
			{
				key: 'vocabulary',
				label: localize(resolvedLocale, 'nav.vocabulary'),
				href: '/he/vocabulary',
				iconSrc: '/speech-balloon-svgrepo-com.svg',
				icon: BookAudio,
			},
			{
				key: 'flashcards',
				label: localize(resolvedLocale, 'nav.flashcards'),
				href: '/he/flashcards',
				iconSrc: '/icons/iconFlashcards.png',
			},
			{
				key: 'quiz',
				label: localize(resolvedLocale, 'nav.quiz'),
				href: '/he/quiz',
				iconSrc: '/gameIcons/quiz.png',
			},
			{
				key: 'dictionary',
				label: localize(resolvedLocale, 'nav.dictionary'),
				href: '/he/dictionary',
				iconSrc: '/icons/iconDictionary.png',
			},
			{
				key: 'matchup',
				label: localize(resolvedLocale, 'nav.matchup'),
				href: '/he/matchup',
				iconSrc: '/icons/iconSocks.png',
			},
			{
				key: 'opposites',
				label: localize(resolvedLocale, 'nav.opposites'),
				href: '/he/opposites',
				iconSrc: '/gameIcons/matchingPairs.png',
			},
			{
				key: 'mistaken',
				label: localize(resolvedLocale, 'nav.mistaken'),
				href: '/he/mistaken',
				iconSrc: '/gameIcons/matchingPairs.png',
			},
		)

		gameItems.push(
			{
				key: 'letter-quiz',
				label: localize(resolvedLocale, 'nav.letterQuiz'),
				href: '/he/letter-quiz',
				iconSrc: '/icons/iconLetter.png',
			},
			{
				key: 'vowels',
				label: localize(resolvedLocale, 'nav.vowels'),
				href: '/he/vowels',
				iconSrc: '/gameIcons/groupSort.png',
			},
			{
				key: 'syllables',
				label: localize(resolvedLocale, 'nav.syllables'),
				href: '/he/syllables',
				iconSrc: '/gameIcons/groupSort.png',
			},
			{
				key: 'number-quiz',
				label: localize(resolvedLocale, 'nav.numberQuiz'),
				href: '/he/number-quiz',
				iconSrc: '/icons/iconNumber.png',
			},
			{
				key: 'spelling',
				label: localize(resolvedLocale, 'nav.spelling'),
				href: '/he/spelling',
				iconSrc: '/icons/iconSpelling.png',
			},
			{
				key: 'verbs',
				label: localize(resolvedLocale, 'nav.verbs'),
				href: '/he/verbs',
				iconSrc: '/icons/iconRunning.png',
			},
			{
				key: 'scramble',
				label: localize(resolvedLocale, 'nav.scramble'),
				href: '/he/scramble',
				iconSrc: '/icons/iconScrambled.png',
			},
			{
				key: 'sentence-builder',
				label: localize(resolvedLocale, 'nav.sentenceBuilder'),
				href: '/he/sentence-builder',
				iconSrc: '/icons/iconBuilding.png',
			},
			{
				key: 'construct-absolute',
				label: localize(resolvedLocale, 'nav.constructAbsolute'),
				href: '/he/construct-absolute',
				iconSrc: '/construction-worker-medium-skin-tone-svgrepo-com.svg',
			},
		)

		toolItems.push(
			{
				key: 'tanakh-books',
				label: localize(resolvedLocale, 'nav.tanakhBooks'),
				href: '/he/tanakh-books',
				iconSrc: '/books-svgrepo-com.svg',
				icon: ScrollText,
			},
			{
				key: 'memorize',
				label: localize(resolvedLocale, 'nav.memorize'),
				href: '/he/memorize',
				iconSrc: '/icons/iconBrain.png',
				icon: Brain,
			},
		)

		communityItems.push({
			key: 'music',
			label: localize(resolvedLocale, 'nav.music'),
			href: '/he/music',
			iconSrc: '/icons/iconMusic.png',
		})

		if ([6, 11].includes(activeCourseId ?? -1)) {
			communityItems.push({
				key: 'stories',
				label: localize(resolvedLocale, 'nav.stories'),
				href: '/he/stories',
				iconSrc: '/icons/iconStories.png',
				icon: HeartHandshake,
			})
			communityItems.push({
				key: 'scripture',
				label: localize(resolvedLocale, 'nav.scripture'),
				href: '/he/scripture',
				iconSrc: '/icons/iconScroll.png',
				icon: ScrollText,
			})
		}

		if (activeCourseId === 6 && isHebrewFriend) {
			localItems.push({
				key: 'prayer',
				label: localize(resolvedLocale, 'nav.prayer'),
				href: '/he/prayer',
				iconSrc: '/icons/iconPraying.png',
				icon: Star,
			})
		}
	}

	if (activeCourseId === 12) {
		studyItems.push(
			{
				key: 'learn',
				label: localize(resolvedLocale, 'nav.learn'),
				href: '/el/learn',
				iconSrc: '/youtube.svg',
				icon: BookOpen,
			},
			{
				key: 'flashcards',
				label: localize(resolvedLocale, 'nav.flashcards'),
				href: '/el/flashcards',
				iconSrc: '/card-file-box.svg',
				icon: BookDashed,
			},
			{
				key: 'lesson-scripts',
				label: localize(resolvedLocale, 'nav.introduction'),
				href: '/el/videos',
				iconSrc: '/youtube.svg',
				icon: NotebookPen,
			},
		)
	}

	return [
		studyItems.length
			? {
					key: 'study',
					label: localize(resolvedLocale, 'sections.study'),
					items: studyItems,
				}
			: null,
		gameItems.length
			? {
					key: 'games',
					label: localize(resolvedLocale, 'sections.games'),
					items: gameItems,
				}
			: null,
		communityItems.length
			? {
					key: 'community',
					label: localize(resolvedLocale, 'sections.community'),
					items: communityItems,
				}
			: null,
		toolItems.length
			? {
					key: 'tools',
					label: localize(resolvedLocale, 'sections.tools'),
					items: toolItems,
				}
			: null,
		localItems.length
			? {
					key: 'locals',
					label: localize(resolvedLocale, 'sections.locals'),
					items: localItems,
				}
			: null,
	].filter(Boolean) as SidebarNavSection[]
}
