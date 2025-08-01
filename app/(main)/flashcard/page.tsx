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

import awbHebrewVocab from '@/lib/data/vocab/awbVocab.json'
import hebrewScoutsVocab from '@/lib/data/vocab/hebrewScoutsVocab.json'
// import awaGreekVocab from '@/lib/data/vocab/greek-vocab.json'

import { DismissibleAlert } from '@/components/dismissible-alert'
import { PanoramaSharp } from '@mui/icons-material'

const Flashcards = dynamic(() => import('@/components/hebrew-flashcards'), {
	ssr: false,
})

export default async function FlashcardPage({
	params,
}: {
	params: { lang: string }
}) {
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

	const isPro = !!userSubscription?.isActive
	const currentLesson = userChallengeData?.activeLesson?.lessonNumber

	const isHebrew = params.lang || 'hebrew'

	const data =
		userProgress.activeCourseId === 6
			? awbHebrewVocab
			: userProgress.activeCourseId === 11
			? hebrewScoutsVocab
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
						src="/card-file-box.svg"
						alt="Calendar"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						Flashcards
					</h1>
					<DismissibleAlert storageKey="flashcard" className="mb-4">
						These will default to your current lesson in the Learn section. You
						can customize the cards to your hearts desire. There are 7 spots on
						front and back where you can place whatever you would like.
					</DismissibleAlert>
					<Flashcards
						data={data}
						allFields={[
							'hebNiqqud',
							'heb',
							'eng',
							'genderPerson',
							'partOfSpeech',
							'ipa',
							'engTransliteration',
							'images',
							'hebAudio',
						]}
						currentLesson={currentLesson ?? ''}
						layout={isHebrew}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}
