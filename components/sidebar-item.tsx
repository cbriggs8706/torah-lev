'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = {
	label: string
	iconSrc: string
	href: string
	onClick?: () => void
	className?: string
}

export const SidebarItem = ({
	label,
	iconSrc,
	href,
	onClick,
	className,
}: Props) => {
	const pathname = usePathname()
	const active = pathname === href

	return (
		<Button
			variant={active ? 'sidebarOutline' : 'sidebar'}
			className={cn('justify-start h-[52px]', className)}
			onClick={onClick}
			asChild
		>
			<Link href={href}>
				<Image
					src={iconSrc}
					alt={label}
					className="mr-5"
					height={32}
					width={32}
				/>
				{label}
			</Link>
		</Button>
	)
}
