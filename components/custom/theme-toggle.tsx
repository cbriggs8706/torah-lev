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
			className="h-10 rounded-full border-sidebar-border/80 bg-sidebar/70 px-3 text-sidebar-foreground shadow-none backdrop-blur-sm hover:bg-sidebar-accent"
		>
			{isDark ? <SunMedium className="size-4" /> : <MoonStar className="size-4" />}
			<span className="font-medium">{isDark ? 'Light' : 'Dark'} mode</span>
		</Button>
	)
}
