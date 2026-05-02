'use client'

import { Globe } from 'lucide-react'

import { cn } from '@/lib/utils'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import type { SidebarLocale } from '@/types/sidebar'

const localeOptions: { value: SidebarLocale; label: string }[] = [
	{ value: 'en', label: 'English' },
	{ value: 'es', label: 'Español' },
	{ value: 'he', label: 'עברית' },
	{ value: 'el', label: 'Ελληνικά' },
]

const HEBREW_CHARACTER_REGEX = /[\u0590-\u05FF]/

function containsHebrew(text: string) {
	return HEBREW_CHARACTER_REGEX.test(text)
}

export function SidebarLocaleSwitcher({
	value,
	label,
	onChange,
	isHebrewUi = false,
}: {
	value: SidebarLocale
	label: string
	onChange: (locale: SidebarLocale) => void
	isHebrewUi?: boolean
}) {
	const selectedOption = localeOptions.find((option) => option.value === value)

	return (
		<div className="space-y-2">
			<p
				className={cn(
					'flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-sidebar-foreground/60',
					isHebrewUi && 'text-sm tracking-[0.12em]',
					containsHebrew(label) && 'font-cardo',
				)}
			>
				<Globe className="h-3.5 w-3.5" />
				{label}
			</p>

			<Select value={value} onValueChange={(nextValue) => onChange(nextValue as SidebarLocale)}>
				<SelectTrigger
					className={cn(
						'h-11 rounded-xl border-sidebar-border bg-sidebar-accent/60 text-sidebar-foreground',
						isHebrewUi && 'h-12 text-lg',
						selectedOption && containsHebrew(selectedOption.label) && 'font-cardo',
					)}
				>
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{localeOptions.map((option) => (
						<SelectItem
							key={option.value}
							value={option.value}
							className={cn(containsHebrew(option.label) && 'font-cardo')}
						>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	)
}
