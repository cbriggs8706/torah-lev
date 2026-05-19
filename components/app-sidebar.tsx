'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ArrowLeftRight, Loader, LogIn, LogOut } from 'lucide-react'

import { signOut, useSession } from '@/components/providers/session-provider'
import { HebrewSidebarCalendar } from '@/components/hebrew/hebrew-sidebar-calendar'
import { NavMain } from '@/components/nav-main'
import { SidebarLocaleSwitcher } from '@/components/sidebar-locale-switcher'
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenu,
	useSidebar,
} from '@/components/ui/sidebar'
import { buildSidebarSections } from '@/lib/sidebar-data'
import { getSidebarLabel, normalizeSidebarLocale } from '@/lib/sidebar-translations'
import { cn } from '@/lib/utils'
import type { SidebarLocale } from '@/types/sidebar'

const HEBREW_CHARACTER_REGEX = /[\u0590-\u05FF]/

function containsHebrew(text: string) {
	return HEBREW_CHARACTER_REGEX.test(text)
}

type Props = {
	userProgress: {
		userId: string
		userName: string
		userImageSrc: string | null
		activeCourse: {
			id?: number
			title?: string
			imageSrc?: string
		} | null
		hearts: number
		points: number
		activeCourseId: number | null
	}
	isPro: boolean
	isHebrewFriend?: boolean
	isSpanishFriend?: boolean
	isEnglishFriend?: boolean
	isTester?: boolean
	initialSidebarLocale?: string | null
}

type SidebarUserProgress = Props['userProgress']

function inferLocaleFromPath(pathname: string, fallbackCourseId: number | null): SidebarLocale {
	if (pathname.startsWith('/es/')) return 'es'
	if (pathname.startsWith('/he/')) return 'he'
	if (pathname.startsWith('/el/')) return 'el'
	if (pathname.startsWith('/en/')) return 'en'

	if (fallbackCourseId === 12) return 'el'
	if (fallbackCourseId === 2) return 'es'
	if ([6, 11, 14].includes(fallbackCourseId ?? -1)) return 'he'
	return 'en'
}

function BrandCard({
	title,
	subtitle,
	onNavigate,
}: {
	title: string
	subtitle: string
	onNavigate: () => void
}) {
	return (
		<Link href="/courses" onClick={onNavigate} className="block">
			<div className="flex items-center gap-3 rounded-2xl bg-white/50 px-3 py-3 shadow-sm">
				<Image
					src="/icons/iconBoy.png"
					height={44}
					width={44}
					alt="Idiom Go mascot"
					className="shrink-0"
				/>
				<div className="min-w-0">
					<p className="truncate text-xl font-extrabold tracking-tight text-sidebar-primary">
						{title}
					</p>
					<p className="truncate text-sm text-sidebar-foreground/70">{subtitle}</p>
				</div>
			</div>
		</Link>
	)
}

