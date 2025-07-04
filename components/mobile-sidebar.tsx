// MobileSidebar.tsx
'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import SidebarClient from './sidebar-client'

type Props = {
	userProgress: {
		activeCourse: any
		hearts: number
		points: number
	}
	isPro: boolean
}

export const MobileSidebar = ({ userProgress, isPro }: Props) => {
	const [open, setOpen] = useState(false)

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
				/>
			</SheetContent>
		</Sheet>
	)
}
