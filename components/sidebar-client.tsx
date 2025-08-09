'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ClerkLoading, ClerkLoaded, UserButton } from '@clerk/nextjs'
import { Loader } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SidebarItem } from './sidebar-item'
import { UserProgress } from './user-progress'
import { hebrewFriendIds } from '@/lib/friends'
import { HebrewClock } from './hebrew/hebrew-clock'

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
	const isFriend =
		userProgress.userId && hebrewFriendIds.includes(userProgress.userId)

	return (
		<div
			className={cn(
				'flex h-full lg:w-[256px] lg:fixed left-0 top-0 px-4 border-r-2 flex-col',
				className
			)}
		>
			<Link href="/learn" onClick={onItemClick}>
				<div className="pt-8 pl-4 pb-7 flex items-center gap-x-3">
					<Image src="/mascot.svg" height={40} width={40} alt="Mascot" />
					<h1 className="text-2xl font-extrabold text-sky-500 tracking-wide">
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
			<HebrewClock onClick={onItemClick} isWidget={true} />
			<div className="flex flex-col gap-y-2 flex-1 overflow-y-auto">
				<SidebarItem
					label="Learn"
					href="/learn"
					iconSrc="/youtube.svg"
					onClick={onItemClick}
				/>
				<SidebarItem
					label="Flashcards"
					href="/flashcard"
					iconSrc="/card-file-box.svg"
					onClick={onItemClick}
				/>
				{userProgress?.activeCourse.id === 6 ||
					(userProgress?.activeCourse.id === 11 && (
						<>
							{/* <SidebarItem
								label="Letter Quiz"
								href="/letter-quiz"
								iconSrc="/a-button-blood-type-svgrepo-com.svg"
								onClick={onItemClick}
							/> */}
						</>
					))}
				{userProgress?.activeCourse.id === 6 && (
					<>
						{/* <SidebarItem
							label="Flashcards"
							href="/flashcard"
							iconSrc="/card-file-box.svg"
							onClick={onItemClick}
						/> */}
						<SidebarItem
							label="Dictionary"
							href="/dictionary"
							iconSrc="/open-book-svgrepo-com.svg"
							onClick={onItemClick}
						/>
						<SidebarItem
							label="Lesson Scripts"
							href="/lesson-scripts"
							iconSrc="/spiral-notepad-svgrepo-com.svg"
							onClick={onItemClick}
						/>
						<SidebarItem
							label="Spelling"
							href="/spelling"
							iconSrc="/input-latin-letters-svgrepo-com.svg"
							onClick={onItemClick}
						/>
						<SidebarItem
							label="Letter Quiz"
							href="/letter-quiz"
							iconSrc="/a-button-blood-type-svgrepo-com.svg"
							onClick={onItemClick}
						/>
						<SidebarItem
							label="Matchup"
							href="/matchup"
							iconSrc="/socks-svgrepo-com.svg"
							onClick={onItemClick}
						/>
						<SidebarItem
							label="Scramble"
							href="/scramble"
							iconSrc="/cooking-svgrepo-com.svg"
							onClick={onItemClick}
						/>
						<SidebarItem
							label="Sentences"
							href="/sentence-builder"
							iconSrc="/building-construction-svgrepo-com.svg"
							onClick={onItemClick}
						/>
						<SidebarItem
							label="Music"
							href="/music"
							iconSrc="/musical-note-svgrepo-com.svg"
							onClick={onItemClick}
						/>
						<SidebarItem
							label="Dev Roadmap"
							href="/dev-roadmap"
							iconSrc="/world-map-svgrepo-com.svg"
							onClick={onItemClick}
						/>

						<SidebarItem
							label="Leaderboard"
							href="/leaderboard"
							iconSrc="/trophy-svgrepo-com.svg"
							onClick={onItemClick}
						/>
						<SidebarItem
							label="My Dashboard"
							href="/dashboard"
							iconSrc="/mascot.svg"
							onClick={onItemClick}
						/>
						<span className="text-lg text-red-700 font-semibold text-center">
							-- Coming Soon --
						</span>
						<SidebarItem
							label="Sorting"
							href="#"
							iconSrc="/person-juggling-light-skin-tone-svgrepo-com.svg"
							// onClick={onItemClick}
						/>
						<SidebarItem
							label="Grammar"
							href="#"
							iconSrc="/bookmark-tabs-svgrepo-com (1).svg"
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
						/>
						{userProgress?.activeCourse.id === 6 && isHebrewFriend && (
							<>
								<span className="text-lg text-red-700 font-semibold text-center">
									-- Locals --
								</span>
								<SidebarItem
									label="Schedule"
									href="/camerons-groups"
									iconSrc="/tear-off-calendar-svgrepo-com.svg"
									onClick={onItemClick}
								/>

								<SidebarItem
									label="Prayers"
									href="/prayer"
									iconSrc="/folded-hands-medium-dark-skin-tone-svgrepo-com.svg"
									onClick={onItemClick}
								/>
							</>
						)}
					</>
				)}
			</div>
			<div className="p-4">
				<ClerkLoading>
					<Loader className="h-5 w-5 text-muted-foreground animate-spin" />
				</ClerkLoading>
				<ClerkLoaded>
					<div className="flex flex-row gap-4">
						<UserButton afterSignOutUrl="/" />
						{/* {isFriend && (
							<Link
								href="/camerons-groups"
								className="mr-3 inline-flex items-center align-middle gap-2 border border-solid border-green-500 rounded-md px-2 py-1"
								title="Cameron's Groups"
								onClick={onItemClick}
							>
								<Image
									src="/boy.svg"
									alt=""
									width={24}
									height={24}
								/>
								<span className="flex text-green-500 font-bold">Schedule</span>
							</Link>
						)} */}
					</div>
				</ClerkLoaded>
			</div>
		</div>
	)
}