function CourseSummaryCard({
	userProgress,
	isPro,
	onNavigate,
	swapCourseLabel,
	currentlyViewingLabel,
	coursesLabel,
	heartsLabel,
	pointsLabel,
}: {
	userProgress: SidebarUserProgress
	isPro: boolean
	onNavigate: () => void
	swapCourseLabel: string
	currentlyViewingLabel: string
	coursesLabel: string
	heartsLabel: string
	pointsLabel: string
}) {
	return (
		<div className="rounded-2xl border border-sidebar-border bg-white/60 p-3 shadow-sm">
			<div className="flex items-start gap-3">
				<Link
					href="/courses"
					onClick={onNavigate}
					className="group relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-sidebar-accent/70"
					aria-label={swapCourseLabel}
				>
					{userProgress.activeCourse?.imageSrc ? (
						<Image
							src={userProgress.activeCourse.imageSrc}
							alt={userProgress.activeCourse?.title || coursesLabel}
							width={48}
							height={48}
							className="h-full w-full object-cover transition duration-200 group-hover:scale-105 group-hover:opacity-20"
						/>
					) : (
						<Image
							src="/icons/iconBoy.png"
							alt={coursesLabel}
							width={28}
							height={28}
							className="h-7 w-7 object-contain transition duration-200 group-hover:opacity-20"
						/>
					)}
					<div className="absolute inset-0 flex flex-col items-center justify-center bg-sidebar-primary/10 px-1 text-sidebar-primary opacity-0 transition duration-200 group-hover:opacity-100">
						<ArrowLeftRight className="h-3.5 w-3.5" />
						<span className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.12em]">
							{swapCourseLabel}
						</span>
					</div>
				</Link>
				<div className="min-w-0 flex-1">
					<p className="text-[11px] font-bold uppercase tracking-[0.24em] text-sidebar-foreground/55">
						{currentlyViewingLabel}
					</p>
					<p className="mt-1 text-sm font-semibold leading-snug text-sidebar-primary">
						{userProgress.activeCourse?.title || coursesLabel}
					</p>
				</div>
			</div>

			<div className="mt-3 grid grid-cols-2 gap-2">
				<div className="flex min-h-[56px] flex-col rounded-xl bg-sidebar-accent/70 px-3 py-2">
					<div className="flex min-w-0 justify-center">
						<p className="min-w-0 text-center text-[clamp(1.275rem,2.7vw,1.7625rem)] font-extrabold leading-none tracking-tight text-sidebar-foreground">
							{isPro ? '∞' : userProgress.hearts}
						</p>
					</div>
					<div className="mt-1 flex items-center justify-center gap-1">
						<Image
							src="/icons/iconHeart.png"
							alt=""
							aria-hidden="true"
							width={14}
							height={14}
							className="h-3.5 w-3.5 shrink-0 object-contain"
						/>
						<p className="text-center text-[10px] font-bold uppercase tracking-[0.16em] text-sidebar-foreground/55">
							{heartsLabel}
						</p>
					</div>
				</div>
				<div className="flex min-h-[56px] flex-col rounded-xl bg-sidebar-accent/70 px-3 py-2">
					<div className="flex min-w-0 justify-center">
						<p className="min-w-0 text-center text-[clamp(1.275rem,2.7vw,1.7625rem)] font-extrabold leading-none tracking-tight text-sidebar-foreground">
							{userProgress.points}
						</p>
					</div>
					<div className="mt-1 flex items-center justify-center gap-1">
						<Image
							src="/icons/iconLightning.png"
							alt=""
							aria-hidden="true"
							width={14}
							height={14}
							className="h-3.5 w-3.5 shrink-0 object-contain"
						/>
						<p className="text-center text-[10px] font-bold uppercase tracking-[0.16em] text-sidebar-foreground/55">
							{pointsLabel}
						</p>
					</div>
				</div>
			</div>
		</div>
	)
}

