'use client'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { useId } from 'react'

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
	const uid = useId().replace(/:/g, '')

	// Internal canvas (kept wider than tall for a nice aspect)
	const vbW = 400
	const vbH = 200

	// Parchment window
	const parchmentX = 70
	const parchmentY = 28
	const parchmentW = 260
	const parchmentH = 144
	const clipPathId = `parchmentClip-${uid}`
	const gradientId = `parchmentShade-${uid}`
	const repeatedText = Array.from({ length: 24 })
		.map(() => text)
		.join('')
	const copyGap = fontSize * 0.55
	const copyWidth = repeatedText.length * fontSize * 0.68 + copyGap
	const textY = parchmentY + parchmentH / 2 + fontSize * 0.08

	return (
		<div className={clsx('flex items-center justify-center', className)}>
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
					<linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
						<stop offset="0%" stopColor="rgba(0,0,0,0.06)" />
						<stop offset="12%" stopColor="rgba(0,0,0,0)" />
						<stop offset="88%" stopColor="rgba(0,0,0,0)" />
						<stop offset="100%" stopColor="rgba(0,0,0,0.06)" />
					</linearGradient>
					<clipPath id={clipPathId}>
						<rect
							x={parchmentX + 2}
							y={parchmentY + 2}
							width={parchmentW - 4}
							height={parchmentH - 4}
							rx="8"
						/>
					</clipPath>
				</defs>
				<rect
					x={parchmentX}
					y={parchmentY}
					width={parchmentW}
					height={parchmentH}
					rx="10"
					fill={`url(#${gradientId})`}
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

				{/* Text marquee inside parchment */}
				<g clipPath={`url(#${clipPathId})`}>
					{/* Background tint for depth */}
					<rect
						x={parchmentX + 2}
						y={parchmentY + 2}
						width={parchmentW - 4}
						height={parchmentH - 4}
						fill="#f9f1d6"
					/>

					<motion.g
						initial={{ x: -copyWidth }}
						animate={{ x: 0 }}
						transition={{
							duration: speedSec,
							ease: 'linear',
							repeat: Infinity,
						}}
					>
						{[0, 1].map((copyIndex) => (
							<text
								key={copyIndex}
								x={parchmentX + 8 + copyIndex * copyWidth}
								y={textY}
								direction="rtl"
								textAnchor="start"
								lengthAdjust="spacingAndGlyphs"
								style={{
									fontFamily:
										"var(--font-frank), 'Frank Ruhl Libre', 'Noto Serif Hebrew', 'Times New Roman', serif",
									fontSize,
									lineHeight: 1,
									letterSpacing: '0.02em',
									fill: '#5a3e28',
									opacity: 0.95,
									unicodeBidi: 'plaintext',
									dominantBaseline: 'middle',
									textRendering: 'geometricPrecision',
								}}
							>
								{repeatedText}
							</text>
						))}
					</motion.g>
				</g>
			</svg>
		</div>
	)
}
