import Link from 'next/link'
import Image from 'next/image'
import { ClerkLoading, ClerkLoaded, UserButton } from '@clerk/nextjs'
import { Loader } from 'lucide-react'

import { cn } from '@/lib/utils'

import { SidebarItem } from './sidebar-item'

type Props = {
	className?: string
}

export const Sidebar = ({ className }: Props) => {
	return (
		<div
			className={cn(
				'flex h-full lg:w-[256px] lg:fixed left-0 top-0 px-4 border-r-2 flex-col',
				className
			)}
		>
			<Link href="/learn">
				<div className="pt-8 pl-4 pb-7 flex items-center gap-x-3">
					<Image src="/mascot.svg" height={40} width={40} alt="Mascot" />
					<h1 className="text-2xl font-extrabold text-sky-500 tracking-wide">
						Idiom Go
					</h1>
				</div>
			</Link>
			<div className="flex flex-col gap-y-2 flex-1">
				<SidebarItem label="Learn" href="/learn" iconSrc="/youtube.svg" />
				{/* <SidebarItem
					label="Speak x"
					href="#"
					// href="/speak"
					iconSrc="/speaking-head-in-silhouette.svg"
				/> */}
				{/* <SidebarItem label="Play" href="/play" iconSrc="/video-game.svg" /> */}
				{/* <SidebarItem
					label="Memorize x"
					href="#"
					// href="/memorize"
					iconSrc="/card-file-box.svg"
				/> */}
				{/* <SidebarItem
					label="Read x"
					href="#"
					// href="/read"
					iconSrc="/open-book.svg"
				/> */}
				{/* <SidebarItem
					label="Print x"
					href="#"
					// href="/print"
					iconSrc="/printer.svg"
				/> */}
				{/* <SidebarItem
					label="Calendar"
					href="/calendar"
					iconSrc="/spiral-calendar-pad.svg"
				/> */}
				{/* <SidebarItem
					label="Help"
					href="/help"
					iconSrc="/information-source.svg"
				/> */}
				{/* <SidebarItem
					label="Leaderboard"
					href="/leaderboard"
					iconSrc="/leaderboard.svg"
				/>
				<SidebarItem label="quests" href="/quests" iconSrc="/quests.svg" />
				<SidebarItem label="certs" href="/certificates" iconSrc="/shop.svg" />
				<SidebarItem label="blog" href="/blog" iconSrc="/zombie.svg" />
				<SidebarItem label="podcast" href="/podcast" iconSrc="/man.svg" />
				<SidebarItem label="polls" href="/polls" iconSrc="/woman.svg" /> */}
				{/* <SidebarItem label="donate" href="/donate" iconSrc="/shop.svg" /> */}
			</div>
			<div className="p-4">
				<ClerkLoading>
					<Loader className="h-5 w-5 text-muted-foreground animate-spin" />
				</ClerkLoading>
				<ClerkLoaded>
					<UserButton afterSignOutUrl="/" />
				</ClerkLoaded>
			</div>
		</div>
	)
}
