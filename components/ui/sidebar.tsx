'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { PanelLeft } from 'lucide-react'

import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'

const SIDEBAR_WIDTH = '18rem'
const SIDEBAR_WIDTH_MOBILE = '20rem'

type SidebarContextValue = {
	isMobile: boolean
	open: boolean
	setOpen: (open: boolean) => void
	openMobile: boolean
	setOpenMobile: (open: boolean) => void
	side: 'left' | 'right'
	setSide: (side: 'left' | 'right') => void
	toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null)

export function useSidebar() {
	const context = React.useContext(SidebarContext)
	if (!context) {
		throw new Error('useSidebar must be used within a SidebarProvider.')
	}

	return context
}

export function SidebarProvider({
	children,
	defaultOpen = true,
	className,
	style,
}: React.ComponentProps<'div'> & { defaultOpen?: boolean }) {
	const isMobile = useIsMobile()
	const [open, setOpen] = React.useState(defaultOpen)
	const [openMobile, setOpenMobile] = React.useState(false)
	const [side, setSide] = React.useState<'left' | 'right'>('left')

	const toggleSidebar = React.useCallback(() => {
		if (isMobile) {
			setOpenMobile((current) => !current)
			return
		}
		setOpen((current) => !current)
	}, [isMobile])

	return (
		<SidebarContext.Provider
			value={{
				isMobile,
				open,
				setOpen,
				openMobile,
				setOpenMobile,
				side,
				setSide,
				toggleSidebar,
			}}
		>
			<div
				style={
					{
						'--sidebar-width': SIDEBAR_WIDTH,
						'--sidebar-width-mobile': SIDEBAR_WIDTH_MOBILE,
						...style,
					} as React.CSSProperties
				}
				className={cn('flex min-h-screen w-full bg-background', className)}
			>
				{children}
			</div>
		</SidebarContext.Provider>
	)
}

export function Sidebar({
	children,
	className,
	side = 'left',
}: React.ComponentProps<'div'> & { side?: 'left' | 'right' }) {
	const { isMobile, open, openMobile, setOpenMobile, setSide } = useSidebar()

	React.useEffect(() => {
		setSide(side)
	}, [setSide, side])

	if (isMobile) {
		return (
			<Sheet open={openMobile} onOpenChange={setOpenMobile}>
				<SheetContent
					side={side}
					className={cn(
						'w-[var(--sidebar-width-mobile)] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden',
						side === 'left'
							? 'border-r border-sidebar-border'
							: 'border-l border-sidebar-border',
						className,
					)}
				>
					<SheetTitle className="sr-only">Sidebar</SheetTitle>
					<div className="flex h-full flex-col">{children}</div>
				</SheetContent>
			</Sheet>
		)
	}

	if (!open) {
		return null
	}

	return (
		<aside
			className={cn(
				'h-screen w-[var(--sidebar-width)] shrink-0 bg-sidebar text-sidebar-foreground',
				side === 'left'
					? 'border-r border-sidebar-border'
					: 'order-last border-l border-sidebar-border',
				className,
			)}
		>
			<div
				className={cn(
					'fixed top-0 flex h-screen min-h-0 w-[var(--sidebar-width)] flex-col overflow-hidden bg-sidebar',
					side === 'left'
						? 'left-0 border-r border-sidebar-border'
						: 'right-0 border-l border-sidebar-border',
				)}
			>
				{children}
			</div>
		</aside>
	)
}

export function SidebarInset({
	children,
	className,
}: React.ComponentProps<'main'>) {
	const { isMobile, open } = useSidebar()

	return (
		<main
			className={cn(
				'flex min-h-screen flex-1 flex-col',
				!isMobile && open ? 'w-[calc(100%-var(--sidebar-width))]' : 'w-full',
				className,
			)}
		>
			{children}
		</main>
	)
}

export function SidebarHeader({
	className,
	...props
}: React.ComponentProps<'div'>) {
	return <div className={cn('shrink-0 border-b border-sidebar-border p-4', className)} {...props} />
}

