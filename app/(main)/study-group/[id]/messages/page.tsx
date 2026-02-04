import Image from 'next/image'
import { redirect } from 'next/navigation'

import { FeedWrapper } from '@/components/feed-wrapper'
import {
	getUserProgress,
	getUserSubscription,
	getStudyGroupWithMessages,
} from '@/db/queries'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import StudyGroupMessages from '@/components/study-group/messages'

export default async function MessageboardPage({ params }: any) {
	const { id } = await params
	const [userProgress, userSubscription] = await Promise.all([
		getUserProgress(),
		getUserSubscription(),
	])
	if (!userProgress) {
		return (
			<div className="text-center text-red-500 mt-10">
				You must be logged in to view the dashboard.
			</div>
		)
	}

	// 🧠 If user is not logged in, redirect or show nothing
	if (!userProgress) {
		// Option 1: redirect to login
		redirect('/login')

		// Option 2 (if you prefer not to redirect):
		// return <p className="text-center mt-10 text-gray-500">Please sign in to view this page.</p>
	}

	// ✅ Safe to use userProgress now
	const studyGroupId = Number(id)
	const studyGroup = await getStudyGroupWithMessages(studyGroupId)
	console.log('DEBUG: studyGroupId', studyGroupId)
	console.log('DEBUG: studyGroup', studyGroup)

	if (!studyGroup) {
		return (
			<p className="text-center mt-10 text-gray-500">
				This study group could not be found.
			</p>
		)
	}

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/left-speech-bubble-svgrepo-com.svg"
						alt="Messageboard"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						{studyGroup.name} Messageboard
					</h1>
					<Link href={`/study-group/${studyGroup.id}`}>
						<Button size="sm" className="mb-4">
							Back to Dashboard
						</Button>
					</Link>
					<StudyGroupMessages
						currentUserId={userProgress.userId}
						instructor={{
							id: studyGroup.teacher.userId,
							name: studyGroup.teacher.userName,
							avatar: studyGroup.teacher.userImageSrc,
							isInstructor: true,
						}}
						members={studyGroup.members.map((m) => ({
							id: m.user.userId,
							name: m.user.userName,
							avatar: m.user.userImageSrc,
						}))}
						messages={studyGroup.messages.map((msg) => ({
							id: msg.id,
							senderId: msg.senderId,
							content: msg.content,
							createdAt: msg.createdAt,
						}))}
						studyGroupId={studyGroup.id}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}
