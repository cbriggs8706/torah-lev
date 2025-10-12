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
import dynamic from 'next/dynamic'

import efwEnglishVocab from '@/lib/data/vocab/efwVocab.json'
import ewbEnglishVocab from '@/lib/data/vocab/ewbVocab.json'
import lrEnglishVocab from '@/lib/data/vocab/lrVocab.json'
import ec1EnglishVocab from '@/lib/data/vocab/ec1Vocab.json'
import ec2EnglishVocab from '@/lib/data/vocab/ec2Vocab.json'
import { DismissibleAlert } from '@/components/dismissible-alert'
import { EnglishVocab } from '@/lib/vocab'

const EnglishScramble = dynamic(
	() => import('@/components/english/english-scramble'),
	{
		ssr: false,
	}
)

const EnglishScramblePage = async () => {
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
						src="/cooking-svgrepo-com.svg"
						alt="Scramble"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						Scramble
					</h1>
					<DismissibleAlert storageKey="scramble" className="mb-4">
						{' '}
						Below is a scrambled up sentence of 2-10 words. Click on them in
						order to unscramble. To take a word out, tap on the corresponding
						green word again to remove.
					</DismissibleAlert>

					<EnglishScramble
						data={englishData}
						currentLesson={'1'}
						userId={userProgress.userId}
						courseId={userProgress.activeCourseId}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}

export default EnglishScramblePage
