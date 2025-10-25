import Image from 'next/image'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'
import { FeedWrapper } from '@/components/feed-wrapper'
import { UserProgress } from '@/components/user-progress'
import { StickyWrapper } from '@/components/sticky-wrapper'
import { getUserProgress, getUserSubscription } from '@/db/queries'
import { Progress } from '@/components/ui/progress'
// import { Promo } from '@/components/promo'
import { quests } from '@/constants'

const QuestsPage = async () => {
	const session = await getServerSession(options)
	if (!session?.user) redirect('/') // or your landing page
	const userProgressData = getUserProgress()
	const userSubscriptionData = getUserSubscription()

	const [userProgress, userSubscription] = await Promise.all([
		userProgressData,
		userSubscriptionData,
	])

	if (!userProgress || !userProgress.activeCourse) {
		return <div>Protected content</div>
	}

	const isPro = !!userSubscription?.isActive

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
						src="/information-source.svg"
						alt="Help"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						Help
					</h1>
					<p className="text-muted-foreground text-center text-lg mb-6">
						Coming soon...
					</p>

					{/* <ul className="w-full space-y-4">
						<li className="flex flex-row">
							<img src="/is.svg" className="mr-2 w-10" />
							<span className="my-auto">Beginner: Sun Sep 8 - Lesson 6</span>
						</li>
						<li className="flex flex-row">
							<img src="/is.svg" className="mr-2 w-10" />
							<span className="my-auto">Beginner: Mon Sep 9 - Lesson 7</span>
						</li>
						<li className="flex flex-row">
							<img src="/mx.svg" className="mr-2 w-10" />
							<span className="my-auto">
								Intermediate: Tue Sep 10 - Lesson 3
							</span>
						</li>
						<hr />
						<li className="flex flex-row">
							<img src="/is.svg" className="mr-2 w-10" />
							<span className="my-auto">Beginner: Sun Sep 15 - Lesson 7</span>
						</li>
						<li className="flex flex-row">
							<img src="/is.svg" className="mr-2 w-10" />
							<span className="my-auto">Beginner: Mon Sep 16 - Skip Week</span>
						</li>
						<li className="flex flex-row">
							<img src="/mx.svg" className="mr-2 w-10" />
							<span className="my-auto">
								Intermediate: Tue Sep 17 - Lesson 4
							</span>
						</li>
					</ul> */}
				</div>
				{/* <div className="border-2 rounded-xl p-4 space-y-4 mt-10">
					<p className="text-muted-foreground text-center text-lg mb-6">
						Upcoming Classes
					</p>
					<ul className="w-full space-y-4">
						<li className="flex flex-row">
							<img src="/is.svg" className="mr-2 w-10" />
							<span className="my-auto">
								Sundays 5pm - 10 Week Beginner Hebrew Alphabet Starts September
								29 at BFSC
							</span>
						</li>
						<li className="flex flex-row">
							<img src="/mx.svg" className="mr-2 w-10" />
							<span className="my-auto">
								Thursdays 5pm - 10 Week Super Beginner Spanish Starts October 3
								at BFSC
							</span>
						</li>
						<li className="flex flex-row">
							<img src="/us.svg" className="mr-2 w-10" />
							<span className="my-auto">
								Martes y Jueves 6:30pm - English Connect 1 & 2 Empieza por
								Noviembre @ Community Council of Idaho
							</span>
						</li>
					</ul>
				</div> */}
			</FeedWrapper>
		</div>
	)
}

export default QuestsPage
