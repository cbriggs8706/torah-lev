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
			<SidebarGroupLabel className="px-3 pb-2 font-[family:var(--font-alegreya-sc)] text-[0.78rem] tracking-[0.24em] text-sidebar-foreground/55 uppercase">
				Guidance
			</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu className="space-y-1">
					{items.map((item) => (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton
								asChild
								size="sm"
								className="h-11 rounded-[1.2rem] px-3.5 text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
							>
								<a href={item.url}>
									<item.icon className="size-[1.05rem]" />
									<span className="text-[0.98rem] font-medium tracking-[-0.01em]">{item.title}</span>
								</a>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	)
}
