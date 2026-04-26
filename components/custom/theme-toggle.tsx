'use client'

import { MoonStar, SunMedium } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'

export function ThemeToggle() {
	const { resolvedTheme, setTheme } = useTheme()
	const isDark = resolvedTheme === 'dark'

	return (
		<Button
			type="button"
			variant="outline"
			size="sm"
			onClick={() => setTheme(isDark ? 'light' : 'dark')}
			className="h-11 rounded-full border-[color:color-mix(in_srgb,var(--chart-2)_26%,var(--sidebar-border))] bg-sidebar/72 px-4 text-sidebar-foreground shadow-none backdrop-blur-sm hover:bg-sidebar-accent"
		>
			{isDark ? <SunMedium className="size-4" /> : <MoonStar className="size-4" />}
			<span className="text-[0.98rem] font-medium tracking-[-0.01em]">{isDark ? 'Light' : 'Dark'} mode</span>
		</Button>
	)
}
