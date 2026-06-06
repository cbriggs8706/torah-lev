'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
	ArrowLeftRight,
	ChevronDown,
	ChevronUp,
	Loader,
	LogIn,
	LogOut,
	UserPlus,
} from 'lucide-react'

import { signOut, useSession } from '@/components/providers/session-provider'
import { HebrewSidebarCalendar } from '@/components/hebrew/hebrew-sidebar-calendar'
import { NavMain } from '@/components/nav-main'
import { SidebarLocaleSwitcher } from '@/components/sidebar-locale-switcher'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
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
import {
	getSidebarLabel,
	normalizeSidebarLocale,
} from '@/lib/sidebar-translations'
import { cn } from '@/lib/utils'
import type { SidebarLocale } from '@/types/sidebar'

const HEBREW_CHARACTER_REGEX = /[\u0590-\u05FF]/

function containsHebrew(text: string) {
	return HEBREW_CHARACTER_REGEX.test(text)
}

function getFooterAccountLinks(
	activeCourseId: number | null,
	labels: {
		leaderboard: string
		dashboard: string
	},
) {
	const links: Array<{
		key: string
		label: string
		href: string
		iconSrc: string
	}> = []

	if ([6, 11, 14].includes(activeCourseId ?? -1)) {
		links.push(
			{
				key: 'leaderboard',
				label: labels.leaderboard,
				href: '/he/leaderboard',
				iconSrc: '/icons/iconTrophy.png',
			},
			{
				key: 'dashboard',
				label: labels.dashboard,
				href: '/he/dashboard',
				iconSrc: '/icons/iconName.png',
			},
		)
	}

	if (activeCourseId === 19) {
		links.push({
			key: 'dashboard',
			label: labels.dashboard,
			href: '/he/dashboard',
			iconSrc: '/mascot.svg',
		})
	}

	return links
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

function inferLocaleFromPath(
	pathname: string,
	fallbackCourseId: number | null,
): SidebarLocale {
	if (pathname.startsWith('/es/')) return 'es'
	if (pathname.startsWith('/he/')) return 'he'
	if (pathname.startsWith('/el/')) return 'el'

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
		<Link href="/curriculum" onClick={onNavigate} className="block">
			<div className="flex items-center gap-3 rounded-2xl bg-white/50 px-3 py-3 shadow-sm">
				<Image
					src="/icons/iconBoy.png"
					height={44}
					width={44}
					alt="Torah Lev mascot"
					className="shrink-0"
				/>
				<div className="min-w-0">
					<p className="truncate text-xl font-extrabold tracking-tight text-sidebar-primary">
						{title}
					</p>
					<p className="truncate text-sm text-sidebar-foreground/70">
						{subtitle}
					</p>
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
	viewCoursesLabel,
	currentlyViewingLabel,
	coursesLabel,
	heartsLabel,
	pointsLabel,
}: {
	userProgress: SidebarUserProgress
	isPro: boolean
	onNavigate: () => void
	swapCourseLabel: string
	viewCoursesLabel: string
	currentlyViewingLabel: string
	coursesLabel: string
	heartsLabel: string
	pointsLabel: string
}) {
	return (
		<div className="rounded-2xl border border-sidebar-border bg-white/60 p-3 shadow-sm">
			<div className="flex items-start gap-3">
				<Link
					href="/curriculum"
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
					<div className="mt-1 flex items-start justify-between gap-2">
						<p className="min-w-0 text-sm font-semibold leading-snug text-sidebar-primary">
							{userProgress.activeCourse?.title || coursesLabel}
						</p>
						<Link
							href="/curriculum"
							onClick={onNavigate}
							className="shrink-0 rounded-full border border-sidebar-border bg-sidebar-accent/75 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-sidebar-primary transition hover:bg-sidebar-accent"
						>
							{viewCoursesLabel}
						</Link>
					</div>
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
	loginLabel,
	logoutLabel,
	createAccountLabel,
	handleNavigate,
	resolvedLocale,
	handleLocaleChange,
	languageLabel,
	isHebrewUi,
	isPro,
	compactSignedInMenu = false,
	accountLinks,
	swapCourseLabel,
	viewCoursesLabel,
	currentlyViewingLabel,
	coursesLabel,
	heartsLabel,
	pointsLabel,
}: {
	isLoading: boolean
	isSignedIn: boolean
	session: ReturnType<typeof useSession>['data']
	userProgress: SidebarUserProgress
	loginLabel: string
	logoutLabel: string
	createAccountLabel: string
	handleNavigate: () => void
	resolvedLocale: SidebarLocale
	handleLocaleChange: (nextLocale: SidebarLocale) => void
	languageLabel: string
	isHebrewUi: boolean
	isPro: boolean
	compactSignedInMenu?: boolean
	accountLinks: Array<{
		key: string
		label: string
		href: string
		iconSrc: string
	}>
	swapCourseLabel: string
	viewCoursesLabel: string
	currentlyViewingLabel: string
	coursesLabel: string
	heartsLabel: string
	pointsLabel: string
}) {
	const [isMenuOpen, setIsMenuOpen] = useState(false)
	const handleAccountNavigate = () => {
		handleNavigate()
		setIsMenuOpen(false)
	}

	const signedInSummary = (
		<>
			<SidebarLocaleSwitcher
				value={resolvedLocale}
				label={languageLabel}
				onChange={handleLocaleChange}
				isHebrewUi={isHebrewUi}
			/>

			<CourseSummaryCard
				userProgress={userProgress}
				isPro={isPro}
				onNavigate={handleNavigate}
				swapCourseLabel={swapCourseLabel}
				viewCoursesLabel={viewCoursesLabel}
				currentlyViewingLabel={currentlyViewingLabel}
				coursesLabel={coursesLabel}
				heartsLabel={heartsLabel}
				pointsLabel={pointsLabel}
			/>

			{accountLinks.length ? (
				<SidebarMenu>
					{accountLinks.map((item) => (
						<SidebarMenuItem key={item.key}>
							<SidebarMenuButton
								asChild
								size="sm"
								className="bg-sidebar-accent/65 hover:bg-sidebar-accent"
							>
								<Link href={item.href} onClick={handleAccountNavigate}>
									<Image
										src={item.iconSrc}
										alt=""
										aria-hidden="true"
										width={16}
										height={16}
										className="h-4 w-4 shrink-0 object-contain"
									/>
									<span
										className={cn(
											'font-semibold',
											containsHebrew(item.label) && 'font-cardo',
										)}
									>
										{item.label}
									</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			) : null}

			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton
						asChild
						size="sm"
						className="bg-sidebar-accent/65 hover:bg-sidebar-accent"
					>
						<button
							type="button"
							onClick={() => {
								handleNavigate()
								signOut({ callbackUrl: '/' })
							}}
						>
							<LogOut className="h-4 w-4" />
							<span
								className={cn(
									'font-semibold',
									containsHebrew(logoutLabel) && 'font-cardo',
								)}
							>
								{logoutLabel}
							</span>
						</button>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		</>
	)

	if (isSignedIn && compactSignedInMenu && !isLoading) {
		return (
			<Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
				<PopoverTrigger asChild>
					<button
						type="button"
						className="flex w-full items-center gap-3 rounded-2xl border border-sidebar-border bg-white/60 p-3 text-left shadow-sm transition hover:bg-white/80"
					>
						<Image
							src={
								session?.user?.image ||
								userProgress.userImageSrc ||
								'/mascot.svg'
							}
							alt={session?.user?.name || userProgress.userName || 'User'}
							width={40}
							height={40}
							className="rounded-full border border-sidebar-border object-cover"
						/>
						<div className="min-w-0 flex-1">
							<p className="truncate text-sm font-semibold text-sidebar-foreground">
								{session?.user?.name || userProgress.userName || 'Guest'}
							</p>
							<p className="truncate text-xs text-sidebar-foreground/65">
								{session?.user?.email || userProgress.activeCourse?.title || ''}
							</p>
							<div className="mt-1 flex items-center gap-3 text-[11px] font-semibold text-sidebar-foreground/70">
								<div className="flex items-center gap-1">
									<Image
										src="/icons/iconHeart.png"
										alt=""
										aria-hidden="true"
										width={12}
										height={12}
										className="h-3 w-3 shrink-0 object-contain"
									/>
									<span>{isPro ? '∞' : userProgress.hearts}</span>
								</div>
								<div className="flex items-center gap-1">
									<Image
										src="/icons/iconLightning.png"
										alt=""
										aria-hidden="true"
										width={12}
										height={12}
										className="h-3 w-3 shrink-0 object-contain"
									/>
									<span>{userProgress.points}</span>
								</div>
							</div>
						</div>
						{isMenuOpen ? (
							<ChevronUp className="h-5 w-5 shrink-0 text-sidebar-foreground/70" />
						) : (
							<ChevronDown className="h-5 w-5 shrink-0 text-sidebar-foreground/70" />
						)}
					</button>
				</PopoverTrigger>
				<PopoverContent
					side={isHebrewUi ? 'left' : 'right'}
					align="end"
					sideOffset={8}
					className="w-[min(26rem,calc(100vw-2rem))] rounded-3xl border-sidebar-border bg-sidebar p-3 shadow-xl"
				>
					<div className="space-y-3">
						<div className="flex items-center gap-3 rounded-2xl border border-sidebar-border bg-white/60 p-3 shadow-sm">
							<Image
								src={
									session?.user?.image ||
									userProgress.userImageSrc ||
									'/mascot.svg'
								}
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
									{session?.user?.email ||
										userProgress.activeCourse?.title ||
										''}
								</p>
							</div>
						</div>

						{signedInSummary}
					</div>
				</PopoverContent>
			</Popover>
		)
	}

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
							src={
								session?.user?.image ||
								userProgress.userImageSrc ||
								'/mascot.svg'
							}
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
								{isSignedIn
									? session?.user?.email ||
										userProgress.activeCourse?.title ||
										''
									: ''}
							</p>
						</div>
					</div>

					<div className="space-y-3 border-t border-sidebar-border/80 pt-3">
						{isSignedIn ? (
							signedInSummary
						) : (
							<>
								<SidebarLocaleSwitcher
									value={resolvedLocale}
									label={languageLabel}
									onChange={handleLocaleChange}
									isHebrewUi={isHebrewUi}
								/>
								<SidebarMenu>
									<SidebarMenuItem>
										<SidebarMenuButton
											asChild
											size="sm"
											className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground"
										>
											<button
												type="button"
												onClick={() => {
													handleNavigate()
													window.location.assign(
														'/auth/signin?callbackUrl=/curriculum',
													)
												}}
											>
												<LogIn className="h-4 w-4" />
												<span
													className={cn(
														'font-semibold',
														containsHebrew(loginLabel) && 'font-cardo',
													)}
												>
													{loginLabel}
												</span>
											</button>
										</SidebarMenuButton>
									</SidebarMenuItem>
									<SidebarMenuItem>
										<SidebarMenuButton
											asChild
											size="sm"
											className="bg-sidebar-accent/65 hover:bg-sidebar-accent"
										>
											<button
												type="button"
												onClick={() => {
													handleNavigate()
													window.location.assign(
														'/auth/signin?callbackUrl=/curriculum',
													)
												}}
											>
												<UserPlus className="h-4 w-4" />
												<span
													className={cn(
														'font-semibold',
														containsHebrew(createAccountLabel) && 'font-cardo',
													)}
												>
													{createAccountLabel}
												</span>
											</button>
										</SidebarMenuButton>
									</SidebarMenuItem>
								</SidebarMenu>
							</>
						)}
					</div>
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
	const contentRef = useRef<HTMLDivElement | null>(null)
	const [showScrollCue, setShowScrollCue] = useState(false)

	const resolvedLocale =
		manualLocale ?? inferLocaleFromPath(pathname, userProgress.activeCourseId)
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
	const accountLinks = getFooterAccountLinks(userProgress.activeCourseId, {
		leaderboard: t('nav.leaderboard'),
		dashboard: t('nav.dashboard'),
	})

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
			}),
		)
	}

	const isLoading = status === 'loading'
	const isSignedIn = !!session?.user
	const isHebrewUi = resolvedLocale === 'he'
	const sidebarSide = isHebrewUi ? 'right' : 'left'
	const showHebrewCalendar = [6, 11, 14].includes(
		userProgress.activeCourseId ?? 0,
	)

	useEffect(() => {
		const element = contentRef.current
		if (!element) return

		const updateScrollCue = () => {
			const remainingScroll =
				element.scrollHeight - element.clientHeight - element.scrollTop
			setShowScrollCue(remainingScroll > 16)
		}

		const frameId = window.requestAnimationFrame(updateScrollCue)
		const resizeObserver = new ResizeObserver(updateScrollCue)
		resizeObserver.observe(element)
		element.addEventListener('scroll', updateScrollCue, { passive: true })
		window.addEventListener('resize', updateScrollCue)

		return () => {
			window.cancelAnimationFrame(frameId)
			resizeObserver.disconnect()
			element.removeEventListener('scroll', updateScrollCue)
			window.removeEventListener('resize', updateScrollCue)
		}
	}, [
		isMobile,
		pathname,
		resolvedLocale,
		sections.length,
		showHebrewCalendar,
		isSignedIn,
	])

	if (!userProgress.activeCourseId) {
		return (
			<Sidebar side={sidebarSide}>
				<div
					dir={isHebrewUi ? 'rtl' : 'ltr'}
					className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center"
				>
					<Image
						src="/icons/iconBoy.png"
						height={64}
						width={64}
						alt="Torah Lev mascot"
					/>
					<div className="space-y-2">
						<h2 className="text-2xl font-extrabold text-sidebar-primary">
							{t('brand.title')}
						</h2>
						<p className="text-sidebar-foreground/70">
							{t('courses.chooseCourse')}
						</p>
					</div>
					<Link
						href="/curriculum"
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
			<div
				dir={isHebrewUi ? 'rtl' : 'ltr'}
				className="flex h-full min-h-0 flex-col"
			>
				{isMobile ? null : (
					<SidebarHeader className="space-y-4 bg-gradient-to-b from-sidebar-accent/80 to-transparent">
						<BrandCard
							title={t('brand.title')}
							subtitle={t('brand.subtitle')}
							onNavigate={handleNavigate}
						/>
					</SidebarHeader>
				)}

				<div className="relative min-h-0 flex-1 overflow-hidden">
					<SidebarContent ref={contentRef} className="pb-20">
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
								loginLabel={t('actions.logIn')}
								logoutLabel={t('actions.logOut')}
								createAccountLabel={t('actions.createAccount')}
								handleNavigate={handleNavigate}
								resolvedLocale={resolvedLocale}
								handleLocaleChange={handleLocaleChange}
								languageLabel={t('actions.language')}
								isHebrewUi={isHebrewUi}
								isPro={isPro}
								compactSignedInMenu={false}
								accountLinks={accountLinks}
								swapCourseLabel={t('actions.swapCourse')}
								viewCoursesLabel={t('courses.viewCourses')}
								currentlyViewingLabel={t('actions.currentlyViewing')}
								coursesLabel={t('nav.courses')}
								heartsLabel={t('stats.hearts')}
								pointsLabel={t('stats.points')}
							/>
						) : null}
					</SidebarContent>

					{showScrollCue ? (
						<div className="pointer-events-none absolute inset-x-4 bottom-3 z-10">
							<div className="rounded-2xl bg-gradient-to-t from-sidebar via-sidebar/95 to-transparent px-3 pb-1 pt-6 text-center">
								<div className="inline-flex items-center gap-2 rounded-full border border-sidebar-border bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-sidebar-foreground/70 shadow-sm">
									<ChevronDown className="h-3.5 w-3.5 animate-bounce" />
									<span>Scroll for more</span>
								</div>
							</div>
						</div>
					) : null}
				</div>

				{isMobile ? null : (
					<SidebarFooter>
						<UserCard
							isLoading={isLoading}
							isSignedIn={isSignedIn}
							session={session}
							userProgress={userProgress}
							loginLabel={t('actions.logIn')}
							logoutLabel={t('actions.logOut')}
							createAccountLabel={t('actions.createAccount')}
							handleNavigate={handleNavigate}
							resolvedLocale={resolvedLocale}
							handleLocaleChange={handleLocaleChange}
							languageLabel={t('actions.language')}
							isHebrewUi={isHebrewUi}
							isPro={isPro}
							compactSignedInMenu
							accountLinks={accountLinks}
							swapCourseLabel={t('actions.swapCourse')}
							viewCoursesLabel={t('courses.viewCourses')}
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
