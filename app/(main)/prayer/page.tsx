import Image from 'next/image'
import { FeedWrapper } from '@/components/feed-wrapper'
import { DismissibleAlert } from '@/components/dismissible-alert'
import Link from 'next/link'
import { getAllPrayersWithLines } from '@/db/queries'

const HebrewPrayerPage = async () => {
	const prayers = await getAllPrayersWithLines()

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/folded-hands-medium-dark-skin-tone-svgrepo-com.svg"
						alt="Prayer"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						Prayers
					</h1>
					{/* <DismissibleAlert storageKey="matchup" className="mb-4">
						{' '}
						Prayers
					</DismissibleAlert> */}
				</div>
				<div className="space-y-4">
					{prayers.map((prayer) => (
						<div
							key={prayer.id}
							className="rounded-lg border p-4 shadow hover:shadow-md transition"
						>
							<h2 className="text-xl font-semibold">{prayer.title}</h2>
							{prayer.hebTitle && (
								<p className="text-lg font-hebrew">{prayer.hebTitle}</p>
							)}
							{prayer.titleTransliteration && (
								<p className="italic text-gray-600">
									{prayer.titleTransliteration}
								</p>
							)}

							{/* Link to detail page */}
							<Link
								href={`/prayer/${prayer.id}`}
								className="inline-block mt-3 px-3 py-1 bg-sky-500 text-white rounded hover:bg-sky-700 transition"
							>
								View Prayer
							</Link>
						</div>
					))}
				</div>
			</FeedWrapper>
		</div>
	)
}

export default HebrewPrayerPage
