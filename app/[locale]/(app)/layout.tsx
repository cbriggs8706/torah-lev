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
		<SidebarProvider
			style={{ '--sidebar-width': '20rem' } as React.CSSProperties}
			className="tl-shell pl-[--sidebar-width] data-[state=collapsed]:pl-0"
		>
			<AppSidebar session={session} role={session?.user?.role ?? 'guest'} />
			<SidebarInset className="bg-transparent md:m-3 md:ml-0 md:rounded-[2rem] md:border md:border-border/70 md:bg-card/70 md:shadow-[0_24px_80px_rgba(63,22,31,0.08)] md:backdrop-blur-md md:peer-data-[state=collapsed]:ml-3">
				<header className="flex h-20 shrink-0 items-center gap-2 border-b border-border/60 px-4 md:px-6">
					<div className="flex w-full items-center justify-between gap-3">
						<div className="flex items-center gap-2">
							<SidebarTrigger className="-ml-1 rounded-full border border-border/70 bg-background/70 text-foreground shadow-none hover:bg-accent/80" />

							<Separator
								orientation="vertical"
								className="mr-2 data-[orientation=vertical]:h-5"
							/>

							<div className="space-y-1">
								<p className="tl-kicker">TorahLev sanctuary</p>
								<AppBreadcrumbs />
							</div>
						</div>

						<div className="hidden items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-2 text-sm text-muted-foreground md:flex">
							<span className="inline-flex size-2 rounded-full bg-primary" />
							<span>Ancient minimal mode</span>
						</div>
					</div>
				</header>

				<div className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	)
}
