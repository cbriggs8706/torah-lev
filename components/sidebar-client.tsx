'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Loader } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SidebarItem } from './sidebar-item'
import { UserProgress } from './user-progress'
import { HebrewClock } from './hebrew/hebrew-clock'
import { Button } from '@/components/ui/button'
import { signOut, useSession } from 'next-auth/react'

type Props = {
	className?: string
	onItemClick?: () => void
	userProgress: {
		userId: string
		userName: string
		userImageSrc: string
		activeCourse: any
		hearts: number
		points: number
		activeCourseId: number | null
	}
	isPro: boolean
	isHebrewFriend?: boolean
	isSpanishFriend?: boolean
	isEnglishFriend?: boolean
	isTester?: boolean
}

export default function SidebarClient({
	className,
	onItemClick,
	userProgress,
	isPro,
	isHebrewFriend,
	isSpanishFriend,
	isEnglishFriend,
	isTester,
}: Props) {
	const { data: session, status } = useSession()
	const isLoading = status === 'loading'
	const isSignedIn = !!session?.user
	return (
		<div
			className={cn(
				'flex h-full lg:w-[256px] lg:fixed left-0 top-0 px-4 border-r-2 flex-col',
				className
			)}
		>
			<Link href="/courses" onClick={onItemClick}>
				<div className="pt-8 pl-4 pb-7 flex items-center gap-x-3">
					<Image src="/icons/iconBoy.png" height={40} width={40} alt="Mascot" />
					{/* <Image src="/mascot.svg" height={40} width={40} alt="Mascot" /> */}
					<h1 className="text-2xl font-extrabold text-sky-600 tracking-wide">
						Idiom Go
					</h1>
				</div>
			</Link>

			{userProgress && (
				<UserProgress
					activeCourse={userProgress.activeCourse}
					hearts={userProgress.hearts}
					points={userProgress.points}
					hasActiveSubscription={isPro}
					onClick={onItemClick}
				/>
			)}
			{[6, 11, 14].includes(userProgress?.activeCourse.id ?? 0) && (
				<HebrewClock onClick={onItemClick} isWidget={true} />
			)}
			<div className="flex flex-col gap-y-2 flex-1 overflow-y-auto">
				{[6, 11, 14].includes(userProgress?.activeCourse.id) && (
					<>
						<SidebarItem
							label="למד"
							href="/he/learn"
							iconSrc="/icons/iconYoutube.png"
							// iconSrc="/youtube.svg"
							onClick={onItemClick}
							className="font-cardo text-xl"
						/>
						<SidebarItem
							label="כרטיסיות"
							href="/he/flashcards"
							iconSrc="/icons/iconFlashcards.png"
							// iconSrc="/card-file-box.svg"
							onClick={onItemClick}
							className="font-cardo text-xl"
						/>
						<SidebarItem
							label="מילון"
							href="/he/dictionary"
							iconSrc="/icons/iconDictionary.png"
							// iconSrc="/open-book-svgrepo-com.svg"
							onClick={onItemClick}
							className="font-cardo text-xl"
						/>
						<SidebarItem
							label="התאמה"
							href="/he/matchup"
							iconSrc="/icons/iconSocks.png"
							// iconSrc="/socks-svgrepo-com.svg"
							onClick={onItemClick}
							className="font-cardo text-xl"
						/>
						<SidebarItem
							label="חידון אותיות"
							href="/he/letter-quiz"
							iconSrc="/icons/iconLetter.png"
							// iconSrc="/a-button-blood-type-svgrepo-com.svg"
							onClick={onItemClick}
							className="font-cardo text-xl"
						/>
						<SidebarItem
							label="פעלים"
							href="/he/verbs"
							iconSrc="/icons/iconRunning.png"
							// iconSrc="/a-button-blood-type-svgrepo-com.svg"
							onClick={onItemClick}
							className="font-cardo text-xl"
						/>
						<SidebarItem
							label="חידון מספרים"
							href="/he/number-quiz"
							iconSrc="/icons/iconNumber.png"
							// iconSrc="/input-numbers-svgrepo-com.svg"
							onClick={onItemClick}
							className="font-cardo text-xl"
						/>
						<SidebarItem
							label="תסריטי שיעור"
							href="/he/lesson-scripts"
							iconSrc="/icons/iconNotebook.png"
							// iconSrc="/spiral-notepad-svgrepo-com.svg"
							onClick={onItemClick}
							className="font-cardo text-xl"
						/>
						<SidebarItem
							label="איות"
							href="/he/spelling"
							iconSrc="/icons/iconSpelling.png"
							// iconSrc="/input-latin-letters-svgrepo-com.svg"
							onClick={onItemClick}
							className="font-cardo text-xl"
						/>
						<SidebarItem
							label="שירים"
							href="/he/music"
							iconSrc="/icons/iconMusic.png"
							// iconSrc="/musical-note-svgrepo-com.svg"
							onClick={onItemClick}
							className="font-cardo text-xl"
						/>
						<SidebarItem
							label="טבלת מובילים"
							href="/he/leaderboard"
							iconSrc="/icons/iconTrophy.png"
							// iconSrc="/trophy-svgrepo-com.svg"
							onClick={onItemClick}
							className="font-cardo text-xl"
						/>
						<SidebarItem
							label="לוח הבקרה"
							href="/he/dashboard"
							iconSrc="/icons/iconName.png"
							// iconSrc="/mascot.svg"
							onClick={onItemClick}
							className="font-cardo text-xl"
						/>
						<SidebarItem
							label="זכר"
							href="/he/memorize"
							iconSrc="/brain-svgrepo-com.svg"
							// iconSrc="/mascot.svg"
							onClick={onItemClick}
							className="font-cardo text-xl"
						/>
					</>
				)}

				{[6, 11].includes(userProgress?.activeCourse.id) && (
					<>
						<SidebarItem
							label="סיפורים"
							href="/he/stories"
							iconSrc="/icons/iconStories.png"
							// iconSrc="/books-svgrepo-com.svg"
							onClick={onItemClick}
							className="font-cardo text-xl"
						/>
					</>
				)}

				{/* English */}
				{[3, 4, 13, 16, 17].includes(userProgress?.activeCourse.id) && (
					<>
						<SidebarItem
							label="Learn"
							href="/en/learn"
							iconSrc="/youtube.svg"
							onClick={onItemClick}
						/>
						<SidebarItem
							label="Flashcards"
							href="/en/flashcards"
							iconSrc="/card-file-box.svg"
							onClick={onItemClick}
						/>
						<SidebarItem
							label="Matchup"
							href="/en/matchup"
							iconSrc="/socks-svgrepo-com.svg"
							onClick={onItemClick}
						/>
						<SidebarItem
							label="Scramble"
							href="/en/scramble"
							iconSrc="/cooking-svgrepo-com.svg"
							onClick={onItemClick}
						/>
						<SidebarItem
							label="Dictionary"
							href="/en/dictionary"
							iconSrc="/open-book-svgrepo-com.svg"
							onClick={onItemClick}
						/>
						<SidebarItem
							label="Number Quiz"
							href="/en/number-quiz"
							iconSrc="/input-numbers-svgrepo-com.svg"
							onClick={onItemClick}
						/>
						<SidebarItem
							label="Letter Quiz"
							href="/en/letter-quiz"
							iconSrc="/a-button-blood-type-svgrepo-com.svg"
							onClick={onItemClick}
						/>
						<SidebarItem
							label="Spelling"
							href="/en/spelling"
							iconSrc="/input-latin-letters-svgrepo-com.svg"
							onClick={onItemClick}
						/>
						<SidebarItem
							label="Leaderboard"
							href="/en/leaderboard"
							iconSrc="/trophy-svgrepo-com.svg"
							onClick={onItemClick}
						/>
					</>
				)}
				{[3, 4, 16].includes(userProgress?.activeCourse.id) && (
					<>
						<SidebarItem
							label="Slides"
							href="/en/slides"
							iconSrc="/framed-picture-svgrepo-com.svg"
							onClick={onItemClick}
						/>
					</>
				)}
				{[13, 17].includes(userProgress?.activeCourse.id) && (
					<>
						<SidebarItem
							label="Lesson Scripts"
							href="/en/lesson-scripts"
							iconSrc="/spiral-notepad-svgrepo-com.svg"
							onClick={onItemClick}
						/>
					</>
				)}
				{userProgress?.activeCourse.id === 17 && (
					<>
						<SidebarItem
							label="Stories"
							href="/en/stories"
							iconSrc="/books-svgrepo-com.svg"
							onClick={onItemClick}
						/>
					</>
				)}
				{/* Greek */}
				{userProgress?.activeCourse.id === 12 && (
					<>
						<SidebarItem
							label="Learn"
							href="/el/learn"
							iconSrc="/youtube.svg"
							onClick={onItemClick}
						/>
						<SidebarItem
							label="Flashcards"
							href="/el/flashcards"
							iconSrc="/card-file-box.svg"
							onClick={onItemClick}
						/>
						<SidebarItem
							label="Lesson Scripts"
							href="/el/lesson-scripts"
							iconSrc="/spiral-notepad-svgrepo-com.svg"
							onClick={onItemClick}
						/>
					</>
				)}
				{userProgress?.activeCourse.id === 19 && (
					<>
						<SidebarItem
							label="Memorize"
							href="/en/memorize"
							iconSrc="/brain-svgrepo-com.svg"
							onClick={onItemClick}
						/>
					</>
				)}
				{/* Hebrew */}
				{userProgress?.activeCourse.id === 6 && (
					<>
						{/* <SidebarItem
							label="Flashcards"
							href="/flashcard"
							iconSrc="/card-file-box.svg"
							onClick={onItemClick}
						/> */}

						{/* <SidebarItem
							label="Grammar Lessons"
							href="/he/grammar-lessons"
							iconSrc="/bookmark-tabs-svgrepo-com (1).svg"
							onClick={onItemClick}
						/> */}

						<SidebarItem
							label="חידון מהיר"
							href="/he/speed-quiz"
							// iconSrc="/icons/iconRunning.png"
							iconSrc="/man-juggling-medium-skin-tone-svgrepo-com.svg"
							onClick={onItemClick}
							className="font-cardo text-xl"
						/>
						<SidebarItem
							label="ערבוב"
							href="/he/scramble"
							iconSrc="/icons/iconScrambled.png"
							// iconSrc="/cooking-svgrepo-com.svg"
							onClick={onItemClick}
							className="font-cardo text-xl"
						/>
						<SidebarItem
							label="משפטים"
							href="/he/sentence-builder"
							iconSrc="/icons/iconBuilding.png"
							// iconSrc="/building-construction-svgrepo-com.svg"
							onClick={onItemClick}
							className="font-cardo text-xl"
						/>
						{/* <span className="text-lg text-red-700 font-semibold text-center">
							-- Coming Soon --
						</span>
						<SidebarItem
							label="Sorting"
							href="#"
							iconSrc="/person-juggling-light-skin-tone-svgrepo-com.svg"
							// onClick={onItemClick}
						/>

						<SidebarItem
							label="Memorize"
							href="#"
							iconSrc="/brain-svgrepo-com.svg"
							// onClick={onItemClick}
						/>
						<SidebarItem
							label="Numbers"
							href="#"
							iconSrc="/input-numbers-svgrepo-com.svg"
							// onClick={onItemClick}
						/>
						<SidebarItem
							label="Speak"
							href="#"
							iconSrc="/speaking-head-svgrepo-com.svg"
							// onClick={onItemClick}
						/>
						<SidebarItem
							label="Conversation"
							href="#"
							iconSrc="/speech-balloon-svgrepo-com.svg"
							// onClick={onItemClick}
						/>
						<SidebarItem
							label="Go"
							href="#"
							iconSrc="/vertical-traffic-light-svgrepo-com.svg"
							// onClick={onItemClick}
						/>
						<SidebarItem
							label="MadGab"
							href="#"
							iconSrc="/winking-face-with-tongue-svgrepo-com.svg"
							// onClick={onItemClick}
						/>
						<SidebarItem
							label="Holy Days"
							href="#"
							iconSrc="/menorah-svgrepo-com.svg"
							// onClick={onItemClick}
						/> */}

						{userProgress?.activeCourse.id === 6 && isHebrewFriend && (
							<>
								<span className="text-lg text-red-700 font-semibold text-center">
									-- Locals --
								</span>
								{/* <SidebarItem
									label="לוח זמנים"
									href="/camerons-groups"
									iconSrc="/icons/iconCalendar.png"
									// iconSrc="/tear-off-calendar-svgrepo-com.svg"
									onClick={onItemClick}
									className="font-cardo text-xl"
								/> */}

								<SidebarItem
									label="תפילות"
									href="/he/prayer"
									iconSrc="/icons/iconPraying.png"
									// iconSrc="/folded-hands-medium-dark-skin-tone-svgrepo-com.svg"
									onClick={onItemClick}
									className="font-cardo text-xl"
								/>
							</>
						)}
					</>
				)}
				<SidebarItem
					label="Dev Roadmap"
					href="/dev-roadmap"
					iconSrc="/world-map-svgrepo-com.svg"
					onClick={onItemClick}
				/>
			</div>
			<div className="p-4">
				{isLoading && (
					<Loader className="h-5 w-5 text-muted-foreground animate-spin" />
				)}

				{!isLoading && (
					<div className="flex flex-row gap-4 items-center">
						{isSignedIn ? (
							<>
								{session.user?.image && (
									<Image
										src={session.user.image}
										alt={session.user.name || 'User'}
										width={40}
										height={40}
										className="rounded-full border"
									/>
								)}
								<Button
									variant="ghost"
									size="sm"
									onClick={() => signOut({ callbackUrl: '/' })}
								>
									Log out
								</Button>
							</>
						) : (
							<Button
								variant="ghost"
								size="sm"
								onClick={() =>
									window.location.assign('/auth/signin?callbackUrl=/courses')
								}
							>
								Log in
							</Button>
						)}
					</div>
				)}
			</div>
		</div>
	)
}
