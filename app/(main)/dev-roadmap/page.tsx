import Image from 'next/image'
import { redirect } from 'next/navigation'

import { FeedWrapper } from '@/components/feed-wrapper'
import { UserProgress } from '@/components/user-progress'
import { StickyWrapper } from '@/components/sticky-wrapper'
import {
	getLessonScripts,
	getUserProgress,
	getUserSubscription,
} from '@/db/queries'
import LessonScriptViewer from '@/components/hebrew-lesson-scripts'

const HebrewLessonScriptsPage = async () => {
	const lessons = await getLessonScripts()
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
						src="/world-map-svgrepo-com.svg"
						alt="Dev Roadmap"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						Dev Roadmap
					</h1>
					<div className="text-left">
						<h3 className="font-bold text-2xl">July 2025</h3>
						<ul className="text-muted-foreground text-lg mb-6">
							<li>Make design less Duolingo-y</li>
							<li>
								Dictionary: link to the timestamp and lesson of introduction
							</li>
							<li>
								Dictionary: add all prefixes and suffixes in so that any word
								variation can be found by students unfamiliar with roots
							</li>
							<li>LetterQuiz: add missing fonts</li>
							<li>Data: scrape and add all AwB images/audio from Bibleling</li>
							<li>Matchup: fix drag and drop on android mobile</li>
						</ul>
						<h3 className="font-bold text-2xl">Aug 2025</h3>
						<ul className="text-muted-foreground text-lg mb-6">
							<li>Add conjugation charts and grammar sections</li>
							<li>Flashcards: add anki type spaced repetition</li>
							<li>Scramble: revamp adding in sentence builder etc</li>
							<li>
								Add a story and music library that unlocks by lesson completion
							</li>

							<li>
								Add a Memorizer activity where it can help memorize blocks of
								text from stories, songs, scripture
							</li>
							<li>
								Go through all lesson scripts and make sure they&apos;re
								verbatim and not missing any words
							</li>
						</ul>
						<h3 className="font-bold text-2xl">Sep 2025</h3>
						<ul className="text-muted-foreground text-lg mb-6">
							<li>Add a number bingo to practice hearing</li>
							<li>Mad Lib section of comprehensible input</li>
							<li>
								Add group sort game for things like gender, person, category
							</li>
							<li>Record all missing audio</li>
						</ul>
						<h3 className="font-bold text-2xl">Oct 2025</h3>
						<ul className="text-muted-foreground text-lg mb-6">
							<li>
								Add sitewide tooltip to tap on word and have it bring up the
								definition and other info
							</li>
						</ul>
					</div>
				</div>
			</FeedWrapper>
		</div>
	)
}

export default HebrewLessonScriptsPage