export const SidebarContent = React.forwardRef<
	HTMLDivElement,
	React.ComponentProps<'div'>
>(({ className, ...props }, ref) => {
	return (
			<div
				ref={ref}
				className={cn(
					'h-full min-h-0 flex-1 overflow-y-auto overscroll-contain p-4',
					className,
				)}
				{...props}
		/>
	)
})
SidebarContent.displayName = 'SidebarContent'

export function SidebarFooter({
	className,
	...props
}: React.ComponentProps<'div'>) {
	return (
		<div
			className={cn('relative z-20 shrink-0 border-t border-sidebar-border bg-sidebar p-4', className)}
			{...props}
		/>
	)
}

export function SidebarGroup({
	className,
	...props
}: React.ComponentProps<'section'>) {
	return <section className={cn('space-y-2', className)} {...props} />
}

export function SidebarGroupLabel({
	className,
	...props
}: React.ComponentProps<'div'>) {
	return (
		<div
			className={cn(
				'px-2 text-xs font-bold uppercase tracking-[0.24em] text-sidebar-foreground/60',
				className,
			)}
			{...props}
		/>
	)
}

export function SidebarGroupContent({
	className,
	...props
}: React.ComponentProps<'div'>) {
	return <div className={cn('space-y-1', className)} {...props} />
}

export function SidebarMenu({
	className,
	...props
}: React.ComponentProps<'ul'>) {
	return <ul className={cn('space-y-1', className)} {...props} />
}

export function SidebarMenuItem({
	className,
	...props
}: React.ComponentProps<'li'>) {
	return <li className={cn('list-none', className)} {...props} />
}

const sidebarMenuButtonVariants = cva(
	'flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring disabled:pointer-events-none disabled:opacity-50',
	{
		variants: {
			isActive: {
				true: 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm',
				false: 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
			},
			size: {
				default: 'min-h-12',
				sm: 'min-h-10 py-2.5',
			},
		},
		defaultVariants: {
			isActive: false,
			size: 'default',
		},
	},
)

export function SidebarMenuButton({
	asChild = false,
	isActive,
	size,
	className,
	...props
}: React.ComponentProps<'button'> &
	VariantProps<typeof sidebarMenuButtonVariants> & { asChild?: boolean }) {
	const Comp = asChild ? Slot : 'button'
	return (
		<Comp
			className={cn(sidebarMenuButtonVariants({ isActive, size }), className)}
			{...props}
		/>
	)
}

export function SidebarMenuSub({
	className,
	...props
}: React.ComponentProps<'ul'>) {
	return (
		<ul
			className={cn('ml-6 space-y-1 border-l border-sidebar-border pl-3', className)}
			{...props}
		/>
	)
}

export function SidebarMenuSubItem({
	className,
	...props
}: React.ComponentProps<'li'>) {
	return <li className={cn('list-none', className)} {...props} />
}

export function SidebarMenuSubButton({
	asChild = false,
	isActive,
	className,
	...props
}: React.ComponentProps<'a'> & { asChild?: boolean; isActive?: boolean }) {
	const Comp = asChild ? Slot : 'a'
	return (
		<Comp
			className={cn(
				'flex w-full items-center rounded-xl px-3 py-2 text-sm transition-colors',
				isActive
					? 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground'
					: 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
				className,
			)}
			{...props}
		/>
	)
}

export function SidebarTrigger({
	className,
	onClick,
	...props
}: React.ComponentProps<typeof Button>) {
	const { side, toggleSidebar } = useSidebar()

	return (
		<Button
			variant="ghost"
			size="icon"
			className={cn('rounded-full', side === 'right' && 'ml-auto', className)}
			onClick={(event) => {
				onClick?.(event)
				toggleSidebar()
			}}
			{...props}
		>
			<PanelLeft className="h-5 w-5" />
			<span className="sr-only">Toggle sidebar</span>
		</Button>
	)
}
