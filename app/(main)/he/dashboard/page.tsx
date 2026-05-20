import Image from 'next/image'
import { FeedWrapper } from '@/components/feed-wrapper'
import {
	getUserProgressWithTribe,
	getAllUserCourseProgress,
	getUserStudyGroups,
	getUserStudyGroupsWithTeaching,
	getTribeMembers,
} from '@/db/queries'
import HebrewUserDashboard from '@/components/hebrew/hebrew-dashboard'
import db from '@/db/drizzle'
import { eq } from 'drizzle-orm'
import { challengeProgress, units, users } from '@/db/schema'

const Dashboard = async () => {
	const [userProgress, allCourseProgress] = await Promise.all([
		getUserProgressWithTribe(),
		getAllUserCourseProgress(),
	])

	// 🧩 Step 2: guard for login
	if (!userProgress) {
		return (
			<div className="text-center text-red-500 mt-10">
				You must be logged in to view the dashboard.
			</div>
		)
	}

	// 🧩 Step 3: fetch study groups once we know the userId
	const userStudyGroups = await getUserStudyGroupsWithTeaching(
		userProgress.userId
	)
	const currentUser = await db.query.users.findFirst({
		where: eq(users.id, userProgress.userId),
		columns: {
			role: true,
		},
	})

	const courseId = userProgress.activeCourse?.id ?? 6

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
								where: eq(challengeProgress.userId, userProgress.userId),
							},
						},
					},
				},
			},
		},
	})

	let tribeMembers: any[] = []
	if (userProgress.tribeId) {
		tribeMembers = await getTribeMembers(userProgress.tribeId)
	}

	console.log('User image:', userProgress.userImageSrc)

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/icons/iconName.png"
						alt="Dashboard"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-cardo text-neutral-800 text-6xl my-6">
						לוּחַ הַבָּקָרָה שֶׁלִּי
					</h1>
					<p className="text-center font-bold text-neutral-800 mb-2">
						My Dashboard
					</p>

					<HebrewUserDashboard
						userName={userProgress.userName}
						hebrewName={userProgress.hebrewName ?? ''}
						userImageSrc={userProgress.userImageSrc || ''}
						hebrewImageSrc={userProgress.hebrewImageSrc || ''}
						points={userProgress.points}
						hearts={userProgress.hearts}
						userUnitProgress={userUnitProgress}
						activeCourse={{
							id: userProgress.activeCourse?.id ?? 0,
							title: userProgress.activeCourse?.title ?? 'Default Course',
							imageSrc:
								userProgress.activeCourse?.imageSrc ?? '/default-course.png',
							proficiencyLevel:
								userProgress.activeCourse?.proficiencyLevel ?? null,
							endingProficiencyLevel:
								userProgress.activeCourse?.endingProficiencyLevel ?? null,
						}}
						tribe={
							userProgress.tribeId
								? {
										engName: userProgress.tribeEngName ?? '',
										hebName: userProgress.tribeHebName ?? '',
										points: userProgress.tribePoints ?? 0,
										tribeImage: userProgress.tribeImage ?? '',
										members: tribeMembers,
								  }
								: null
						}
						studyGroups={userStudyGroups}
						isLeader={currentUser?.role === 'leader'}
						allCourseProgress={allCourseProgress} // ✅ Pass the new array here
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}

export default Dashboard
