import Image from 'next/image'
import { redirect } from 'next/navigation'

import { FeedWrapper } from '@/components/feed-wrapper'
import { UserProgress } from '@/components/user-progress'
import { StickyWrapper } from '@/components/sticky-wrapper'
import {
	getCourseProgress,
	getTopTwentyUsers,
	getUserProgress,
	getUserSubscription,
} from '@/db/queries'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { LessonRibbon } from '@/components/lesson-ribbon'

const LearderboardPage = async () => {
	const userProgressData = getUserProgress()
	const userChallengeData = await getCourseProgress()
	const userSubscriptionData = getUserSubscription()
	const leaderboardData = getTopTwentyUsers()

	const [userProgress, userSubscription, leaderboard] = await Promise.all([
		userProgressData,
		userSubscriptionData,
		leaderboardData,
	])

	if (!userProgress || !userProgress.activeCourse) {
		redirect('/courses')
	}

	const isPro = !!userSubscription?.isActive

	// ✅ Pre-calculate ranks (ties get same rank)
	const ranks: number[] = []
	leaderboard.forEach((user, i) => {
		if (i === 0) ranks.push(1)
		else if (user.points === leaderboard[i - 1].points) {
			ranks.push(ranks[i - 1]) // same rank as previous
		} else {
			ranks.push(i + 1)
		}
	})

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/trophy-svgrepo-com.svg"
						alt="Leaderboard"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						Leaderboard
					</h1>
					<p className="text-muted-foreground text-center text-lg mb-6">
						This page is used for Cam&apos;s study groups. It will disappear
						once the app is released.
					</p>
					<Separator className="mb-4 h-0.5 rounded-full" />

					{leaderboard.map((user, index) => {
						const isOnline =
							user.lastSeen &&
							new Date(user.lastSeen).getTime() > Date.now() - 2 * 60 * 1000 // active in last 2 min

						return (
							<div
								key={user.userId}
								className="flex items-center w-full p-2 px-4 rounded-xl hover:bg-gray-200/50"
							>
								{/* Rank Number */}
								<p className="font-bold text-lime-700 mr-4">{index + 1}</p>

								{/* Avatar */}
								<div className="relative h-12 w-12 ml-3 mr-6">
									<Avatar className="h-12 w-12 border bg-sky-500">
										<AvatarImage
											className="object-cover"
											src={user.userImageSrc}
										/>
									</Avatar>

									{isOnline && (
										<span className="absolute -top-1 -right-1 block h-4 w-4 rounded-full bg-green-500 border-2 border-white" />
									)}
								</div>

								{/* Username */}
								<p className="font-bold text-neutral-800 flex-1">
									{user.userName}
								</p>

								{/* 🛡️ Shield Badge */}
								<div className="flex-1 flex justify-center">
									<LessonRibbon
										rank={ranks[index]}
										lessonNumber={user.activeLessonNumber}
									/>{' '}
								</div>

								{/* XP */}
								<p className="text-muted-foreground">{user.points} XP</p>
							</div>
						)
					})}
				</div>
			</FeedWrapper>
		</div>
	)
}

export default LearderboardPage
