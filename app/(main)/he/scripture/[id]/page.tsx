import Image from 'next/image'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

import { FeedWrapper } from '@/components/feed-wrapper'
import HebrewStoryViewer from '@/components/hebrew/hebrew-story-viewer'
import { getHebrewScripture } from '@/db/queries'
import { getTanakhBookDisplayName } from '@/lib/tanakh-books'
import { normalizeSidebarLocale } from '@/lib/sidebar-translations'
import type { SidebarLocale } from '@/types/sidebar'

const backLabelByLocale: Record<SidebarLocale, string> = {
	en: 'Back to Scripture',
	es: 'Volver a Escritura',
	he: 'חזרה לכתבי הקודש',
	el: 'Πίσω στη Γραφή',
}

function referenceLabel(scripture: {
	scriptureBook?: string | null
	scriptureChapter?: number | null
	scriptureVerses?: string | null
}, locale: SidebarLocale) {
	const book = getTanakhBookDisplayName(scripture.scriptureBook, locale)
	const chapter = scripture.scriptureChapter
	const verses = scripture.scriptureVerses

	if (book && chapter != null && verses) return `${book} ${chapter}:${verses}`
	if (book && chapter != null) return `${book} ${chapter}`
	return book
}

export default async function HebrewScriptureDetailPage({ params }: any) {
	const { id } = await params
	const cookieStore = await cookies()
	const sidebarLocale = normalizeSidebarLocale(
		cookieStore.get('sidebarLocale')?.value
	)
	const scripture = await getHebrewScripture(Number(id))

	if (!scripture) return notFound()

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
						{referenceLabel(scripture, sidebarLocale)}
					</p>
				</div>
				<HebrewStoryViewer
					story={scripture}
					backHref="/he/scripture"
					backLabel={backLabelByLocale[sidebarLocale]}
				/>
			</FeedWrapper>
		</div>
	)
}