function UserCard({
	isLoading,
	isSignedIn,
	session,
	userProgress,
	authLabel,
	handleNavigate,
	resolvedLocale,
	handleLocaleChange,
	languageLabel,
	isHebrewUi,
	showMobileDetails = false,
	isPro,
	swapCourseLabel,
	currentlyViewingLabel,
	coursesLabel,
	heartsLabel,
	pointsLabel,
}: {
	isLoading: boolean
	isSignedIn: boolean
	session: ReturnType<typeof useSession>['data']
	userProgress: SidebarUserProgress
	authLabel: string
	handleNavigate: () => void
	resolvedLocale: SidebarLocale
	handleLocaleChange: (nextLocale: SidebarLocale) => void
	languageLabel: string
	isHebrewUi: boolean
	showMobileDetails?: boolean
	isPro: boolean
	swapCourseLabel: string
	currentlyViewingLabel: string
	coursesLabel: string
	heartsLabel: string
	pointsLabel: string
}) {
	return (
		<div className="rounded-2xl border border-sidebar-border bg-white/60 p-3 shadow-sm">
			{isLoading ? (
				<div className="flex items-center gap-2 text-sidebar-foreground/70">
					<Loader className="h-4 w-4 animate-spin" />
					<span className="text-sm">Loading...</span>
				</div>
			) : (
				<div className="space-y-3">
					<div className="flex items-center gap-3">
						<Image
							src={session?.user?.image || userProgress.userImageSrc || '/mascot.svg'}
							alt={session?.user?.name || userProgress.userName || 'User'}
							width={40}
							height={40}
							className="rounded-full border border-sidebar-border object-cover"
						/>
						<div className="min-w-0">
							<p className="truncate text-sm font-semibold text-sidebar-foreground">
								{session?.user?.name || userProgress.userName || 'Guest'}
							</p>
							<p className="truncate text-xs text-sidebar-foreground/65">
								{session?.user?.email || userProgress.activeCourse?.title || ''}
							</p>
						</div>
					</div>

					{showMobileDetails ? (
						<>
							<CourseSummaryCard
								userProgress={userProgress}
								isPro={isPro}
								onNavigate={handleNavigate}
								swapCourseLabel={swapCourseLabel}
								currentlyViewingLabel={currentlyViewingLabel}
								coursesLabel={coursesLabel}
								heartsLabel={heartsLabel}
								pointsLabel={pointsLabel}
							/>
							<SidebarLocaleSwitcher
								value={resolvedLocale}
								label={languageLabel}
								onChange={handleLocaleChange}
								isHebrewUi={isHebrewUi}
							/>
						</>
					) : null}

					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton
								asChild
								size="sm"
								className={cn(
									'bg-sidebar-accent/65',
									isSignedIn
										? 'hover:bg-sidebar-accent'
										: 'hover:bg-sidebar-primary hover:text-sidebar-primary-foreground',
								)}
							>
								<button
									type="button"
									onClick={() => {
										handleNavigate()
										if (isSignedIn) {
											signOut({ callbackUrl: '/' })
										} else {
											window.location.assign('/auth/signin?callbackUrl=/courses')
										}
									}}
								>
									{isSignedIn ? (
										<LogOut className="h-4 w-4" />
									) : (
										<LogIn className="h-4 w-4" />
									)}
									<span
										className={cn(
											'font-semibold',
											containsHebrew(authLabel) && 'font-cardo',
										)}
									>
										{authLabel}
									</span>
								</button>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</div>
			)}
		</div>
	)
}

