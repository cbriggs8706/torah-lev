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
			<SidebarGroupLabel className="px-3 pb-2 font-[family:var(--font-alegreya-sc)] text-[0.78rem] tracking-[0.24em] text-sidebar-foreground/55 uppercase">
				{label}
			</SidebarGroupLabel>
			<SidebarMenu className="space-y-1">
				{input.map((item) => (
					<SidebarMenuItem key={item.name}>
						<SidebarMenuButton
							asChild
							className="h-11 rounded-[1.2rem] px-3.5 text-sidebar-foreground/78 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
						>
							<a href={item.url}>
								<item.icon className="size-[1.05rem]" />
								<span className="text-[0.98rem] font-medium tracking-[-0.01em]">{item.name}</span>
							</a>
						</SidebarMenuButton>
					</SidebarMenuItem>
				))}
			</SidebarMenu>
		</SidebarGroup>
	)
}
