import Image from 'next/image'
import { redirect } from 'next/navigation'

import { FeedWrapper } from '@/components/feed-wrapper'
import {
	getCourseProgress,
	getTopTwentyUsers,
	getUserProgress,
	getUserSubscription,
	getTribeLeaderboard,
} from '@/db/queries'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { Ribbon } from '@/components/ribbon'
import { Shield } from '@/components/shield'
import { DismissibleAlert } from '@/components/dismissible-alert'

const LeaderboardPage = async () => {
	const [userProgress, userSubscription, leaderboard, tribeLeaderboardData] =
		await Promise.all([
			getUserProgress(),
			getUserSubscription(),
			getTopTwentyUsers(),
			getTribeLeaderboard(),
		])

	if (!userProgress || !userProgress.activeCourse) {
		redirect('/courses')
	}

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

	// Rank users
	const maxPoints = Math.max(...leaderboard.map((u) => u.points || 0))
	const maxLesson = Math.max(
		...leaderboard.map((u) => parseLessonNumber(u.activeLessonNumber || '0'))
	)

	const scoredLeaderboard = leaderboard
		.map((user) => {
			const normalizedPoints = maxPoints ? user.points / maxPoints : 0
			const lessonValue = parseLessonNumber(user.activeLessonNumber || '0')
			const normalizedLesson = maxLesson ? lessonValue / maxLesson : 0
			const score = 0.5 * normalizedPoints + 0.5 * normalizedLesson
			return { ...user, score }
		})
		.sort((a, b) => b.score - a.score)

	const userRanks: number[] = []
	scoredLeaderboard.forEach((user, i) => {
		if (i === 0) userRanks.push(1)
		else if (user.score === scoredLeaderboard[i - 1].score) {
			userRanks.push(userRanks[i - 1])
		} else {
			userRanks.push(i + 1)
		}
	})

	// Rank tribes (filter out tribes with no members)
	const tribesWithMembers = tribeLeaderboardData.filter(
		(tribe) => tribe.members.length > 0
	)
	tribesWithMembers.sort((a, b) => b.tribePoints - a.tribePoints)

	const containsHebrew = (text: string) => /[\u0590-\u05FF]/.test(text)

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

					<Separator className="mb-4 h-0.5 rounded-full" />

					{/* ✅ User Leaderboard */}
					<table className="hidden md:table w-full border-collapse mb-8">
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
										<td className="px-4 py-2">
											<Ribbon rank={userRanks[index]} />
										</td>
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
										<td
											className={`px-4 py-2 text-neutral-800 ${
												containsHebrew(user.userName)
													? 'text-3xl font-serif'
													: ''
											}`}
										>
											{user.userName}
										</td>
										<td className="px-4 py-2 text-center">
											<Shield lessonNumber={user.activeLessonNumber} />
										</td>
										<td className="px-4 py-2 text-right text-muted-foreground">
											{user.points} XP
										</td>
									</tr>
								)
							})}
						</tbody>
					</table>

					{/* Mobile Leaderboard */}
					<div className="flex flex-col gap-4 md:hidden">
						{scoredLeaderboard.map((user, index) => (
							<div
								key={user.userId}
								className="flex items-center p-4 rounded-lg bg-gray-50 shadow-sm"
							>
								<Ribbon rank={userRanks[index]} />
								<Avatar className="h-10 w-10 mx-3">
									<AvatarImage src={user.userImageSrc} />
								</Avatar>
								<div className="flex flex-col flex-1">
									<p className="font-bold">{user.userName}</p>
									<p className="text-sm text-gray-500"></p>
									<p>
										Lesson: {user.activeLessonNumber} | {user.points} XP
									</p>
								</div>
							</div>
						))}
					</div>

					{/* ✅ Tribe Leaderboard */}
					<Separator className="my-6 h-0.5 rounded-full" />
					<h2 className="text-xl font-bold mb-4">Tribe Rankings</h2>
					<DismissibleAlert storageKey="tribeRank" className="mb-4">
						You earn one tribe point every day that you login.{' '}
						<p>
							Weighted: 10% Avg Lesson, 40% Sum of User Points, 50% Tribe
							Points.
						</p>
						<p>
							You can trade in personal points for team points by clicking the
							lightning bolt in the menu.
						</p>
					</DismissibleAlert>
					<table className="hidden md:table w-full border-collapse">
						<thead>
							<tr className="text-left text-gray-600">
								<th className="px-4 py-2">Rank</th>
								<th className="px-4 py-2">Tribe</th>
								<th className="px-4 py-2">Avg Lesson</th> {/* ✅ new */}
								<th className="px-4 py-2">Sum Points</th> {/* ✅ new */}
								<th className="px-4 py-2">Tribe Points</th>
								<th className="px-4 py-2">Members</th>
							</tr>
						</thead>
						<tbody>
							{tribesWithMembers.map((tribe, index) => (
								<tr
									key={tribe.tribeId}
									className="hover:bg-gray-200/50 transition"
								>
									<td className="px-4 py-2">
										<Ribbon rank={index + 1} />
									</td>
									<td className="px-4 py-2 flex items-center gap-2">
										<Image
											src={tribe.tribeImage || '/default-tribe.svg'}
											alt={tribe.tribeEngName}
											width={42}
											height={42}
											className="rounded-full border"
										/>
										<span className="font-serif text-2xl">
											{tribe.tribeHebName}
										</span>
									</td>

									{/* ✅ New Columns */}
									<td className="px-4 py-2">{tribe.avgLesson.toFixed(2)}</td>
									<td className="px-4 py-2">{tribe.totalMemberPoints}</td>

									{/* Existing Columns */}
									<td className="px-4 py-2">{tribe.tribePoints} XP</td>
									<td className="px-4 py-2">{tribe.members.join(', ')}</td>
								</tr>
							))}
						</tbody>
					</table>

					{/* ✅ Mobile Version */}
					<div className="flex flex-col gap-4 md:hidden mt-6 w-full">
						{tribesWithMembers.map((tribe, index) => (
							<div
								key={tribe.tribeId}
								className="p-4 rounded-lg bg-gray-50 shadow-sm"
							>
								<div className="flex items-center gap-2 mb-1">
									<Ribbon rank={index + 1} />
									<div className="flex items-center gap-2">
										<Image
											src={tribe.tribeImage || '/default-tribe.svg'}
											alt={tribe.tribeEngName}
											width={40}
											height={40}
											className="rounded-full border"
										/>
										<p className="font-bold">{tribe.tribeHebName}</p>
									</div>{' '}
								</div>
								<p className="text-sm text-gray-600 mb-1">
									Tribe Points: {tribe.tribePoints} XP
								</p>
								<p className="text-sm text-gray-600">
									Members: {tribe.members.join(', ')}
								</p>
							</div>
						))}
					</div>
				</div>
			</FeedWrapper>
		</div>
	)
}

export default LeaderboardPage
