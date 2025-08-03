import Image from 'next/image'
import { FeedWrapper } from '@/components/feed-wrapper'
import { getUserProgressWithTribe } from '@/db/queries'
import HebrewUserDashboard from '@/components/hebrew/hebrew-dashboard'

const Dashboard = async () => {
	const user = await getUserProgressWithTribe()

	if (!user) {
		return (
			<div className="text-center text-red-500 mt-10">
				You must be logged in to view the dashboard.
			</div>
		)
	}

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
