'use client'

import { Button } from './ui/button'

type ControlButton = {
	label: string
	onClick: () => void
	variant?: 'primary' | 'secondary'
	disabled?: boolean
}

type Props = {
	fontSize: number
	onFontChange: (delta: number) => void
	statusText?: string
	onBack: () => void
	showFontButtons?: boolean // 👈 NEW prop
	buttons?: ControlButton[]
	children?: React.ReactNode
}

export default function MemorizeControls({
	fontSize,
	onFontChange,
	statusText,
	onBack,
	showFontButtons = true, // 👈 default true
	buttons = [],
	children,
}: Props) {
	return (
		<div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg py-3 px-4 z-50">
			<div className="flex flex-wrap justify-center items-center gap-3">
				{/* Back button (always visible) */}
				<Button onClick={onBack} variant="primaryOutline" className="mr-2">
					← Back
				</Button>

				{/* Font size controls — toggled by showFontButtons */}
				{showFontButtons && (
					<div className="flex items-center gap-1">
						<Button onClick={() => onFontChange(-2)} variant="super">
							A−
						</Button>
						<span className="text-sm text-gray-600">Font</span>
						<Button onClick={() => onFontChange(2)} variant="super">
							A+
						</Button>
					</div>
				)}

				{/* Custom action buttons */}
				{buttons.map((b, i) => (
					<Button
						key={i}
						onClick={b.onClick}
						disabled={b.disabled}
						className={`px-5 py-3 rounded-lg font-semibold transition ${
							b.variant === 'primary'
								? 'bg-blue-600 text-white hover:bg-blue-700'
								: 'bg-gray-300 hover:bg-gray-400'
						} ${b.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
					>
						{b.label}
					</Button>
				))}

				{/* Custom elements like “Reshuffle” button */}
				{children && <div className="flex items-center">{children}</div>}

				{/* Optional status text */}
				{statusText && (
					<div className="text-sm text-gray-500 ml-2 whitespace-nowrap">
						{statusText}
					</div>
				)}
			</div>
		</div>
	)
}
