import { FeedWrapper } from '@/components/feed-wrapper'
import {
	getCurrentUserActiveCourseId,
	getTopTwentyUsersByCourse,
} from '@/db/queries'
import EnglishLeaderboard from '@/components/english/english-leaderboard'

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
	const allUsers = await getTopTwentyUsersByCourse(activeCourseId)

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<EnglishLeaderboard users={allUsers} />
			</FeedWrapper>
		</div>
	)
}
