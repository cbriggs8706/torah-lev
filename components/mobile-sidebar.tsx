'use client'
import { Menu } from 'lucide-react'

import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Sidebar } from '@/components/sidebar'
import { useState } from 'react'

export const MobileSidebar = () => {
	const [open, setOpen] = useState(false)

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger>
				<Menu className="text-white" />
			</SheetTrigger>
			<SheetContent className="p-0 z-[100]" side="left">
				<Sidebar onItemClick={() => setOpen(false)} />
			</SheetContent>
		</Sheet>
	)
}
