export const Ribbon = ({ rank }: { rank: number }) => {
	const colors: Record<number, { from: string; to: string; text: string }> = {
		1: { from: '#fde047', to: '#facc15', text: '#92400e' }, // Gold
		2: { from: '#e5e7eb', to: '#9ca3af', text: '#1f2937' }, // Silver
		3: { from: '#f59e0b', to: '#b45309', text: '#fff' }, // Bronze
	}

	const defaultColor = { from: '#38bdf8', to: '#0284c7', text: '#fff' }
	const { from, to, text } = colors[rank] ?? defaultColor

	const gradientId = `medal-grad-${rank}-${Math.random()
		.toString(36)
		.slice(2, 7)}`

	return (
		<div className="relative w-12 h-14 flex items-center justify-center">
			<svg viewBox="0 0 36 36" className="absolute inset-0 w-full h-full">
				<defs>
					<linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
						<stop offset="0%" stopColor={from} />
						<stop offset="100%" stopColor={to} />
					</linearGradient>
				</defs>

				{/* Ribbon Left */}
				<path d="M18 8l-7-8H0l14 17l11.521-4.75z" fill="#55ACEE" />

				{/* Ribbon Right */}
				<path d="M25 0l-7 8l5.39 7.312l1.227-1.489L36 0z" fill="#3B88C3" />

				{/* Medal Circle (slightly larger scale) */}
				{/* <g transform="translate(-4, -7) scale(1.35)"> */}
				<g>
					<path
						d="M23.205 16.026c.08-.217.131-.448.131-.693a2 2 0 0 0-2-2h-6.667a2 2 0 0 0-2 2c0 .245.05.476.131.693c-3.258 1.826-5.464 5.307-5.464 9.307C7.335 31.224 12.111 36 18.002 36s10.667-4.776 10.667-10.667c0-4-2.206-7.481-5.464-9.307z"
						fill={`url(#${gradientId})`}
						stroke="rgba(0,0,0,0.15)"
						strokeWidth="1"
					/>
				</g>
			</svg>

			{/* Rank Number (centered) */}
			<span
				className="relative font-bold translate-y-[10px]"
				style={{
					color: text,
					fontSize: rank >= 100 ? '0.75rem' : rank >= 10 ? '0.9rem' : '1.1rem',
				}}
			>
				{rank}
			</span>
		</div>
	)
}
