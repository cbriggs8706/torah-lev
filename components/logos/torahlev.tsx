export type LogoProps = {
	/**
	 * Overall size in pixels. You can also override with Tailwind classes.
	 */
	size?: number
	/**
	 * Outline or solid variant.
	 */
	variant?: 'solid' | 'outline'
	/**
	 * Optional accessible title for screen readers.
	 */
	title?: string
	/**
	 * Additional classes (e.g., `text-rose-600` to set color via currentColor).
	 */
	className?: string
}

/**
 * Simple heart logo as an SVG React component.
 *
 * Color follows `currentColor`, so set it with Tailwind (e.g., `text-rose-600`).
 */
export function Logo({
	size = 32,
	variant = 'solid',
	title = 'Logo',
	className = '',
}: LogoProps) {
	const common = {
		width: size,
		height: size,
		viewBox: '0 0 24 24',
		xmlns: 'http://www.w3.org/2000/svg',
		role: 'img',
		'aria-label': title,
		className,
	} as const

	if (variant === 'outline') {
		return (
			<svg
				{...common}
				fill="none"
				stroke="currentColor"
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" />
			</svg>
		)
	}

	// solid
	return (
		<svg {...common} fill="currentColor">
			<path d="M12.001 4.529c2.35-2.355 6.153-2.355 8.504 0 2.352 2.355 2.352 6.171 0 8.526l-7.096 7.108a2 2 0 0 1-2.818 0L3.495 13.055c-2.352-2.355-2.352-6.171 0-8.526 2.351-2.355 6.153-2.355 8.504 0l.002 0Z" />
		</svg>
	)
}

export default Logo

/*
Usage examples:

import { Logo } from '@/components/logo'

// Solid, 36px, rose color
<Logo size={36} className="text-rose-600" />

// Outline variant, inherits text color, 28px
<Logo variant="outline" size={28} className="text-gray-900" />
*/
