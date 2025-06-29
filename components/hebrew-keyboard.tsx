'use client'

import { useEffect } from 'react'

type Props = {
	onEnter?: () => void
	className?: string
}

// Hebrew consonants (with final forms)
const HEBREW_CONSONANTS = [
	'א',
	'ב',
	'ג',
	'ד',
	'ה',
	'ו',
	'ז',
	'ח',
	'ט',
	'י',
	'כ',
	'ך',
	'ל',
	'מ',
	'ם',
	'נ',
	'ן',
	'ס',
	'ע',
	'פ',
	'ף',
	'צ',
	'ץ',
	'ק',
	'ר',
	'ש',
	'ת',
]

// Track the last focused input field globally
let lastFocusedInput: HTMLInputElement | null = null

export default function HebrewKeyboard({ onEnter, className = '' }: Props) {
	useEffect(() => {
		// Track focus on any input element
		const handleFocus = (e: Event) => {
			const target = e.target as HTMLElement
			if (target.tagName === 'INPUT' && !target.hasAttribute('readonly')) {
				lastFocusedInput = target as HTMLInputElement
			}
		}

		window.addEventListener('focusin', handleFocus)
		return () => window.removeEventListener('focusin', handleFocus)
	}, [])

	// Handle physical keyboard input (optional enhancement)
	useEffect(() => {
		const handleKey = (e: KeyboardEvent) => {
			if (!lastFocusedInput || lastFocusedInput.readOnly) return

			const key = e.key
			if (HEBREW_CONSONANTS.includes(key)) {
				e.preventDefault()
				insertAtCaret(lastFocusedInput, key)
			} else if (key === 'Backspace') {
				e.preventDefault()
				deleteLastChar(lastFocusedInput)
			} else if (key === 'Enter' && onEnter) {
				e.preventDefault()
				onEnter()
			}
		}

		window.addEventListener('keydown', handleKey)
		return () => window.removeEventListener('keydown', handleKey)
	}, [onEnter])

	// Insert Hebrew letter at caret position
	function insertAtCaret(input: HTMLInputElement, char: string) {
		const { selectionStart, selectionEnd, value } = input
		const newValue =
			value.slice(0, selectionStart ?? 0) +
			char +
			value.slice(selectionEnd ?? 0)
		const newPos = (selectionStart ?? 0) + 1

		input.value = newValue
		input.setSelectionRange(newPos, newPos)
		input.dispatchEvent(new Event('input', { bubbles: true }))
		input.focus()
	}

	// Delete last character (backspace behavior)
	function deleteLastChar(input: HTMLInputElement) {
		const { selectionStart, selectionEnd, value } = input
		if (selectionStart === null || selectionEnd === null) return

		let newValue = value
		let newPos = selectionStart

		if (selectionStart !== selectionEnd) {
			newValue = value.slice(0, selectionStart) + value.slice(selectionEnd)
			newPos = selectionStart
		} else if (selectionStart > 0) {
			newValue = value.slice(0, selectionStart - 1) + value.slice(selectionEnd)
			newPos = selectionStart - 1
		}

		input.value = newValue
		input.setSelectionRange(newPos, newPos)
		input.dispatchEvent(new Event('input', { bubbles: true }))
		input.focus()
	}

	return (
		<div
			className={`flex flex-col gap-3 text-4xl p-4 bg-gray-100 rounded-lg shadow rtl ${className}`}
			dir="rtl"
			style={{ fontFamily: 'Times New Roman, serif' }}
		>
			{/* Hebrew Letter Buttons */}
			<div className="grid grid-cols-7 gap-2">
				{HEBREW_CONSONANTS.map((char) => (
					<button
						key={char}
						tabIndex={-1}
						className="p-3 bg-white rounded shadow hover:bg-blue-100 active:bg-blue-200"
						onClick={(e) => {
							e.preventDefault()
							e.stopPropagation()

							if (
								lastFocusedInput &&
								lastFocusedInput.tagName === 'INPUT' &&
								!lastFocusedInput.readOnly
							) {
								lastFocusedInput.focus()
								insertAtCaret(lastFocusedInput, char)
							}
						}}
					>
						{char}
					</button>
				))}
			</div>

			{/* Control Row: Backspace + Submit */}
			<div className="flex gap-2 justify-center text-2xl">
				<button
					tabIndex={-1}
					className="flex-1 py-3 bg-red-100 hover:bg-red-200 rounded shadow"
					onClick={(e) => {
						e.preventDefault()
						e.stopPropagation()

						if (
							lastFocusedInput &&
							lastFocusedInput.tagName === 'INPUT' &&
							!lastFocusedInput.readOnly
						) {
							lastFocusedInput.focus()
							deleteLastChar(lastFocusedInput)
						}
					}}
				>
					← מחיקה
				</button>

				<button
					tabIndex={-1}
					className="flex-1 py-3 bg-green-200 hover:bg-green-300 rounded shadow"
					onClick={(e) => {
						e.preventDefault()
						e.stopPropagation()

						if (lastFocusedInput) lastFocusedInput.focus()
						onEnter?.()
					}}
				>
					✔️ שלח
				</button>
			</div>
		</div>
	)
}
