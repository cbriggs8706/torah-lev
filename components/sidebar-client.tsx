'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Loader } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { SidebarItem } from './sidebar-item'
import { UserProgress } from './user-progress'
import { HebrewClock } from './hebrew/hebrew-clock'
import { Button } from '@/components/ui/button'
import { signOut, useSession } from '@/components/providers/session-provider'
import { USER_PROGRESS_UPDATED_EVENT } from '@/lib/user-progress-events'

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
	const activeCourseId = userProgress?.activeCourseId ?? null
	const [displayProgress, setDisplayProgress] = useState(userProgress)

	useEffect(() => {
		setDisplayProgress(userProgress)
	}, [userProgress])

	useEffect(() => {
		function handleUserProgressUpdated(event: Event) {
			const customEvent = event as CustomEvent<{
				hearts?: number
				points?: number
			}>

			setDisplayProgress((current) => {
				if (!current) return current

				return {
					...current,
					hearts:
						typeof customEvent.detail?.hearts === 'number'
							? customEvent.detail.hearts
							: current.hearts,
					points:
						typeof customEvent.detail?.points === 'number'
							? customEvent.detail.points
							: current.points,
				}
			})
		}

		window.addEventListener(
			USER_PROGRESS_UPDATED_EVENT,
			handleUserProgressUpdated,
		)

		return () => {
			window.removeEventListener(
				USER_PROGRESS_UPDATED_EVENT,
				handleUserProgressUpdated,
			)
		}
	}, [])
	if (!activeCourseId) {
		return (
			<div
				className={cn(
					'flex h-full lg:w-[256px] lg:fixed left-0 top-0 px-4 border-r-2 flex-col items-center justify-center text-center text-neutral-600',
					className,
				)}
			>
				<Link href="/curriculum" onClick={onItemClick}>
					<div className="pt-8 pb-7 flex flex-col items-center gap-3">
						<Image
							src="/icons/iconBoy.png"
							height={60}
							width={60}
							alt="Mascot"
						/>
						<h1 className="text-2xl font-extrabold text-sidebar-primary tracking-wide">
							Torah Lev
						</h1>
					</div>
				</Link>

				<p className="text-lg font-semibold text-neutral-600 px-6">
					Please choose a course to begin.
				</p>

				<Link href="/curriculum" onClick={onItemClick}>
					<button className="mt-6 px-4 py-2 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700">
						View Curriculum
					</button>
				</Link>
			</div>
		)
	} else {
		return (
			<div
				className={cn(
					'flex h-full lg:w-[256px] lg:fixed left-0 top-0 px-4 border-r-2 flex-col',
					className,
				)}
			>
				<Link href="/curriculum" onClick={onItemClick}>
					<div className="pt-8 pl-4 pb-7 flex items-center gap-x-3">
						<Image
							src="/icons/iconBoy.png"
							height={40}
							width={40}
							alt="Mascot"
						/>
						{/* <Image src="/mascot.svg" height={40} width={40} alt="Mascot" /> */}
						<h1 className="text-2xl font-extrabold text-sidebar-primary tracking-wide">
							Torah Lev
						</h1>
					</div>
				</Link>

				{displayProgress && (
					<UserProgress
						activeCourse={displayProgress.activeCourse}
						hearts={displayProgress.hearts}
						points={displayProgress.points}
						hasActiveSubscription={isPro}
						isGuest={displayProgress.userId === 'guest'}
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
								label="חידון"
								href="/he/quiz"
								iconSrc="/gameIcons/quiz.png"
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
								label="תנועות"
								href="/he/vowels"
								iconSrc="/gameIcons/groupSort.png"
								onClick={onItemClick}
								className="font-cardo text-xl"
							/>
							<SidebarItem
								label="הברות"
								href="/he/syllables"
								iconSrc="/gameIcons/groupSort.png"
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
								label="סרטונים"
								href="/he/videos"
								iconSrc="/icons/iconYoutube.png"
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
								iconSrc="/icons/iconBrain.png"
								// iconSrc="/mascot.svg"
								onClick={onItemClick}
								className="font-cardo text-xl"
							/>
							<SidebarItem
								label="ספרי תנ״ך"
								href="/he/tanakh-books"
								iconSrc="/books-svgrepo-com.svg"
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
							<SidebarItem
								label="כתבי הקודש"
								href="/he/scripture"
								iconSrc="/icons/iconScroll.png"
								onClick={onItemClick}
								className="font-cardo text-xl"
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
								label="Quiz"
								href="/el/quiz"
								iconSrc="/gameIcons/quiz.png"
								onClick={onItemClick}
							/>
							<SidebarItem
								label="Flashcards"
								href="/el/flashcards"
								iconSrc="/card-file-box.svg"
								onClick={onItemClick}
							/>
							<SidebarItem
								label="Videos"
								href="/el/videos"
								iconSrc="/youtube.svg"
								onClick={onItemClick}
							/>
						</>
					)}
					{userProgress?.activeCourse.id === 19 && (
						<>
							<SidebarItem
								label="Dashboard"
								href="/he/dashboard"
								// iconSrc="/icons/iconName.png"
								iconSrc="/mascot.svg"
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
								label="פעלים"
								href="/he/verbs"
								iconSrc="/icons/iconRunning.png"
								// iconSrc="/a-button-blood-type-svgrepo-com.svg"
								onClick={onItemClick}
								className="font-cardo text-xl"
							/>
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
					{/* <SidebarItem
					label="Dev Roadmap"
					href="/dev-roadmap"
					iconSrc="/world-map-svgrepo-com.svg"
					onClick={onItemClick}
				/> */}
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
										window.location.assign(
											'/auth/signin?callbackUrl=/curriculum',
										)
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
}
