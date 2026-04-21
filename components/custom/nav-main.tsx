'use client'

import { ChevronRight, type LucideIcon } from 'lucide-react'
import { usePathname } from 'next/navigation'

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from '@/components/ui/sidebar'

export function NavMain({
	items,
	label,
}: {
	label?: string
	items: {
		title: string
		url: string
		icon: LucideIcon
		isActive?: boolean
		items?: {
			title: string
			url: string
		}[]
	}[]
}) {
	const pathname = usePathname()

	return (
		<SidebarGroup className="px-3 py-2">
			{label ? (
				<SidebarGroupLabel className="px-3 pb-1 font-[family:var(--font-alegreya-sc)] text-[0.7rem] tracking-[0.22em] text-sidebar-foreground/55 uppercase">
					{label}
				</SidebarGroupLabel>
			) : null}
			<SidebarMenu>
				{items.map((item) => {
					const isActive =
						pathname === item.url ||
						item.items?.some((subItem) => pathname === subItem.url) ||
						false

					return (
						<Collapsible key={item.title} asChild defaultOpen={isActive || item.isActive}>
							<SidebarMenuItem>
								<SidebarMenuButton
									asChild
									tooltip={item.title}
									isActive={isActive}
									className="h-12 rounded-2xl px-3 text-sidebar-foreground/90 data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground data-[active=true]:shadow-[0_10px_26px_rgba(90,30,42,0.18)]"
								>
								<a href={item.url}>
									<div className="flex size-8 items-center justify-center rounded-xl bg-sidebar-accent/80 text-sidebar-primary transition-colors group-data-[collapsible=icon]:bg-transparent data-[active=true]:bg-white/15 data-[active=true]:text-current">
										<item.icon className="size-4" />
									</div>
									<span className="text-[0.98rem] font-semibold tracking-[-0.01em]">
										{item.title}
									</span>
								</a>
								</SidebarMenuButton>
								{item.items?.length ? (
									<>
										<CollapsibleTrigger asChild>
											<SidebarMenuAction className="right-3 top-3 text-sidebar-foreground/55 data-[state=open]:rotate-90 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground">
												<ChevronRight className="size-4" />
												<span className="sr-only">Toggle</span>
											</SidebarMenuAction>
										</CollapsibleTrigger>
										<CollapsibleContent>
											<SidebarMenuSub className="mt-2 ml-6 border-l border-sidebar-border/70">
												{item.items?.map((subItem) => (
													<SidebarMenuSubItem key={subItem.title}>
														<SidebarMenuSubButton
															asChild
															isActive={pathname === subItem.url}
															className="rounded-xl px-3 py-2 text-sm text-sidebar-foreground/72 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:font-semibold data-[active=true]:text-sidebar-foreground"
														>
															<a href={subItem.url}>{subItem.title}</a>
														</SidebarMenuSubButton>
													</SidebarMenuSubItem>
												))}
											</SidebarMenuSub>
										</CollapsibleContent>
									</>
								) : null}
							</SidebarMenuItem>
						</Collapsible>
					)
				})}
			</SidebarMenu>
		</SidebarGroup>
	)
}
