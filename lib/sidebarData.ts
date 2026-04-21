import {
	BookMarked,
	BookOpen,
	Flame,
	FolderKanban,
	Calendar,
	HeartHandshake,
	LifeBuoy,
	House,
	LibraryBig,
	ScrollText,
	Send,
	Music,
	BookKey,
	HandHeart,
	Trophy,
} from 'lucide-react'
import type { TFunction } from '@/types/i18n'

export function buildSidebarData(t: TFunction, locale: string) {
	return {
		navMain: [
			{
				title: 'Home',
				url: `/${locale}/dashboard`,
				icon: House,
			},
			{
				title: t('sidebar.main.courses'),
				url: `/${locale}/courses`,
				icon: LibraryBig,
				items: [
					{ title: 'Current path', url: `/${locale}/courses` },
					{ title: 'Study library', url: `/${locale}/courses` },
				],
			},
			{
				title: 'Study Groups',
				url: `/${locale}/study-groups`,
				icon: HeartHandshake,
				items: [
					{ title: 'Join a group', url: `/${locale}/study-groups` },
					{ title: 'My groups', url: `/${locale}/study-groups` },
				],
			},
			{
				title: t('sidebar.main.reader'),
				url: `/${locale}/reader/hebrew`,
				icon: ScrollText,
				items: [
					{ title: 'Scripture reading', url: `/${locale}/reader/hebrew` },
					{ title: 'Hebrew reader', url: `/${locale}/reader/hebrew` },
				],
			},
			{
				title: t('sidebar.main.alphabet'),
				url: `/${locale}/hebrew/alphabet`,
				icon: BookMarked,
				items: [
					{ title: t('sidebar.alphabet.names'), url: `/${locale}/hebrew/alphabet` },
					{ title: t('sidebar.alphabet.sounds'), url: `/${locale}/hebrew/alphabet` },
				],
			},
			{
				title: 'Practice',
				url: `/${locale}/dashboard`,
				icon: HeartHandshake,
				items: [
					{ title: 'Daily review', url: `/${locale}/dashboard` },
					{ title: 'Flashcards', url: `/${locale}/courses` },
					{ title: 'Prayer phrases', url: `/${locale}/dashboard` },
				],
			},
			{
				title: 'Progress',
				url: `/${locale}/dashboard`,
				icon: Flame,
				items: [
					{ title: 'Streak & hearts', url: `/${locale}/dashboard` },
					{ title: 'Completed lessons', url: `/${locale}/courses` },
				],
			},
		],

		navSecondary: [
			{ title: t('sidebar.secondary.leaderboard'), url: '#', icon: Trophy },
			{ title: t('sidebar.secondary.calendar'), url: '#', icon: Calendar },
			{ title: t('sidebar.secondary.help'), url: '#', icon: LifeBuoy },
			{ title: t('sidebar.secondary.feedback'), url: '#', icon: Send },
		],

		input: [
			{ name: t('sidebar.input.songs'), url: '#', icon: Music },
			{ name: t('sidebar.input.stories'), url: '#', icon: BookOpen },
			{ name: t('sidebar.input.scriptures'), url: '#', icon: BookKey },
			{ name: t('sidebar.input.prayers'), url: '#', icon: HandHeart },
		],
	}
}

export function getTeacherNav(t: TFunction, locale: string) {
	return [
		{
			title: t('sidebar.teacher.title'),
			url: `/${locale}/admin/learning`,
			icon: FolderKanban,
			isActive: true,
			items: [
				{
					title: 'Lessons',
					url: `/${locale}/admin/learning`,
				},
				{
					title: 'Study Groups',
					url: `/${locale}/admin/learning/study-groups`,
				},
				{
					title: 'Courses',
					url: `/${locale}/admin/learning/courses`,
				},
				{
					title: 'Modules',
					url: `/${locale}/admin/learning/modules`,
				},
				{
					title: 'Quizzes',
					url: `/${locale}/admin/learning/quizzes`,
				},
				{
					title: 'Quiz Questions',
					url: `/${locale}/admin/learning/quiz-questions`,
				},
				{
					title: 'Organizations',
					url: `/${locale}/admin/learning/organizations`,
				},
				{
					title: 'Target Languages',
					url: `/${locale}/admin/learning/target-languages`,
				},
				{
					title: 'Media Library',
					url: `/${locale}/admin/media`,
				},
				{
					title: 'Hebrew Ingest',
					url: `/${locale}/admin/hebrew-ingest`,
				},
			],
		},
	]
}
