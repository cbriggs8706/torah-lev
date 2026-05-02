import Link from 'next/link'
import { SidebarTrigger } from '@/components/ui/sidebar'

export default async function MobileHeader() {
	return (
		<nav className="sticky top-0 z-40 flex h-[56px] items-center justify-between border-b border-sidebar-border bg-sidebar px-4 lg:hidden">
			<SidebarTrigger className="text-sidebar-foreground hover:bg-sidebar-accent" />
			<Link href="/courses" className="text-lg font-extrabold tracking-tight text-sidebar-primary">
				Idiom Go
			</Link>
			<div className="w-10" />
		</nav>
	)
}
