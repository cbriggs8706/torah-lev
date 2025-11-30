// app/[locale]/(app)/layout.tsx

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { AppSidebar } from '@/components/custom/app-sidebar'
import AppBreadcrumbs from '@/components/navigation/AppBreadcrumbs'

export default async function Layout({
	children,
}: {
	children: React.ReactNode
}) {
	const session = await getServerSession(authOptions)
	// if (!session) redirect(`/`)

	return (
		// <SidebarProvider>
		<SidebarProvider
			style={{ '--sidebar-width': '20rem' } as React.CSSProperties}
			className="
    pl-[--sidebar-width]
    data-[state=collapsed]:pl-0
  "
		>
			{' '}
			<AppSidebar session={session} role={session?.user?.role ?? 'guest'} />
			<SidebarInset>
				<header className="flex h-16 shrink-0 items-center gap-2">
					<div className="flex items-center gap-2 px-4">
						<SidebarTrigger className="-ml-1" />

						<Separator
							orientation="vertical"
							className="mr-2 data-[orientation=vertical]:h-4"
						/>

						<AppBreadcrumbs />
					</div>
				</header>

				{/* Actual dashboard content */}
				<div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	)
}
