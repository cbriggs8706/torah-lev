import type { LucideIcon } from 'lucide-react'

export type SidebarLocale = 'en' | 'es' | 'he' | 'el'

export type SidebarTranslationKey =
	| 'sections.study'
	| 'sections.games'
	| 'sections.tools'
	| 'sections.community'
	| 'sections.locals'
	| 'sections.account'
	| 'brand.title'
	| 'brand.subtitle'
	| 'stats.hearts'
	| 'stats.points'
	| 'courses.chooseCourse'
	| 'courses.viewCourses'
	| 'actions.logIn'
	| 'actions.logOut'
	| 'actions.createAccount'
	| 'actions.language'
	| 'actions.market'
	| 'actions.currentlyViewing'
	| 'actions.swapCourse'
	| 'actions.swapCourses'
	| 'nav.learn'
	| 'nav.introduction'
	| 'nav.flashcards'
	| 'nav.dictionary'
	| 'nav.matchup'
	| 'nav.quiz'
	| 'nav.letterQuiz'
	| 'nav.vowels'
	| 'nav.syllables'
	| 'nav.numberQuiz'
	| 'nav.lessonScripts'
	| 'nav.spelling'
	| 'nav.music'
	| 'nav.leaderboard'
	| 'nav.dashboard'
	| 'nav.memorize'
	| 'nav.tanakhBooks'
	| 'nav.stories'
	| 'nav.verbs'
	| 'nav.speedQuiz'
	| 'nav.scramble'
	| 'nav.sentenceBuilder'
	| 'nav.constructAbsolute'
	| 'nav.wordSort'
	| 'nav.conversionGame'
	| 'nav.identifyForm'
	| 'nav.prayer'
	| 'nav.slides'
	| 'nav.startsWith'
	| 'nav.scattergories'
	| 'nav.jeopardy'
	| 'nav.timer'
	| 'nav.progress'
	| 'nav.calendar'
	| 'nav.help'
	| 'nav.quests'
	| 'nav.courses'

export type SidebarNavItem = {
	key: string
	label: string
	href: string
	icon?: LucideIcon
	iconSrc?: string
	children?: { key: string; label: string; href: string }[]
}

export type SidebarNavSection = {
	key: string
	label: string
	items: SidebarNavItem[]
}
