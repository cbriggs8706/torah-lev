// app/(main)/leaderboard/page.tsx
import { redirect } from 'next/navigation'
import { FeedWrapper } from '@/components/feed-wrapper'
import {
	getTopTwentyUsers,
	getUserProgress,
	getUserSubscription,
} from '@/db/queries'
import HebrewLeaderboard from '@/components/hebrew/hebrew-leaderboard'
import EnglishLeaderboard from '@/components/english/english-leaderboard'
import SpanishLeaderboard from '@/components/spanish/spanish-leaderboard'
import GreekLeaderboard from '@/components/greek/greek-leaderboard'

export default async function LeaderboardPage() {
	const [userProgress, userSubscription, allUsers] = await Promise.all([
		getUserProgress(),
		getUserSubscription(),
		getTopTwentyUsers(),
	])

	if (!userProgress || !userProgress.activeCourse) {
		redirect('/courses')
	}

	const isHebrew = [6, 11, 14].includes(userProgress.activeCourse.id)

	const isEnglish = [3, 4, 13, 16].includes(userProgress.activeCourse.id)

	const isSpanish = [2].includes(userProgress.activeCourse.id)

	const isGreek = [12].includes(userProgress.activeCourse.id)

	//  const hebrewUsers = allUsers.filter((u) => [6, 11, 14].includes(u.activeCourseId))
	//   const spanishUsers = allUsers.filter((u) => [2].includes(u.activeCourseId))
	//   const greekUsers = allUsers.filter((u) => [12].includes(u.activeCourseId))
	//   const englishUsers = allUsers.filter((u) => [3, 4, 13, 16].includes(u.activeCourseId))

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				{isHebrew ? (
					<HebrewLeaderboard />
				) : isSpanish ? (
					<SpanishLeaderboard />
				) : isGreek ? (
					<GreekLeaderboard />
				) : (
					<EnglishLeaderboard />
				)}
				{/* {isHebrew ? (
					<HebrewLeaderboard users={hebrewUsers}/>
				) : isSpanish ? (
					<SpanishLeaderboard users={spanishUsers} />
				) : isGreek ? (
					<GreekLeaderboard users={greekUsers}/>
				) : (
					<EnglishLeaderboard users={englishUsers} />
				)} */}
			</FeedWrapper>
		</div>
	)
}
