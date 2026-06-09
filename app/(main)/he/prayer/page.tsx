import Image from 'next/image'
import { FeedWrapper } from '@/components/feed-wrapper'
import { DismissibleAlert } from '@/components/dismissible-alert'
import Link from 'next/link'
import { getAllPrayersWithLines } from '@/db/queries'
import PrayerList from '@/components/hebrew/hebrew-prayer-list'

const HebrewPrayerPage = async () => {
	const prayers = await getAllPrayersWithLines()

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/icons/iconPraying.png"
						// src="/folded-hands-medium-dark-skin-tone-svgrepo-com.svg"
						alt="Prayer"
						height={48}
						width={48}
					/>
					<h1 className="text-center font-cardo text-neutral-800 text-6xl my-6">
						תְּפִלּוֹת
					</h1>
					<p className="text-center font-bold text-neutral-800 mb-2">Prayers</p>
					{/* <DismissibleAlert storageKey="matchup" className="mb-4">
						{' '}
						Prayers
					</DismissibleAlert> */}
				</div>
				<div className="space-y-4">
					<PrayerList prayers={prayers} />
				</div>
			</FeedWrapper>
		</div>
	)
}

export default HebrewPrayerPage
