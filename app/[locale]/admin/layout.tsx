// app/[locale]/admin/layout.tsx

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'

import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { AppSidebar } from '@/components/custom/app-sidebar'

export default async function Layout({
	children,
}: {
	children: React.ReactNode
}) {
	const session = await getServerSession(authOptions)
	const role = session?.user?.role ?? 'guest'

	if (!['admin', 'teacher'].includes(role)) redirect('/')
	return (
		<SidebarProvider
			style={{ '--sidebar-width': '20rem' } as React.CSSProperties}
			className="tl-shell pl-[--sidebar-width] data-[state=collapsed]:pl-0"
		>
			<AppSidebar session={session} role={session?.user?.role ?? 'guest'} />

			<SidebarInset className="bg-transparent md:m-3 md:ml-0 md:rounded-[2rem] md:border md:border-border/70 md:bg-card/70 md:shadow-[0_24px_80px_rgba(63,22,31,0.08)] md:backdrop-blur-md md:peer-data-[state=collapsed]:ml-3">
				<header className="flex h-20 shrink-0 items-center gap-2 border-b border-border/60 px-4 md:px-6">
					<div className="flex items-center gap-2">
						<SidebarTrigger className="-ml-1 rounded-full border border-border/70 bg-background/70 text-foreground shadow-none hover:bg-accent/80" />

						<Separator
							orientation="vertical"
							className="mr-2 data-[orientation=vertical]:h-5"
						/>

						{/* Replace with your actual dashboard breadcrumbs */}
						<Breadcrumb>
							<BreadcrumbList>
								<BreadcrumbItem className="hidden md:block">
									<BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
								</BreadcrumbItem>
								<BreadcrumbSeparator className="hidden md:block" />
								<BreadcrumbItem>
									<BreadcrumbPage>Home</BreadcrumbPage>
								</BreadcrumbItem>
							</BreadcrumbList>
						</Breadcrumb>
					</div>
				</header>

				{/* Actual dashboard content */}
				<div className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	)
}
