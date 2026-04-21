'use client'

import { type LucideIcon } from 'lucide-react'
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from '@/components/ui/sidebar'

export function NavInput({
	input,
	label,
}: {
	label: string
	input: {
		name: string
		url: string
		icon: LucideIcon
	}[]
}) {
	useSidebar()

	return (
		<SidebarGroup className="px-3 py-2 group-data-[collapsible=icon]:hidden">
			<SidebarGroupLabel className="px-3 pb-1 font-[family:var(--font-alegreya-sc)] text-[0.7rem] tracking-[0.22em] text-sidebar-foreground/55 uppercase">
				{label}
			</SidebarGroupLabel>
			<SidebarMenu>
				{input.map((item) => (
					<SidebarMenuItem key={item.name}>
						<SidebarMenuButton
							asChild
							className="h-10 rounded-2xl px-3 text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
						>
							<a href={item.url}>
								<item.icon className="size-4" />
								<span className="text-sm font-medium">{item.name}</span>
							</a>
						</SidebarMenuButton>
					</SidebarMenuItem>
				))}
			</SidebarMenu>
		</SidebarGroup>
	)
}
