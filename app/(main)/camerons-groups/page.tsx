import Image from 'next/image'
import { redirect } from 'next/navigation'

import { FeedWrapper } from '@/components/feed-wrapper'
import { UserProgress } from '@/components/user-progress'
import { StickyWrapper } from '@/components/sticky-wrapper'
import { getUserProgress, getUserSubscription } from '@/db/queries'
import Link from 'next/link'
import sessions from '@/lib/data/sessions/sessions.json'

const CameronsGroupsPage = async () => {
	const userProgressData = getUserProgress()
	const userSubscriptionData = getUserSubscription()

	const [userProgress, userSubscription] = await Promise.all([
		userProgressData,
		userSubscriptionData,
	])

	if (!userProgress || !userProgress.activeCourse) {
		redirect('/courses')
	}

	const isPro = !!userSubscription?.isActive

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<StickyWrapper>
				<UserProgress
					activeCourse={userProgress.activeCourse}
					hearts={userProgress.hearts}
					points={userProgress.points}
					hasActiveSubscription={isPro}
				/>
				{/* {!isPro && (
          <Promo />
        )} */}
			</StickyWrapper>
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/boy.svg"
						alt="Cameron's Study Groups"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						Cameron&apos;s Study Groups
					</h1>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
						{sessions.map(({ date, sessions }) => (
							<div
								key={date}
								className="w-full bg-white rounded-md shadow-lg p-4 border border-solid border-sky-500"
							>
								<h2 className="text-2xl font-bold mt-4 mb-2">{date}</h2>
								<ul className="mb-8 space-y-1">
									{sessions.map((session, i) => (
										<li key={i} className="flex items-center flex-wrap">
											<span className="inline-flex items-center">
												{session.time}
												{(session.time.includes('12:30') ||
													session.time.includes('7pm')) && (
													<Link
														href="https://us02web.zoom.us/j/3174376398?pwd=cndPWmt0ZkRYeXdrVm5adnlZaElZQT09&authuser=0"
														className="inline-block ml-1"
														title="Join Zoom"
													>
														<Image
															src="/zoom.svg"
															alt="Zoom link"
															width={15}
															height={15}
														/>
													</Link>
												)}
											</span>
											<span className="ml-2">
												– {session.title}
												{session.recording && (
													<Link
														href={session.recording}
														className="inline-block ml-1"
														title="Session Recording"
													>
														<Image
															src="/youtube.svg"
															alt="Session Recording"
															width={20}
															height={20}
														/>
													</Link>
												)}
											</span>
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
				</div>
			</FeedWrapper>
		</div>
	)
}

export default CameronsGroupsPage
