import { redirect } from 'next/navigation'
import { FeedWrapper } from '@/components/feed-wrapper'
import {
	getTopTwentyUsersByCourse,
	getUserProgress,
	getUserSubscription,
} from '@/db/queries'
import EnglishLeaderboard from '@/components/english/english-leaderboard'

export default async function LeaderboardPage() {
	const [userProgress, userSubscription] = await Promise.all([
		getUserProgress(),
		getUserSubscription(),
	])

	if (!userProgress || !userProgress.activeCourse) {
		redirect('/courses')
	}

	// 🆕 get only users in the current course
	const allUsers = await getTopTwentyUsersByCourse(userProgress.activeCourse.id)

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<EnglishLeaderboard users={allUsers} />
			</FeedWrapper>
		</div>
	)
}
