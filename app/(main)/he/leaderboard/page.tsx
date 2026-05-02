import { FeedWrapper } from '@/components/feed-wrapper'
import {
	getCurrentUserActiveCourseId,
	getTopTwentyHebrewUsersByCourse,
} from '@/db/queries'
import HebrewLeaderboard from '@/components/hebrew/hebrew-leaderboard'

export default async function LeaderboardPage() {
	const activeCourseId = await getCurrentUserActiveCourseId()

	if (!activeCourseId) {
		return (
			<div className="text-center text-red-500 mt-10">
				You must be logged in to view the dashboard.
			</div>
		)
	}

	// 🆕 get only users in the current course
	const allUsers = await getTopTwentyHebrewUsersByCourse(activeCourseId)

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<HebrewLeaderboard users={allUsers} />
			</FeedWrapper>
		</div>
	)
}
