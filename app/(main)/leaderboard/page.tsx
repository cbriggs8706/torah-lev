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
import { Ribbon } from '@/components/ribbon'
import { Shield } from '@/components/shield'

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

	const parseLessonNumber = (lesson: string | null): number => {
		if (!lesson) return 0

		const match = lesson.match(/^(\d+)([a-z])?$/i)
		if (!match) return 0

		const base = parseInt(match[1], 10)
		const part = match[2]?.toLowerCase()

		if (part === 'a') return base - 0.25
		if (part === 'b') return base - 0.125
		return base
	}

	// Calculate max values for normalization
	const maxPoints = Math.max(...leaderboard.map((u) => u.points || 0))
	const maxLesson = Math.max(
		...leaderboard.map((u) => parseLessonNumber(u.activeLessonNumber || '0'))
	)

	const scoredLeaderboard = leaderboard.map((user) => {
		const normalizedPoints = maxPoints ? user.points / maxPoints : 0
		const lessonValue = parseLessonNumber(user.activeLessonNumber || '0')
		const normalizedLesson = maxLesson ? lessonValue / maxLesson : 0

		const score = 0.5 * normalizedPoints + 0.5 * normalizedLesson
		return { ...user, score }
	})

	scoredLeaderboard.sort((a, b) => b.score - a.score)

	const ranks: number[] = []
	scoredLeaderboard.forEach((user, i) => {
		if (i === 0) ranks.push(1)
		else if (user.score === scoredLeaderboard[i - 1].score) {
			ranks.push(ranks[i - 1]) // tie
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

					{/* ✅ Table with Headers */}
					<table className="hidden md:table w-full border-collapse">
						<thead>
							<tr className="text-left text-gray-600">
								<th className="px-4 py-2">Rank</th>
								<th className="px-4 py-2">Avatar</th>
								<th className="px-4 py-2">Username</th>
								<th className="px-4 py-2 text-center w-[64px]">Lesson</th>
								<th className="px-4 py-2 text-right">Points</th>
							</tr>
						</thead>
						<tbody>
							{scoredLeaderboard.map((user, index) => {
								const isOnline =
									user.lastSeen &&
									new Date(user.lastSeen).getTime() > Date.now() - 2 * 60 * 1000

								return (
									<tr
										key={user.userId}
										className="hover:bg-gray-200/50 transition"
									>
										{/* Rank */}
										<td className="px-4 py-2">
											<Ribbon rank={ranks[index]} />
										</td>

										{/* Avatar */}
										<td className="px-4 py-2">
											<div className="relative h-12 w-12">
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
										</td>

										{/* Username */}
										<td className="px-4 py-2 font-bold text-neutral-800">
											{user.userName}
										</td>

										{/* Lesson */}
										<td className="px-4 py-2 text-center">
											<Shield lessonNumber={user.activeLessonNumber} />
										</td>

										{/* Points */}
										<td className="px-4 py-2 text-right text-muted-foreground">
											{user.points} XP
										</td>
									</tr>
								)
							})}
						</tbody>
					</table>
					<div className="flex flex-col gap-4 md:hidden">
						{scoredLeaderboard.map((user, index) => (
							<div
								key={user.userId}
								className="flex items-center p-4 rounded-lg bg-gray-50 shadow-sm"
							>
								<Ribbon rank={ranks[index]} />
								<Avatar className="h-10 w-10 mx-3">
									<AvatarImage src={user.userImageSrc} />
								</Avatar>
								<div className="flex flex-col flex-1">
									<p className="font-bold">{user.userName}</p>
									<p className="text-sm text-gray-500">
										Lesson: {user.activeLessonNumber} | {user.points} XP
									</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</FeedWrapper>
		</div>
	)
}

export default LearderboardPage
