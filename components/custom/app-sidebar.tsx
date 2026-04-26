'use client'

import * as React from 'react'
import { Heart, Sparkles, Star } from 'lucide-react'

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar'
import { NavMain } from './nav-main'
import { NavInput } from './nav-input'
import { NavSecondary } from './nav-secondary'
import { NavUser } from './nav-user'
import { Session } from 'next-auth'
import { SidebarLanguageSwitcher } from './sidebar-language-switcher'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { buildSidebarData, getTeacherNav } from '@/lib/sidebarData'
import { Separator } from '../ui/separator'
import { ThemeToggle } from './theme-toggle'

export function AppSidebar({
	session,
	role,
	learningStats,
	...props
}: {
	session: Session | null
	role: string
	learningStats?: {
		hearts: number
		points: number
	}
} & React.ComponentProps<typeof Sidebar>) {
	const { locale } = useParams()
	const t = useTranslations()
	const data = buildSidebarData(t, locale as string)

	const teacherNav = getTeacherNav(t, locale as string)
	return (
		<Sidebar variant="inset" className="p-3" {...props}>
			<SidebarHeader className="tl-sidebar-panel gap-4 rounded-[1.9rem] p-4 backdrop-blur-sm">
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							size="lg"
							asChild
							className="h-auto rounded-[1.65rem] bg-transparent px-3 py-3 hover:bg-sidebar-accent/55"
						>
							<a href="#">
								<div className="tl-heart-glow bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-12 items-center justify-center rounded-[1.35rem]">
									<Heart className="size-[1.375rem]" />
								</div>
								<div className="grid flex-1 text-left leading-tight">
									<span className="truncate font-[family:var(--font-cardo)] text-[1.45rem] font-semibold tracking-[-0.03em]">
										{t('sidebar.main.torahLev')}
									</span>
									<span className="truncate text-sm text-sidebar-foreground/68">
										Free forever.
									</span>
								</div>
							</a>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>

				<div className="tl-scrollwork tl-sidebar-scroll relative overflow-hidden rounded-[1.8rem] px-5 py-5">
					<div className="space-y-4">
						<div className="flex items-start justify-between gap-3">
							<div className="space-y-1.5">
								<p className="font-[family:var(--font-alegreya-sc)] text-[0.78rem] uppercase tracking-[0.24em] text-sidebar-foreground/55">
									Continue your study
								</p>
								<p className="font-[family:var(--font-cardo)] text-[1.55rem] leading-tight font-semibold tracking-[-0.03em] text-sidebar-foreground">
									Return to your current path
								</p>
							</div>
							<div className="rounded-full border border-[color:color-mix(in_srgb,var(--chart-2)_45%,var(--sidebar-border))] bg-sidebar/78 p-2.5 text-sidebar-primary shadow-[0_10px_24px_rgba(143,34,48,0.08)]">
								<Sparkles className="size-[1.125rem]" />
							</div>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div className="rounded-[1.35rem] border border-[color:color-mix(in_srgb,var(--chart-2)_34%,var(--sidebar-border))] bg-sidebar/84 px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.38)]">
								<p className="flex items-center gap-1.5 text-[0.72rem] uppercase tracking-[0.2em] text-sidebar-foreground/55">
									<Heart className="size-3 fill-current text-sidebar-primary" />
									Hearts
								</p>
								<p className="mt-1.5 font-[family:var(--font-cardo)] text-[1.4rem] font-semibold tracking-[-0.03em]">
									{learningStats?.hearts ?? 5}/5
								</p>
							</div>
							<div className="rounded-[1.35rem] border border-[color:color-mix(in_srgb,var(--chart-2)_34%,var(--sidebar-border))] bg-sidebar/84 px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.38)]">
								<p className="flex items-center gap-1.5 text-[0.72rem] uppercase tracking-[0.2em] text-sidebar-foreground/55">
									<Star className="size-3 fill-current text-sidebar-primary" />
									Points
								</p>
								<p className="mt-1.5 font-[family:var(--font-cardo)] text-[1.4rem] font-semibold tracking-[-0.03em]">
									{learningStats?.points ?? 0}
								</p>
							</div>
						</div>
					</div>
				</div>

				<div className="flex items-center justify-between gap-3 px-1">
					<p className="font-[family:var(--font-alegreya-sc)] text-[0.78rem] uppercase tracking-[0.24em] text-sidebar-foreground/50">
						Reading
					</p>
					<ThemeToggle />
				</div>
			</SidebarHeader>
			<SidebarContent className="tl-sidebar-panel mt-3 rounded-[1.9rem] py-4 backdrop-blur-sm">
				{role === 'admin' && (
					<>
						<NavMain items={teacherNav} label={t('sidebar.teacher.title')} />
						<Separator className="mx-6 my-4 tl-divider bg-transparent" />
					</>
				)}
				<NavMain items={data.navMain} label="Student Home" />
				<NavInput
					input={data.input}
					label="Living Input"
				/>
				<NavSecondary items={data.navSecondary} className="mt-auto" />
			</SidebarContent>
			<SidebarFooter className="tl-sidebar-panel mt-3 rounded-[1.9rem] p-4 backdrop-blur-sm">
				<SidebarLanguageSwitcher
					locale={(locale as string) ?? 'en'}
					label={t('sidebar.main.language')}
					choose={t('sidebar.main.chooseLanguage')}
				/>

				<NavUser
					session={session}
					dashboard={t('sidebar.user.dashboard')}
					account={t('sidebar.user.account')}
					notifications={t('sidebar.user.notifications')}
					logout={t('sidebar.user.logout')}
					login={t('sidebar.user.login')}
					register={t('sidebar.user.register')}
					locale={(locale as string) ?? 'en'}
				/>
			</SidebarFooter>
		</Sidebar>
	)
}
