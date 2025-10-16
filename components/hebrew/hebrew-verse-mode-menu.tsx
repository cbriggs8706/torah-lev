'use client'

import { useState } from 'react'
import VerseRevealGame from './hebrew-verse-revelator'
import VerseVanisher from './hebrew-verse-vanisher'
import VerseFillInTheBlank from './hebrew-verse-fill'
import MemorizeControls from '../memorize-controls'
import { Button } from '../ui/button'

type Props = {
	verses: any[]
	onBack: () => void
}

export default function HebrewMemorizeModeMenu({ verses, onBack }: Props) {
	const [mode, setMode] = useState<string | null>(null)

	if (mode === 'reveal')
		return <VerseRevealGame verses={verses} onBack={() => setMode(null)} />

	if (mode === 'vanish')
		return <VerseVanisher verses={verses} onBack={() => setMode(null)} />

	if (mode === 'fill')
		return <VerseFillInTheBlank verses={verses} onBack={() => setMode(null)} />

	return (
		<div className="min-h-screen w-full p-8 bg-gradient-to-b from-white to-gray-100 flex flex-col">
			<h2 className="text-2xl font-bold mb-6 text-center">
				Choose Memorization Mode
			</h2>

			<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
				<ModeButton
					title="Reveal"
					desc="Tap to reveal phrase by phrase"
					onClick={() => setMode('reveal')}
				/>
				<ModeButton
					title="Vanisher"
					desc="Hide letters or words progressively"
					onClick={() => setMode('vanish')}
				/>
				<ModeButton
					title="Fill in the Blank"
					desc="Select missing words"
					onClick={() => setMode('fill')}
				/>
				<ModeButton
					title="Word Order"
					desc="Rearrange the verse words"
					disabled
				/>
				<ModeButton
					title="Listen & Repeat"
					desc="Play audio recordings"
					disabled
				/>
				<ModeButton title="Quiz" desc="Multiple-choice recall test" disabled />
				<ModeButton title="Context" desc="Read commentary or notes" disabled />
			</div>

			{/* Bottom Bar with Back button only */}
			<MemorizeControls
				fontSize={0}
				onFontChange={() => {}}
				onBack={onBack}
				showFontButtons={false}
			/>
		</div>
	)
}

function ModeButton({
	title,
	desc,
	onClick,
	disabled,
}: {
	title: string
	desc: string
	onClick?: () => void
	disabled?: boolean
}) {
	return (
		<button
			onClick={onClick}
			disabled={disabled}
			className={`border rounded-lg p-4 text-left transition ${
				disabled
					? 'opacity-50 cursor-not-allowed'
					: 'hover:bg-blue-50 hover:border-blue-400'
			}`}
		>
			<h3 className="font-semibold text-lg mb-1">{title}</h3>
			<p className="text-sm text-gray-600">{desc}</p>
		</button>
	)
}
