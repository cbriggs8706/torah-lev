'use client'

import Link from 'next/link'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'

export default function MobileHeader() {
	const { side } = useSidebar()

	return (
		<nav
			className={`sticky top-0 z-40 flex h-[56px] items-center justify-between border-b border-sidebar-border bg-sidebar px-4 lg:hidden ${
				side === 'right' ? 'flex-row-reverse' : ''
			}`}
		>
			<SidebarTrigger className="text-sidebar-foreground hover:bg-sidebar-accent" />
			<Link
				href="/curriculum"
				className="text-lg font-extrabold tracking-tight text-sidebar-primary"
			>
				Torah Lev
			</Link>
			<div className="w-10" />
		</nav>
	)
}
