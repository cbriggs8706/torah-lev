'use client'
import { motion } from 'framer-motion'
import clsx from 'clsx'

type Props = {
	size?: number // overall width in px
	speedSec?: number // one full pass duration
	fontSize?: number // Hebrew text size in px
	text?: string // the Hebrew string to scroll
	className?: string
}

export default function TorahScrollLoaderRTL({
	size = 360,
	speedSec = 50,
	fontSize = 72,
	text = 'וַיְהִי • ',
	className,
}: Props) {
	// Internal canvas (kept wider than tall for a nice aspect)
	const vbW = 400
	const vbH = 200

	// Parchment window
	const parchmentX = 70
	const parchmentY = 28
	const parchmentW = 260
	const parchmentH = 144
	const repeatedText = Array.from({ length: 24 })
		.map(() => text)
		.join('')

	return (
		<div
			className={clsx('flex items-center justify-center', className)}
			style={{ position: 'relative', width: size, height: (size * vbH) / vbW }}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox={`0 0 ${vbW} ${vbH}`}
				width={size}
				height={(size * vbH) / vbW}
				role="img"
				aria-label="Loading… Torah scroll"
			>
				{/* Shadow */}
				<ellipse
					cx={vbW / 2}
					cy={vbH - 6}
					rx={vbW * 0.28}
					ry="6"
					fill="rgba(0,0,0,0.08)"
				/>

				{/* Left roller */}
				<g>
					<circle cx="36" cy="22" r="8" fill="#7a5537" />
					<circle cx="36" cy="178" r="8" fill="#7a5537" />
					<rect x="30" y="22" width="12" height="156" rx="6" fill="#8e6542" />
					<rect x="24" y="38" width="24" height="22" rx="6" fill="#b38760" />
					<rect x="24" y="140" width="24" height="22" rx="6" fill="#b38760" />
				</g>

				{/* Right roller */}
				<g>
					<circle cx="364" cy="22" r="8" fill="#7a5537" />
					<circle cx="364" cy="178" r="8" fill="#7a5537" />
					<rect x="358" y="22" width="12" height="156" rx="6" fill="#8e6542" />
					<rect x="352" y="38" width="24" height="22" rx="6" fill="#b38760" />
					<rect x="352" y="140" width="24" height="22" rx="6" fill="#b38760" />
				</g>

				{/* Parchment base */}
				<rect
					x={parchmentX}
					y={parchmentY}
					width={parchmentW}
					height={parchmentH}
					rx="10"
					fill="#f9f1d6"
					stroke="#d9be8a"
					strokeWidth="3"
				/>

				{/* Side shading */}
				<defs>
					<linearGradient id="parchmentShade" x1="0" y1="0" x2="1" y2="0">
						<stop offset="0%" stopColor="rgba(0,0,0,0.06)" />
						<stop offset="12%" stopColor="rgba(0,0,0,0)" />
						<stop offset="88%" stopColor="rgba(0,0,0,0)" />
						<stop offset="100%" stopColor="rgba(0,0,0,0.06)" />
					</linearGradient>
				</defs>
				<rect
					x={parchmentX}
					y={parchmentY}
					width={parchmentW}
					height={parchmentH}
					rx="10"
					fill="url(#parchmentShade)"
					pointerEvents="none"
				/>

				{/* Top/bottom caps */}
				<rect
					x={parchmentX - 10}
					y={parchmentY - 2}
					width={parchmentW + 20}
					height="6"
					rx="3"
					fill="#e6d6ab"
				/>
				<rect
					x={parchmentX - 10}
					y={parchmentY + parchmentH - 4}
					width={parchmentW + 20}
					height="6"
					rx="3"
					fill="#e6d6ab"
				/>
			</svg>

			<div
				aria-hidden="true"
				style={{
					position: 'absolute',
					left: `${((parchmentX + 4) / vbW) * 100}%`,
					top: `${((parchmentY + 4) / vbH) * 100}%`,
					width: `${((parchmentW - 8) / vbW) * 100}%`,
					height: `${((parchmentH - 8) / vbH) * 100}%`,
					overflow: 'hidden',
					display: 'flex',
					alignItems: 'center',
					pointerEvents: 'none',
				}}
			>
				<motion.div
					initial={{ x: '-50%' }}
					animate={{ x: '0%' }}
					transition={{
						duration: speedSec,
						ease: 'linear',
						repeat: Infinity,
					}}
					style={{
						display: 'flex',
						alignItems: 'center',
						whiteSpace: 'nowrap',
						willChange: 'transform',
					}}
				>
					{[0, 1].map((copyIndex) => (
						<span
							key={copyIndex}
							dir="rtl"
							lang="he"
							style={{
								flexShrink: 0,
								paddingRight: copyIndex === 0 ? fontSize * 0.55 : 0,
								fontFamily:
									"var(--font-frank), 'Frank Ruhl Libre', 'Noto Serif Hebrew', 'Times New Roman', serif",
								fontSize,
								lineHeight: 1,
								letterSpacing: '0.02em',
								color: '#5a3e28',
								opacity: 0.95,
								unicodeBidi: 'isolate',
								WebkitFontSmoothing: 'antialiased',
								textRendering: 'optimizeLegibility',
							}}
						>
							{repeatedText}
						</span>
					))}
				</motion.div>
			</div>
		</div>
	)
}
