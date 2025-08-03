import Image from 'next/image'
import { redirect } from 'next/navigation'

import { FeedWrapper } from '@/components/feed-wrapper'
import { UserProgress } from '@/components/user-progress'
import { StickyWrapper } from '@/components/sticky-wrapper'
import {
	getCourseProgress,
	getUserProgress,
	getUserSubscription,
} from '@/db/queries'
import { Progress } from '@/components/ui/progress'
// import { Promo } from '@/components/promo'
import { quests } from '@/constants'
import { challengeProgress, units } from '@/db/schema'
import { auth } from '@clerk/nextjs/server'
import db from '@/db/drizzle'
import { eq } from 'drizzle-orm'

const QuestsPage = async () => {
	const { userId } = await auth()
	if (!userId) redirect('/')

	const userProgressData = getUserProgress()
	const userChallengeData = await getCourseProgress()
	const userSubscriptionData = getUserSubscription()
	const courseId = userChallengeData?.activeLesson?.unit.courseId
	if (!courseId) {
		redirect('/courses') // or return null / handle error
	}
	const [userProgress, userSubscription] = await Promise.all([
		userProgressData,
		userSubscriptionData,
	])

	if (!userProgress || !userProgress.activeCourse || !userChallengeData) {
		redirect('/courses')
	}

	const isPro = !!userSubscription?.isActive

	const userUnitProgress = await db.query.units.findMany({
		where: eq(units.courseId, courseId),
		orderBy: (units, { asc }) => [asc(units.order)],
		with: {
			lessons: {
				orderBy: (lessons, { asc }) => [asc(lessons.order)],
				with: {
					challenges: {
						with: {
							challengeProgress: {
								where: eq(challengeProgress.userId, userId),
							},
						},
					},
				},
			},
		},
	})

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
					<Image src="/quests.svg" alt="Quests" height={90} width={90} />
					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						Quests
					</h1>
					<p className="text-muted-foreground text-center text-lg mb-6">
						Complete quests by earning points.
					</p>

					{/* Quest Progress */}
					<div className="w-full flex flex-col md:flex-row gap-4">
						<div className="w-full">
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
						</div>

						{/* Unit Progress Section */}
						<div className="w-full">
							<h2 className="flex md:hidden text-xl font-semibold mt-10 mb-4 text-neutral-800">
								Unit Progress
							</h2>
							{userUnitProgress.map((unit) => {
								const totalChallenges = unit.lessons.reduce(
									(acc, lesson) => acc + lesson.challenges.length,
									0
								)

								const completedChallenges = unit.lessons.reduce(
									(acc, lesson) => {
										return (
											acc +
											lesson.challenges.filter((challenge) =>
												challenge.challengeProgress?.some((p) => p.completed)
											).length
										)
									},
									0
								)

								const progress =
									totalChallenges > 0
										? (completedChallenges / totalChallenges) * 100
										: 0

								const unitTitle =
									unit.title.match(/Unit\s*\d+/)?.[0] ?? unit.title

								return (
									<div
										key={unit.id}
										className="flex items-center w-full p-4 gap-x-4 border-t-2"
									>
										<Image
											src="/points.svg"
											alt="Unit Progress"
											width={60}
											height={60}
										/>
										<div className="flex flex-col gap-y-2 w-full">
											<p className="text-neutral-700 text-xl font-bold">
												{unitTitle}
											</p>
											<Progress value={progress} className="h-3" />
										</div>
									</div>
								)
							})}
						</div>
					</div>
				</div>
			</FeedWrapper>
		</div>
	)
}

export default QuestsPage
