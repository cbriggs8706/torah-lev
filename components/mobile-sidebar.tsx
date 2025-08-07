// MobileSidebar.tsx
'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import SidebarClient from './sidebar-client'
// import { headers } from 'next/headers'
// import { redirect } from 'next/navigation'

type Props = {
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

export const MobileSidebar = ({
	userProgress,
	isPro,
	isHebrewFriend,
	isSpanishFriend,
	isEnglishFriend,
	isTester,
}: Props) => {
	const [open, setOpen] = useState(false)
	// const pathname = headers().get('x-pathname') || ''

	// if (
	// 	(!userProgress || !userProgress.activeCourse) &&
	// 	!pathname.startsWith('/courses')
	// ) {
	// 	redirect('/courses')
	// }

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger>
				<Menu className="text-white" />
			</SheetTrigger>
			<SheetContent className="p-0 z-[100]" side="left">
				<SidebarClient
					userProgress={userProgress}
					isPro={isPro}
					onItemClick={() => setOpen(false)}
					isHebrewFriend={isHebrewFriend}
					isSpanishFriend={isSpanishFriend}
					isEnglishFriend={isEnglishFriend}
					isTester={isTester}
				/>
			</SheetContent>
		</Sheet>
	)
}
