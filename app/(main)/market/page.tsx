import Image from 'next/image'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
// import { Promo } from '@/components/promo'
import { FeedWrapper } from '@/components/feed-wrapper'
import { getUserProgressWithTribe } from '@/db/queries'

// import { Items } from './items'
import { Items } from './items'
import { Button } from '@/components/ui/button'

const MarketPage = async () => {
	const session = await getSession()
	if (!session?.user) redirect('/') // or your landing page
	const userProgressData = getUserProgressWithTribe()
	const userProgress = await userProgressData

	if (!userProgress || !userProgress.activeCourse) {
		return <div>Protected content</div>
	}

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			{/* <StickyWrapper>
				<UserProgress
					activeCourse={userProgress.activeCourse}
					hearts={userProgress.hearts}
					points={userProgress.points}
					hasActiveSubscription={isPro}
				/>
				{!isPro && <Promo />}
			</StickyWrapper> */}
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/icons/iconLightning.png"
						alt="Market"
						height={90}
						width={90}
					/>
					{/* <Image src="/points.svg" alt="Market" height={90} width={90} /> */}
					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						Trade
					</h1>
					<p className="text-muted-foreground text-center text-lg mb-6">
						Exchange your lightning bolts for cool things{' '}
					</p>
					<div className="flex flex-row mb-6">
						<span className="flex my-auto text-muted-foreground text-lg">
							You currently have:
						</span>
						<Button variant="ghost" className="text-orange-500">
							<Image
								src="/icons/iconLightning.png"
								// src="/points.svg"
								height={28}
								width={28}
								alt="Points"
								className="mr-2"
							/>
							{userProgress.points}
						</Button>
						<Button variant="ghost" className="text-rose-500">
							<Image
								src="/icons/iconHeart.png"
								// src="/heart.svg"
								height={22}
								width={22}
								alt="Hearts"
								className="mr-2"
							/>
							{userProgress.hearts}
						</Button>
					</div>

					<Items
						hearts={userProgress.hearts}
						points={userProgress.points}
						hasTribe={!!userProgress.tribeId}
						tribeImg={userProgress.tribeImage}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}

export default MarketPage
