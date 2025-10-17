import Image from 'next/image'
import { FeedWrapper } from '@/components/feed-wrapper'
import { getPrayerWithLines } from '@/db/queries'
import { notFound } from 'next/navigation'
import { HebrewPrayerWithLines } from '@/db/types'
import PrayerLinesTable from '@/components/hebrew/hebrew-prayer-lines-table'

export default async function PrayerDetailPage({ params }: any) {
	const prayerId = Number(params.id)
	if (isNaN(prayerId)) return notFound()

	const prayer: HebrewPrayerWithLines | undefined = await getPrayerWithLines(
		prayerId
	)
	if (!prayer) return notFound()

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/icons/iconPraying.png"
						// src="/folded-hands-medium-dark-skin-tone-svgrepo-com.svg"
						alt="Prayer"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-cardo text-neutral-800 text-6xl my-6">
						תְּפִלָּה
					</h1>
					<p className="text-center font-bold text-neutral-800 mb-2">Prayer</p>
					<h1 className="text-center font-bold text-neutral-800 text-2xl">
						{prayer.title}
					</h1>
				</div>

				{prayer.hebTitle && (
					<h2 className="text-center text-2xl font-hebrew mb-1">
						{prayer.hebTitle}
					</h2>
				)}
				{prayer.titleTransliteration && (
					<p className="text-center italic text-gray-600 mb-4">
						{prayer.titleTransliteration}
					</p>
				)}

				<PrayerLinesTable lines={prayer.lines} prayerId={prayer.id} />
			</FeedWrapper>
		</div>
	)
}
