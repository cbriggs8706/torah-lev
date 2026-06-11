import SidebarServer from '@/components/sidebar-server'
import MobileHeader from '@/components/mobile-header'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

type Props = {
	children: React.ReactNode
}

const MainLayout = async ({ children }: Props) => {
	return (
		<SidebarProvider>
			<SidebarServer />
			<SidebarInset className="bg-sidebar">
				<MobileHeader />
				<div className="flex-1">
					<div className="hidden items-center border-b border-sidebar-border bg-white/80 px-4 py-3 backdrop-blur lg:flex">
						<SidebarTrigger className="text-sidebar-foreground hover:bg-sidebar-accent" />
					</div>
					<div className="mx-auto h-full max-w-[1056px] px-2 py-4 sm:px-4 md:px-6">
						{children}
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	)
}

export default MainLayout
