import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function capitalize(str: string): string {
	if (!str) return ''
	return str.charAt(0).toUpperCase() + str.slice(1)
}

export function formatTypeLabel(type: string): string {
	// normalize raw enum to spaced lowercase words
	let label = type.replace(/[-_]+/g, ' ').toLowerCase().trim()

	// If it already ends in a plural-like ending, don’t change it.
	const alreadyPlural =
		label.endsWith('s') ||
		label.endsWith('im') || // Hebrew plural (Nevi'im, Ketuvim)
		label.endsWith('ot') || // Hebrew plural (Parashot, etc.)
		label.endsWith('oth')

	if (!alreadyPlural) {
		// Very simple pluralization rule (can be expanded later)
		if (label.endsWith('y')) {
			label = label.slice(0, -1) + 'ies'
		} else {
			label = label + 's'
		}
	}

	// Convert to Title Case
	return label.replace(/\b\w/g, (c) => c.toUpperCase())
}
