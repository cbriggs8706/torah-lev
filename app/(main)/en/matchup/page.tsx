import Image from 'next/image'
import { redirect } from 'next/navigation'

import { FeedWrapper } from '@/components/feed-wrapper'
import { UserProgress } from '@/components/user-progress'
import { StickyWrapper } from '@/components/sticky-wrapper'
import {
	getCourseProgress,
	getUserProgress,
	getUserSubscription,
} from '@/db/queries'
import EnglishMatchup from '@/components/english/english-matchup'

import efwEnglishVocab from '@/lib/data/vocab/efwVocab.json'
import lrEnglishVocab from '@/lib/data/vocab/lrVocab.json'
import ewbEnglishVocab from '@/lib/data/vocab/ewbVocab.json'
import ec1EnglishVocab from '@/lib/data/vocab/ec1Vocab.json'
import ec2EnglishVocab from '@/lib/data/vocab/ec2Vocab.json'
import { DismissibleAlert } from '@/components/dismissible-alert'
import { EnglishVocab } from '@/lib/vocab'

const EnglishMatchupPage = async () => {
	const userProgressData = getUserProgress()
	const userChallengeData = await getCourseProgress()
	const userSubscriptionData = getUserSubscription()

	const [userProgress, userSubscription] = await Promise.all([
		userProgressData,
		userSubscriptionData,
	])

	if (!userProgress || !userProgress.activeCourse) {
		redirect('/courses')
	}
	const title = userChallengeData?.activeLesson?.title ?? ''

	const coursePrefixes: Record<number, string> = {
		16: 'EfW',
		13: 'EwB',
		3: 'EC1',
		4: 'EC2',
		17: 'LR',
	}
	const activeCourseId = userProgress.activeCourseId

	const prefix =
		typeof activeCourseId === 'number'
			? coursePrefixes[activeCourseId] ?? ''
			: ''
	const match = prefix ? title.match(new RegExp(`${prefix} (\\d{1,3})`)) : null
	const currentLesson = match ? parseInt(match[1], 10) : undefined

	const englishData: EnglishVocab[] =
		userProgress.activeCourseId === 16
			? (efwEnglishVocab as EnglishVocab[])
			: userProgress.activeCourseId === 13
			? (ewbEnglishVocab as EnglishVocab[])
			: userProgress.activeCourseId === 17
			? (lrEnglishVocab as EnglishVocab[])
			: userProgress.activeCourseId === 3
			? (ec1EnglishVocab as EnglishVocab[])
			: userProgress.activeCourseId === 4
			? (ec2EnglishVocab as EnglishVocab[])
			: []

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			{/* <StickyWrapper>
				<UserProgress
					activeCourse={userProgress.activeCourse}
					hearts={userProgress.hearts}
					points={userProgress.points}
					hasActiveSubscription={isPro}
				/>
				{!isPro && <Promo />}
			</StickyWrapper> */}
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/socks-svgrepo-com.svg"
						alt="Matchup"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						Matchup
					</h1>
					<DismissibleAlert storageKey="matchup" className="mb-4">
						{' '}
						It will load up to 12 words from your current lesson by default. You
						can change between text, images and audio in the filters. Known bug:
						drag and drop doesn&apos;t work on android devices.
					</DismissibleAlert>

					<EnglishMatchup
						data={englishData}
						userId={userProgress.userId}
						currentLesson={currentLesson}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}

export default EnglishMatchupPage