export default function AppSidebar({
	userProgress,
	isPro,
	isHebrewFriend,
	isSpanishFriend,
	isEnglishFriend,
	isTester,
	initialSidebarLocale,
}: Props) {
	const pathname = usePathname()
	const { isMobile, setOpenMobile } = useSidebar()
	const { data: session, status } = useSession()
	const [manualLocale, setManualLocale] = useState<SidebarLocale | null>(
		initialSidebarLocale ? normalizeSidebarLocale(initialSidebarLocale) : null,
	)

	const resolvedLocale = manualLocale ?? inferLocaleFromPath(pathname, userProgress.activeCourseId)
	const sections = useMemo(
		() =>
			buildSidebarSections({
				activeCourseId: userProgress.activeCourseId,
				isHebrewFriend,
				isSpanishFriend,
				isEnglishFriend,
				isTester,
				locale: resolvedLocale,
			}),
		[
			userProgress.activeCourseId,
			isHebrewFriend,
			isSpanishFriend,
			isEnglishFriend,
			isTester,
			resolvedLocale,
		],
	)

	const t = (key: Parameters<typeof getSidebarLabel>[1]) =>
		getSidebarLabel(resolvedLocale, key)

	const handleNavigate = () => {
		if (isMobile) {
			setOpenMobile(false)
		}
	}

	const handleLocaleChange = (nextLocale: SidebarLocale) => {
		setManualLocale(nextLocale)
		document.cookie = `sidebarLocale=${nextLocale}; path=/; max-age=31536000`
		localStorage.setItem('sidebarLocale', nextLocale)
		window.dispatchEvent(
			new CustomEvent('sidebar-locale-changed', {
				detail: { locale: nextLocale },
			})
		)
	}

	const isLoading = status === 'loading'
	const isSignedIn = !!session?.user
	const isHebrewUi = resolvedLocale === 'he'
	const sidebarSide = isHebrewUi ? 'right' : 'left'
	const showHebrewCalendar = [6, 11, 14].includes(userProgress.activeCourseId ?? 0)
	const authLabel = isSignedIn ? t('actions.logOut') : t('actions.logIn')

	if (!userProgress.activeCourseId) {
		return (
			<Sidebar side={sidebarSide}>
				<div
					dir={isHebrewUi ? 'rtl' : 'ltr'}
					className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center"
				>
					<Image src="/icons/iconBoy.png" height={64} width={64} alt="Idiom Go mascot" />
					<div className="space-y-2">
						<h2 className="text-2xl font-extrabold text-sidebar-primary">
							{t('brand.title')}
						</h2>
						<p className="text-sidebar-foreground/70">{t('courses.chooseCourse')}</p>
					</div>
					<Link
						href="/courses"
						onClick={handleNavigate}
						className="rounded-xl bg-sidebar-primary px-4 py-2.5 font-bold text-sidebar-primary-foreground"
					>
						{t('courses.viewCourses')}
					</Link>
				</div>
			</Sidebar>
		)
	}

	return (
		<Sidebar side={sidebarSide}>
			<div dir={isHebrewUi ? 'rtl' : 'ltr'} className="flex h-full flex-col">
				{isMobile ? null : (
					<SidebarHeader className="space-y-4 bg-gradient-to-b from-sidebar-accent/80 to-transparent">
						<BrandCard
							title={t('brand.title')}
							subtitle={t('brand.subtitle')}
							onNavigate={handleNavigate}
						/>
					</SidebarHeader>
				)}

				<SidebarContent>
					{isMobile ? (
						<BrandCard
							title={t('brand.title')}
							subtitle={t('brand.subtitle')}
							onNavigate={handleNavigate}
						/>
					) : null}
					{showHebrewCalendar ? (
						<HebrewSidebarCalendar onClick={handleNavigate} />
					) : null}
					{sections.map((section) => (
						<NavMain
							key={section.key}
							section={section}
							onNavigate={handleNavigate}
							isHebrewUi={isHebrewUi}
						/>
					))}
					{isMobile ? (
						<UserCard
							isLoading={isLoading}
							isSignedIn={isSignedIn}
							session={session}
							userProgress={userProgress}
							authLabel={authLabel}
							handleNavigate={handleNavigate}
							resolvedLocale={resolvedLocale}
							handleLocaleChange={handleLocaleChange}
							languageLabel={t('actions.language')}
							isHebrewUi={isHebrewUi}
							showMobileDetails
							isPro={isPro}
							swapCourseLabel={t('actions.swapCourse')}
							currentlyViewingLabel={t('actions.currentlyViewing')}
							coursesLabel={t('nav.courses')}
							heartsLabel={t('stats.hearts')}
							pointsLabel={t('stats.points')}
						/>
					) : null}
				</SidebarContent>

				{isMobile ? null : (
					<SidebarFooter className="space-y-3">
						<SidebarLocaleSwitcher
							value={resolvedLocale}
							label={t('actions.language')}
							onChange={handleLocaleChange}
							isHebrewUi={isHebrewUi}
						/>
						<CourseSummaryCard
							userProgress={userProgress}
							isPro={isPro}
							onNavigate={handleNavigate}
							swapCourseLabel={t('actions.swapCourse')}
							currentlyViewingLabel={t('actions.currentlyViewing')}
							coursesLabel={t('nav.courses')}
							heartsLabel={t('stats.hearts')}
							pointsLabel={t('stats.points')}
						/>
						<UserCard
							isLoading={isLoading}
							isSignedIn={isSignedIn}
							session={session}
							userProgress={userProgress}
							authLabel={authLabel}
							handleNavigate={handleNavigate}
							resolvedLocale={resolvedLocale}
							handleLocaleChange={handleLocaleChange}
							languageLabel={t('actions.language')}
							isHebrewUi={isHebrewUi}
							isPro={isPro}
							swapCourseLabel={t('actions.swapCourse')}
							currentlyViewingLabel={t('actions.currentlyViewing')}
							coursesLabel={t('nav.courses')}
							heartsLabel={t('stats.hearts')}
							pointsLabel={t('stats.points')}
						/>
					</SidebarFooter>
				)}
			</div>
		</Sidebar>
	)
}
