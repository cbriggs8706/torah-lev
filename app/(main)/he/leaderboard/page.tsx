import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'
import { FeedWrapper } from '@/components/feed-wrapper'
import {
	getTopTwentyUsersByCourse,
	getUserProgress,
	getUserSubscription,
} from '@/db/queries'
import HebrewLeaderboard from '@/components/hebrew/hebrew-leaderboard'

export default async function LeaderboardPage() {
	// const session = await getServerSession(options)
	// if (!session?.user) redirect('/') // or your landing page
	const [userProgress, userSubscription] = await Promise.all([
		getUserProgress(),
		getUserSubscription(),
	])

	if (!userProgress || !userProgress.activeCourse) {
		return (
			<div className="text-center text-red-500 mt-10">
				You must be logged in to view the dashboard.
			</div>
		)
	}

	// 🆕 get only users in the current course
	const allUsers = await getTopTwentyUsersByCourse(userProgress.activeCourse.id)

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<HebrewLeaderboard users={allUsers} />
			</FeedWrapper>
		</div>
	)
}
