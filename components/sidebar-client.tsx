'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ClerkLoading, ClerkLoaded, UserButton } from '@clerk/nextjs'
import { Loader } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SidebarItem } from './sidebar-item'
import { UserProgress } from './user-progress'
import { HebrewClock } from './hebrew-clock'
import { friendIds } from '@/lib/friends'

type Props = {
	className?: string
	onItemClick?: () => void
	userProgress: {
		userId: string
		activeCourse: any
		hearts: number
		points: number
	}
	isPro: boolean
}

export default function SidebarClient({
	className,
	onItemClick,
	userProgress,
	isPro,
}: Props) {
	const isFriend =
		userProgress.userId && friendIds.includes(userProgress.userId)

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
				{userProgress?.activeCourse.id === 6 && (
					<>
						<SidebarItem
							label="Flashcards"
							href="/hebrew-flashcard"
							iconSrc="/card-file-box.svg"
							onClick={onItemClick}
						/>

						<SidebarItem
							label="Spelling"
							href="/hebrew-spelling"
							iconSrc="/ab-button-blood-type-svgrepo-com.svg"
							onClick={onItemClick}
						/>
						<SidebarItem
							label="Scramble"
							href="/hebrew-scramble"
							iconSrc="/cooking-svgrepo-com.svg"
							onClick={onItemClick}
						/>
						<SidebarItem
							label="Letter Quiz"
							href="/hebrew-letter-quiz"
							iconSrc="/a-button-blood-type-svgrepo-com.svg"
							onClick={onItemClick}
						/>
						<SidebarItem
							label="Sentence Builder"
							href="/hebrew-sentencebuilder"
							iconSrc="/building-construction-svgrepo-com.svg"
							onClick={onItemClick}
						/>
						<SidebarItem
							label="Dictionary"
							href="/hebrew-dictionary"
							iconSrc="/ab-button-blood-type-svgrepo-com.svg"
							onClick={onItemClick}
						/>
						<SidebarItem
							label="Matchup"
							href="/hebrew-matchup"
							iconSrc="/couple-with-heart-man-man-light-skin-tone-svgrepo-com.svg"
							onClick={onItemClick}
						/>
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
						{isFriend && (
							<Link
								href="/camerons-groups"
								className="mr-3 inline-flex items-center align-middle gap-2 border border-solid border-green-500 rounded-md px-2 py-1"
								title="Cameron's Groups"
							>
								<Image
									src="/boy.svg"
									alt="Cameron's Groups"
									width={24}
									height={24}
								/>
								<span className="flex text-green-500 font-bold">Schedule</span>
							</Link>
						)}
					</div>
				</ClerkLoaded>
			</div>
		</div>
	)
}
