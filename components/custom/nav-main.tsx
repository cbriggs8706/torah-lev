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
				<SidebarGroupLabel className="px-3 pb-2 font-[family:var(--font-alegreya-sc)] text-[0.78rem] tracking-[0.24em] text-sidebar-foreground/55 uppercase">
					{label}
				</SidebarGroupLabel>
			) : null}
			<SidebarMenu className="space-y-1.5">
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
									className="h-14 rounded-[1.35rem] px-3.5 text-sidebar-foreground/92 hover:bg-[color:color-mix(in_srgb,var(--sidebar-accent)_72%,white_28%)] data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground data-[active=true]:shadow-[0_14px_30px_rgba(90,30,42,0.2)]"
								>
								<a href={item.url}>
									<div className="flex size-10 items-center justify-center rounded-[1rem] bg-[color:color-mix(in_srgb,var(--sidebar-accent)_74%,white_26%)] text-sidebar-primary transition-colors group-data-[collapsible=icon]:bg-transparent data-[active=true]:bg-white/15 data-[active=true]:text-current">
										<item.icon className="size-[1.05rem]" />
									</div>
									<span className="text-[1.08rem] font-semibold tracking-[-0.02em]">
										{item.title}
									</span>
								</a>
								</SidebarMenuButton>
								{item.items?.length ? (
									<>
										<CollapsibleTrigger asChild>
											<SidebarMenuAction className="right-3 top-3.5 text-sidebar-foreground/55 data-[state=open]:rotate-90 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground">
												<ChevronRight className="size-[1.05rem]" />
												<span className="sr-only">Toggle</span>
											</SidebarMenuAction>
										</CollapsibleTrigger>
										<CollapsibleContent>
											<SidebarMenuSub className="mt-2.5 ml-7 border-l border-[color:color-mix(in_srgb,var(--chart-2)_38%,var(--sidebar-border))] pl-1">
												{item.items?.map((subItem) => (
													<SidebarMenuSubItem key={subItem.title}>
														<SidebarMenuSubButton
															asChild
															isActive={pathname === subItem.url}
															className="rounded-[1rem] px-3 py-2.5 text-[0.98rem] text-sidebar-foreground/74 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:font-semibold data-[active=true]:text-sidebar-foreground"
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
