import Image from 'next/image'
import { getSession } from '@/lib/auth'
import { FeedWrapper } from '@/components/feed-wrapper'
import { DismissibleAlert } from '@/components/dismissible-alert'
import { getUserProgress, getUserSubscription } from '@/db/queries'
import efwJeopardy from '@/lib/data/vocab/efwJeopardy.json'
import JeopardyBoard from '@/components/english/english-jeopardy'

const EnglishJeopardyPage = async () => {
	// Session may be null for guests
	const session = await getSession()

	const [userProgress, userSubscription] = await Promise.all([
		getUserProgress(),
		getUserSubscription(),
	])

	const isPro = !!userSubscription?.isActive

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/video-game-svgrepo-com.svg"
						alt="Jeopardy Game"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						Jeopardy
					</h1>

					{/* <DismissibleAlert storageKey="jeopardy" className="mb-4">
						Choose a question by category and point value. Click to reveal the
						answer and test your English knowledge!
					</DismissibleAlert> */}

					<JeopardyBoard data={efwJeopardy} />
				</div>
			</FeedWrapper>
		</div>
	)
}

export default EnglishJeopardyPage
