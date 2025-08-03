import Image from 'next/image'
import { FeedWrapper } from '@/components/feed-wrapper'
import { getUserProgressWithTribe } from '@/db/queries'
import HebrewUserDashboard from '@/components/hebrew/hebrew-dashboard'
import db from '@/db/drizzle'
import { eq } from 'drizzle-orm'
import { challengeProgress, units } from '@/db/schema'

const Dashboard = async () => {
	const user = await getUserProgressWithTribe()

	if (!user) {
		return (
			<div className="text-center text-red-500 mt-10">
				You must be logged in to view the dashboard.
			</div>
		)
	}

	const courseId = user.activeCourse?.id ?? 6

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
								where: eq(challengeProgress.userId, user.userId),
							},
						},
					},
				},
			},
		},
	})

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image src="/mascot.svg" alt="Dashboard" height={90} width={90} />
					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						Dashboard
					</h1>

					<HebrewUserDashboard
						userName={user.userName}
						userImageSrc={user.userImageSrc}
						points={user.points}
						hearts={user.hearts}
						userUnitProgress={userUnitProgress}
						activeCourse={{
							id: user.activeCourse?.id ?? 0,
							title: user.activeCourse?.title ?? 'Default Course',
							imageSrc: user.activeCourse?.imageSrc ?? '/default-course.png',
						}}
						currentLesson={user.currentLesson}
						tribe={
							user.tribeId
								? {
										engName: user.tribeEngName ?? '',
										hebName: user.tribeHebName ?? '',
										points: user.tribePoints ?? 0,
										tribeImage: user.tribeImage ?? '',
								  }
								: null
						}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}

export default Dashboard
