import Image from 'next/image'
import { cookies } from 'next/headers'

import { FeedWrapper } from '@/components/feed-wrapper'
import HebrewScriptureList from '@/components/hebrew/hebrew-scripture-list'
import { getAllHebrewScriptures, getUserProgress } from '@/db/queries'
import { getSession } from '@/lib/auth'
import { normalizeSidebarLocale } from '@/lib/sidebar-translations'

const pageTextByLocale = {
	en: {
		subtitle: 'Scripture',
		guest: 'You’re using guest mode - progress will not be saved.',
	},
	es: {
		subtitle: 'Escritura',
		guest: 'Estás usando el modo invitado - el progreso no se guardará.',
	},
	he: {
		subtitle: 'כתבי הקודש',
		guest: 'מצב אורח - ההתקדמות לא תישמר.',
	},
	el: {
		subtitle: 'Γραφή',
		guest: 'Χρησιμοποιείς λειτουργία επισκέπτη - η πρόοδος δεν θα αποθηκευτεί.',
	},
}

export default async function HebrewScripturePage() {
	const session = await getSession()
	const cookieStore = await cookies()
	const sidebarLocale = normalizeSidebarLocale(
		cookieStore.get('sidebarLocale')?.value
	)
	const pageText = pageTextByLocale[sidebarLocale]
	const userId = session?.user?.id ?? null
	const userProgress = userId ? await getUserProgress() : null

	const isHebrewFriend = !!userProgress?.isHebrewFriend
	const currentLesson = userProgress?.activeLessonId ?? 1
	const currentCourse = userProgress?.activeCourse?.id ?? 6
	const scriptures = await getAllHebrewScriptures(currentCourse)

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="flex w-full flex-col items-center">
					<Image
						src="/icons/iconScroll.png"
						alt="Scripture"
						height={48}
						width={48}
					/>
					<h1 className="my-6 text-center font-cardo text-6xl text-neutral-800">
						כִּתְבֵי הַקֹּדֶשׁ
					</h1>
					<p className="mb-2 text-center font-bold text-neutral-800">
						{pageText.subtitle}
					</p>

					{!userId && (
						<p className="mb-3 italic text-gray-500">
							{pageText.guest}
						</p>
					)}
				</div>

				<div className="space-y-4">
					<HebrewScriptureList
						scriptures={scriptures}
						isFriend={isHebrewFriend}
						currentLesson={currentLesson}
						startLocale={sidebarLocale}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}
