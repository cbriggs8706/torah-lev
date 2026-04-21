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
			<SidebarHeader className="gap-4 rounded-[1.75rem] border border-sidebar-border/80 bg-sidebar/95 p-3 shadow-[0_18px_60px_rgba(63,22,31,0.08)] backdrop-blur-sm">
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							size="lg"
							asChild
							className="h-auto rounded-[1.5rem] bg-transparent px-2 py-2 hover:bg-sidebar-accent/60"
						>
							<a href="#">
								<div className="tl-heart-glow bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-11 items-center justify-center rounded-2xl">
									<Heart className="size-5" />
								</div>
								<div className="grid flex-1 text-left leading-tight">
									<span className="truncate font-[family:var(--font-cardo)] text-xl font-semibold">
										{t('sidebar.main.torahLev')}
									</span>
									<span className="truncate text-xs text-sidebar-foreground/70">
										Sacred study, carried by heart
									</span>
								</div>
							</a>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>

				<div className="tl-scrollwork relative overflow-hidden rounded-[1.6rem] border border-sidebar-border/70 bg-[linear-gradient(145deg,color-mix(in_srgb,var(--sidebar-accent)_88%,white_12%),transparent)] px-4 py-4">
					<div className="space-y-4">
						<div className="flex items-start justify-between gap-3">
							<div className="space-y-1">
								<p className="font-[family:var(--font-alegreya-sc)] text-[0.68rem] uppercase tracking-[0.24em] text-sidebar-foreground/55">
									Continue your study
								</p>
								<p className="font-[family:var(--font-cardo)] text-lg font-semibold text-sidebar-foreground">
									Return to your current path
								</p>
							</div>
							<div className="rounded-full border border-sidebar-border/70 bg-sidebar/80 p-2 text-sidebar-primary">
								<Sparkles className="size-4" />
							</div>
						</div>

						<div className="grid grid-cols-2 gap-2">
							<div className="rounded-2xl border border-sidebar-border/70 bg-sidebar/85 px-3 py-2">
								<p className="flex items-center gap-1.5 text-[0.65rem] uppercase tracking-[0.18em] text-sidebar-foreground/55">
									<Heart className="size-3 fill-current text-sidebar-primary" />
									Hearts
								</p>
								<p className="mt-1 font-[family:var(--font-cardo)] text-lg font-semibold">
									{learningStats?.hearts ?? 5}/5
								</p>
							</div>
							<div className="rounded-2xl border border-sidebar-border/70 bg-sidebar/85 px-3 py-2">
								<p className="flex items-center gap-1.5 text-[0.65rem] uppercase tracking-[0.18em] text-sidebar-foreground/55">
									<Star className="size-3 fill-current text-sidebar-primary" />
									Points
								</p>
								<p className="mt-1 font-[family:var(--font-cardo)] text-lg font-semibold">
									{learningStats?.points ?? 0}
								</p>
							</div>
						</div>
					</div>
				</div>

				<div className="flex items-center justify-between gap-3 px-1">
					<p className="font-[family:var(--font-alegreya-sc)] text-[0.68rem] uppercase tracking-[0.24em] text-sidebar-foreground/50">
						Reading sanctuary
					</p>
					<ThemeToggle />
				</div>
			</SidebarHeader>
			<SidebarContent className="mt-3 rounded-[1.75rem] border border-sidebar-border/80 bg-sidebar/95 py-3 shadow-[0_18px_60px_rgba(63,22,31,0.08)] backdrop-blur-sm">
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
			<SidebarFooter className="mt-3 rounded-[1.75rem] border border-sidebar-border/80 bg-sidebar/95 p-3 shadow-[0_18px_60px_rgba(63,22,31,0.08)] backdrop-blur-sm">
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
