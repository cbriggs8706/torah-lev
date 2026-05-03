import {
	BookAudio,
	BookDashed,
	BookOpen,
	BookText,
	Brain,
	Gamepad2,
	HeartHandshake,
	LayoutDashboard,
	Library,
	ListChecks,
	NotebookPen,
	ScrollText,
	ShieldQuestion,
	Sigma,
	SpellCheck,
	Star,
	Swords,
	Timer,
	Trophy,
	WholeWord,
} from 'lucide-react'

import { getSidebarLabel, normalizeSidebarLocale } from '@/lib/sidebar-translations'
import type { SidebarLocale, SidebarNavSection } from '@/types/sidebar'

type SidebarContext = {
	activeCourseId: number | null
	isHebrewFriend?: boolean
	isSpanishFriend?: boolean
	isEnglishFriend?: boolean
	isTester?: boolean
	locale?: SidebarLocale | string | null
}

function localize(locale: SidebarLocale, key: Parameters<typeof getSidebarLabel>[1]) {
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
	const resolvedLocale = normalizeSidebarLocale(locale ?? routeLocale(activeCourseId))
	const studyItems = []
	const gameItems = []
	const toolItems = []
	const communityItems = []
	const localItems = []

	if ([6, 11, 14].includes(activeCourseId ?? -1)) {
		studyItems.push(
			{ key: 'learn', label: localize(resolvedLocale, 'nav.learn'), href: '/he/learn', iconSrc: '/icons/iconYoutube.png' },
			{ key: 'flashcards', label: localize(resolvedLocale, 'nav.flashcards'), href: '/he/flashcards', iconSrc: '/icons/iconFlashcards.png' },
			{ key: 'dictionary', label: localize(resolvedLocale, 'nav.dictionary'), href: '/he/dictionary', iconSrc: '/icons/iconDictionary.png' },
			{ key: 'lesson-scripts', label: localize(resolvedLocale, 'nav.lessonScripts'), href: '/he/lesson-scripts', iconSrc: '/icons/iconNotebook.png' },
			{ key: 'matchup', label: localize(resolvedLocale, 'nav.matchup'), href: '/he/matchup', iconSrc: '/icons/iconSocks.png' },
			{ key: 'speed-quiz', label: localize(resolvedLocale, 'nav.speedQuiz'), href: '/he/speed-quiz', iconSrc: '/man-juggling-medium-skin-tone-svgrepo-com.svg', icon: Timer },
		)

		gameItems.push(
			{ key: 'letter-quiz', label: localize(resolvedLocale, 'nav.letterQuiz'), href: '/he/letter-quiz', iconSrc: '/icons/iconLetter.png' },
			{ key: 'number-quiz', label: localize(resolvedLocale, 'nav.numberQuiz'), href: '/he/number-quiz', iconSrc: '/icons/iconNumber.png' },
			{ key: 'spelling', label: localize(resolvedLocale, 'nav.spelling'), href: '/he/spelling', iconSrc: '/icons/iconSpelling.png' },
			{ key: 'verbs', label: localize(resolvedLocale, 'nav.verbs'), href: '/he/verbs', iconSrc: '/icons/iconRunning.png' },
			{ key: 'scramble', label: localize(resolvedLocale, 'nav.scramble'), href: '/he/scramble', iconSrc: '/icons/iconScrambled.png' },
			{ key: 'sentence-builder', label: localize(resolvedLocale, 'nav.sentenceBuilder'), href: '/he/sentence-builder', iconSrc: '/icons/iconBuilding.png' },
			{
				key: 'construct-absolute',
				label: localize(resolvedLocale, 'nav.constructAbsolute'),
				href: '/he/construct-absolute',
				iconSrc: '/construction-worker-medium-skin-tone-svgrepo-com.svg',
				children: [
					{
						key: 'construct-absolute-word-sort',
						label: localize(resolvedLocale, 'nav.wordSort'),
						href: '/he/construct-absolute/word-sort',
					},
					{
						key: 'construct-absolute-conversion',
						label: localize(resolvedLocale, 'nav.conversionGame'),
						href: '/he/construct-absolute/conversion',
					},
				],
			},
		)

		toolItems.push(
			{ key: 'tanakh-books', label: localize(resolvedLocale, 'nav.tanakhBooks'), href: '/he/tanakh-books', iconSrc: '/books-svgrepo-com.svg', icon: ScrollText },
			{ key: 'memorize', label: localize(resolvedLocale, 'nav.memorize'), href: '/he/memorize', iconSrc: '/icons/iconBrain.png', icon: Brain },
			{ key: 'leaderboard', label: localize(resolvedLocale, 'nav.leaderboard'), href: '/he/leaderboard', iconSrc: '/icons/iconTrophy.png' },
			{ key: 'dashboard', label: localize(resolvedLocale, 'nav.dashboard'), href: '/he/dashboard', iconSrc: '/icons/iconName.png' },
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

	if ([3, 4, 13, 16, 17].includes(activeCourseId ?? -1)) {
		studyItems.push(
			{ key: 'learn', label: localize(resolvedLocale, 'nav.learn'), href: '/en/learn', iconSrc: '/youtube.svg', icon: BookOpen },
			{ key: 'flashcards', label: localize(resolvedLocale, 'nav.flashcards'), href: '/en/flashcards', iconSrc: '/card-file-box.svg', icon: BookDashed },
			{ key: 'dictionary', label: localize(resolvedLocale, 'nav.dictionary'), href: '/en/dictionary', iconSrc: '/open-book-svgrepo-com.svg', icon: Library },
			{ key: 'lesson-scripts', label: localize(resolvedLocale, 'nav.lessonScripts'), href: '/en/lesson-scripts', iconSrc: '/spiral-notepad-svgrepo-com.svg', icon: NotebookPen },
			{ key: 'matchup', label: localize(resolvedLocale, 'nav.matchup'), href: '/en/matchup', iconSrc: '/socks-svgrepo-com.svg', icon: ShieldQuestion },
		)

		gameItems.push(
			{ key: 'letter-quiz', label: localize(resolvedLocale, 'nav.letterQuiz'), href: '/en/letter-quiz', iconSrc: '/a-button-blood-type-svgrepo-com.svg', icon: WholeWord },
			{ key: 'number-quiz', label: localize(resolvedLocale, 'nav.numberQuiz'), href: '/en/number-quiz', iconSrc: '/input-numbers-svgrepo-com.svg', icon: Sigma },
			{ key: 'spelling', label: localize(resolvedLocale, 'nav.spelling'), href: '/en/spelling', iconSrc: '/input-latin-letters-svgrepo-com.svg', icon: SpellCheck },
			{ key: 'scramble', label: localize(resolvedLocale, 'nav.scramble'), href: '/en/scramble', iconSrc: '/cooking-svgrepo-com.svg', icon: ListChecks },
		)

		toolItems.push(
			{ key: 'leaderboard', label: localize(resolvedLocale, 'nav.leaderboard'), href: '/en/leaderboard', iconSrc: '/trophy-svgrepo-com.svg', icon: Trophy },
			{ key: 'timer', label: localize(resolvedLocale, 'nav.timer'), href: '/timer', iconSrc: '/stopwatch-svgrepo-com.svg', icon: Timer },
		)

		if ([3, 4, 16].includes(activeCourseId ?? -1)) {
			communityItems.push(
				{ key: 'slides', label: localize(resolvedLocale, 'nav.slides'), href: '/en/slides', iconSrc: '/framed-picture-svgrepo-com.svg', icon: ScrollText },
				{ key: 'starts-with', label: localize(resolvedLocale, 'nav.startsWith'), href: '/en/starts-with', iconSrc: '/video-game-svgrepo-com.svg', icon: Star },
				{ key: 'scattergories', label: localize(resolvedLocale, 'nav.scattergories'), href: '/en/scattergories', iconSrc: '/video-game-svgrepo-com.svg', icon: Gamepad2 },
			)
		}

		if (activeCourseId === 16) {
			communityItems.push({
				key: 'jeopardy',
				label: localize(resolvedLocale, 'nav.jeopardy'),
				href: '/en/jeopardy',
				iconSrc: '/video-game-svgrepo-com.svg',
				icon: Gamepad2,
			})
		}

		if (activeCourseId === 17) {
			communityItems.push({
				key: 'stories',
				label: localize(resolvedLocale, 'nav.stories'),
				href: '/en/stories',
				iconSrc: '/books-svgrepo-com.svg',
				icon: HeartHandshake,
			})
		}
	}

	if (activeCourseId === 12) {
		studyItems.push(
			{ key: 'learn', label: localize(resolvedLocale, 'nav.learn'), href: '/el/learn', iconSrc: '/youtube.svg', icon: BookOpen },
			{ key: 'flashcards', label: localize(resolvedLocale, 'nav.flashcards'), href: '/el/flashcards', iconSrc: '/card-file-box.svg', icon: BookDashed },
			{ key: 'lesson-scripts', label: localize(resolvedLocale, 'nav.lessonScripts'), href: '/el/lesson-scripts', iconSrc: '/spiral-notepad-svgrepo-com.svg', icon: NotebookPen },
		)
	}

	if (activeCourseId === 19) {
		studyItems.push({
			key: 'memorize',
			label: localize(resolvedLocale, 'nav.memorize'),
			href: '/en/memorize',
			iconSrc: '/brain-svgrepo-com.svg',
			icon: Brain,
		})
		toolItems.push({
			key: 'dashboard',
			label: localize(resolvedLocale, 'nav.dashboard'),
			href: '/he/dashboard',
			iconSrc: '/mascot.svg',
			icon: LayoutDashboard,
		})
	}

	return [
		studyItems.length
			? { key: 'study', label: localize(resolvedLocale, 'sections.study'), items: studyItems }
			: null,
		gameItems.length
			? { key: 'games', label: localize(resolvedLocale, 'sections.games'), items: gameItems }
			: null,
		communityItems.length
			? {
					key: 'community',
					label: localize(resolvedLocale, 'sections.community'),
					items: communityItems,
				}
			: null,
		toolItems.length
			? { key: 'tools', label: localize(resolvedLocale, 'sections.tools'), items: toolItems }
			: null,
		localItems.length
			? { key: 'locals', label: localize(resolvedLocale, 'sections.locals'), items: localItems }
			: null,
	].filter(Boolean) as SidebarNavSection[]
}
