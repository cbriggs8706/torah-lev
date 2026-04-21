import * as React from 'react'
import { type LucideIcon } from 'lucide-react'

import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar'

export function NavSecondary({
	items,
	...props
}: {
	items: {
		title: string
		url: string
		icon: LucideIcon
	}[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
	return (
		<SidebarGroup className="px-3 py-2" {...props}>
			<SidebarGroupLabel className="px-3 pb-1 font-[family:var(--font-alegreya-sc)] text-[0.7rem] tracking-[0.22em] text-sidebar-foreground/55 uppercase">
				Guidance
			</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					{items.map((item) => (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton
								asChild
								size="sm"
								className="h-10 rounded-2xl px-3 text-sidebar-foreground/78 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
							>
								<a href={item.url}>
									<item.icon className="size-4" />
									<span className="text-sm font-medium">{item.title}</span>
								</a>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	)
}
