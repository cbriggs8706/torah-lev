'use server'
import Image from 'next/image'
import { redirect } from 'next/navigation'

import { FeedWrapper } from '@/components/feed-wrapper'
import { UserProgress } from '@/components/user-progress'
import { StickyWrapper } from '@/components/sticky-wrapper'
import { getUserProgress, getUserSubscription } from '@/db/queries'
import { Progress } from '@/components/ui/progress'
// import { Promo } from '@/components/promo'
import { quests } from '@/constants'

const CalendarPage = async () => {
	const userProgressData = getUserProgress()
	const userSubscriptionData = getUserSubscription()

	const [userProgress, userSubscription] = await Promise.all([
		userProgressData,
		userSubscriptionData,
	])

	if (!userProgress || !userProgress.activeCourse) {
		redirect('/courses')
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
						src="/spiral-calendar-pad.svg"
						alt="Calendar"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						Calendar
					</h1>
					<p className="text-muted-foreground text-center text-lg mb-6">
						Upcoming Homework
					</p>

					<ul className="w-full space-y-4">
						<li className="flex flex-row">
							<Image
								src="/is.svg"
								className="mr-2 w-10"
								alt="icon"
								width={40}
								height={20}
							/>
							<span className="my-auto">Beginner: Sun Sep 8 - Lesson 6</span>
						</li>
						<li className="flex flex-row">
							<Image
								src="/is.svg"
								className="mr-2 w-10"
								alt="icon"
								width={40}
								height={20}
							/>
							<span className="my-auto">Beginner: Mon Sep 9 - Lesson 7</span>
						</li>
						<li className="flex flex-row">
							<Image
								src="/mx.svg"
								className="mr-2 w-10"
								alt="icon"
								width={40}
								height={20}
							/>
							<span className="my-auto">
								Intermediate: Tue Sep 10 - Lesson 3
							</span>
						</li>
						<hr />
						<li className="flex flex-row">
							<Image
								src="/is.svg"
								className="mr-2 w-10"
								alt="icon"
								width={40}
								height={20}
							/>
							<span className="my-auto">Beginner: Sun Sep 15 - Lesson 7</span>
						</li>
						<li className="flex flex-row">
							<Image
								src="/is.svg"
								className="mr-2 w-10"
								alt="icon"
								width={40}
								height={20}
							/>
							<span className="my-auto">Beginner: Mon Sep 16 - Skip Week</span>
						</li>
						<li className="flex flex-row">
							<Image
								src="/mx.svg"
								className="mr-2 w-10"
								alt="icon"
								width={40}
								height={20}
							/>
							<span className="my-auto">
								Intermediate: Tue Sep 17 - Lesson 4
							</span>
						</li>
					</ul>
				</div>
				<div className="border-2 rounded-xl p-4 space-y-4 mt-10">
					<p className="text-muted-foreground text-center text-lg mb-6">
						Upcoming Classes
					</p>
					{/* <ul className="w-full space-y-4">
						<li className="flex flex-row">
							<Image
								src="/is.svg"
								className="mr-2 w-10"
								alt="icon"
								width={40}
								height={20}
							/>
							<span className="my-auto">
								Sundays 5pm - 10 Week Beginner Hebrew Alphabet Starts September
								29 at BFSC
							</span>
						</li>
						<li className="flex flex-row">
							<Image
								src="/mx.svg"
								className="mr-2 w-10"
								alt="icon"
								width={40}
								height={20}
							/>
							<span className="my-auto">
								Thursdays 5pm - 10 Week Super Beginner Spanish Starts October 3
								at BFSC
							</span>
						</li>
						<li className="flex flex-row">
							<Image
								src="/us.svg"
								className="mr-2 w-10"
								alt="icon"
								width={40}
								height={20}
							/>
							<span className="my-auto">
								Martes y Jueves 6:30pm - English Connect 1 & 2 Empieza por
								Noviembre @ Community Council of Idaho
							</span>
						</li>
					</ul> */}
				</div>
				{/* <div className="w-full flex flex-col items-center">
					<Image src="/quests.svg" alt="Quests" height={90} width={90} />
					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						Quests
					</h1>
					<p className="text-muted-foreground text-center text-lg mb-6">
						Complete quests by earning points.
					</p>
					<ul className="w-full">
						{quests.map((quest) => {
							const progress = (userProgress.points / quest.value) * 100

							return (
								<div
									className="flex items-center w-full p-4 gap-x-4 border-t-2"
									key={quest.title}
								>
									<Image
										src="/points.svg"
										alt="Points"
										width={60}
										height={60}
									/>
									<div className="flex flex-col gap-y-2 w-full">
										<p className="text-neutral-700 text-xl font-bold">
											{quest.title}
										</p>
										<Progress value={progress} className="h-3" />
									</div>
								</div>
							)
						})}
					</ul>
				</div> */}
			</FeedWrapper>
		</div>
	)
}

export default CalendarPage
