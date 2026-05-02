'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import type { SidebarNavSection } from '@/types/sidebar'
import { cn } from '@/lib/utils'

const HEBREW_CHARACTER_REGEX = /[\u0590-\u05FF]/

function containsHebrew(text: string) {
	return HEBREW_CHARACTER_REGEX.test(text)
}

export function NavMain({
	section,
	onNavigate,
	isHebrewUi = false,
}: {
	section: SidebarNavSection
	onNavigate?: () => void
	isHebrewUi?: boolean
}) {
	const pathname = usePathname()

	return (
		<SidebarGroup>
			<SidebarGroupLabel
				className={cn(
					isHebrewUi && 'text-sm tracking-[0.12em]',
					containsHebrew(section.label) && 'font-cardo',
				)}
			>
				{section.label}
			</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					{section.items.map((item) => {
						const isActive =
							pathname === item.href ||
							item.children?.some((child) => child.href === pathname) ||
							false

						return (
							<SidebarMenuItem key={item.key}>
								<SidebarMenuButton asChild isActive={isActive}>
									<Link href={item.href} onClick={onNavigate}>
										{item.iconSrc ? (
											<Image
												src={item.iconSrc}
												alt=""
												aria-hidden="true"
												width={22}
												height={22}
												className="h-[22px] w-[22px] shrink-0 object-contain"
											/>
										) : item.icon ? (
											<item.icon className="h-5 w-5 shrink-0" />
										) : null}
										<span
											className={cn(
												'text-base font-semibold tracking-tight',
												isHebrewUi && 'text-xl leading-tight',
												containsHebrew(item.label) && 'font-cardo',
											)}
										>
											{item.label}
										</span>
										{item.children?.length ? (
											<ChevronRight className="ml-auto h-4 w-4 opacity-50" />
										) : null}
									</Link>
								</SidebarMenuButton>

								{item.children?.length ? (
									<SidebarMenuSub>
										{item.children.map((child) => (
											<SidebarMenuSubItem key={child.key}>
												<SidebarMenuSubButton
													asChild
													isActive={pathname === child.href}
												>
													<Link href={child.href} onClick={onNavigate}>
														<span
															className={cn(
																isHebrewUi && 'text-lg leading-tight',
																containsHebrew(child.label) && 'font-cardo',
															)}
														>
															{child.label}
														</span>
													</Link>
												</SidebarMenuSubButton>
											</SidebarMenuSubItem>
										))}
									</SidebarMenuSub>
								) : null}
							</SidebarMenuItem>
						)
					})}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	)
}
