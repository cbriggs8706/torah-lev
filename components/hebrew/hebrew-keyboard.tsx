'use client'

import { useEffect, useState } from 'react'

type Props = {
	onEnter?: () => void
	className?: string
	onKeyPress: (key: string) => void
}

// Hebrew consonants (with final forms)
const HEBREW_CONSONANTS = [
	'־',
	'0',
	'9',
	'8',
	'7',
	'6',
	'5',
	'4',
	'3',
	'2',
	'1',
	'[',
	'פ',
	'ֹ',
	'ִ',
	'ע',
	'י',
	'ת',
	'ר',
	'ֶ',
	'ו',
	'ק',
	"'",
	'ְ',
	'ל',
	'כ',
	'ח',
	'ה',
	'ג',
	'ט',
	'ד',
	'ס',
	'ַ',
	'',
	'/',
	'.',
	'א',
	'מ',
	'נ',
	'ב',
	'שׁ',
	'שׂ',
	'צ',
	'ז',
]

const HEBREW_SHIFT = [
	'_',
	'(',
	')',
	'֝',
	'֬',
	'֔',
	'֞',
	'֜',
	'֨',
	'֘',
	'!',
	'{',
	'פּ',
	'וֹ',
	'}',
	'ֻ',
	'יּ',
	'תּ',
	'רּ',
	'ֵ',
	'וּ',
	'קּ',
	'"',
	'״',
	'לּ',
	'כּ',
	'וַיּ',
	'הּ',
	'גּ',
	'טּ',
	'דּ',
	'סּ',
	'ָ',
	'|',
	'?',
	'ּ',
	',',
	'מּ',
	'נּ',
	'בּ',
	'שּׁ',
	'שּׂ',
	'צּ',
	'זּ',
]

const HEBREW_ALT = [
	'ֿ',
	'֯',
	'֓',
	'֕',
	'֡',
	'֟',
	'֩',
	'֠',
	'֙',
	'֮',
	'֗',
	'֔',
	'ף',
	'ֳ',
	'ֽ',
	'֒',
	'',
	'',
	'',
	'ֱ',
	'',
	'',
	'ׄ',
	'׃',
	'',
	'ך',
	'',
	'̊',
	'•',
	'',
	'',
	'',
	'ֲ',
	'',
	'״',
	'̈',
	'֫',
	'ם',
	'ן',
	'',
	'ש',
	'',
	'ץ',
	'',
]

const HEBREW_NAMES: Record<string, string> = {
	א: 'Alef',
	ב: 'Vet',
	ג: 'Ghimel',
	ד: 'Dhalet',
	ה: 'Hey',
	ו: 'Vav',
	ז: 'Zayin',
	ח: 'Chet',
	ט: 'Tet',
	י: 'Yod',
	כ: 'Khaf',
	ך: 'Khaf Sofit',
	ל: 'Lamed',
	מ: 'Mem',
	ם: 'Mem Sofit',
	נ: 'Nun',
	ן: 'Nun Sofit',
	ס: 'Samekh',
	ע: 'Ayin',
	פ: 'Fe',
	ף: 'Fe Sofit',
	צ: 'Tsadi',
	ץ: 'Tsadi Sofit',
	ק: 'Qof',
	ר: 'Resh',
	שׁ: 'Shin',
	שׂ: 'Sin',
	ש: 'Shin',
	ת: 'Thav',
	בּ: 'Bet',
	גּ: 'Gimel',
	דּ: 'Dalet',
	הּ: 'Hey',
	וּ: 'Shuruk',
	וֹ: 'Holam Male',
	זּ: 'Zayin',
	וַיּ: 'Va-yee',
	טּ: 'Tet',
	יּ: 'Yod',
	כּ: 'Kaf',
	ךּ: 'Kaf Sofit',
	לּ: 'Lamed',
	מּ: 'Mem',
	נּ: 'Nun',
	סּ: 'Samekh',
	פּ: 'Pe',
	ףּ: 'Pe Sofit',
	צּ: 'Tsadi',
	קּ: 'Qof',
	רּ: 'Resh',
	שּׁ: 'Shin',
	שּׂ: 'Sin',
	תּ: 'Tav',
	'ְ': 'Shva',
	'ֱ': 'Hatef Segol',
	'ֲ': 'Hatef Patach',
	'ֳ': 'Hatef Kamatz',
	'ַ': 'Patach',
	'ָ': 'Kamatz',
	'ֶ': 'Segol',
	'ֵ': 'Tzere',
	'ִ': 'Hiriq',
	'ֹ': 'Holam',
	'ֻ': 'Qubutz',
	'ּ': 'Dagesh',
	'ֿ': 'Rafe',
	'ׄ': 'Masora Circle',
	'׃': 'Sof Pasuq',
	'״': 'Gershayim',
	"'": 'Geresh',
	'־': 'Maqaf',
	'֑': 'Etnachta',
	'֒': 'Segolta',
	'֓': 'Shalshelet',
	'֔': 'Zaqef Qaton',
	'֕': 'Zaqef Gadol',
	'֖': 'Tipecha',
	'֗': 'Revia',
	'֘': 'Zarqa',
	'֙': 'Pashta',
	'֚': 'Yetiv',
	'֛': 'Tevir',
	'֜': 'Geresh',
	'֝': 'Geresh Muqdam',
	'֞': 'Gershayim',
	'֟': 'Qarney Farah',
	'֠': 'Telisha Gedolah',
	'֡': 'Pazer',
	'֢': 'Atnach Hafukh', // Rare
	'֣': 'Munach',
	'֤': 'Mahpach',
	'֥': 'Merkha',
	'֦': 'Merkha Kefula',
	'֧': 'Darga',
	'֨': 'Qadma',
	'֩': 'Telisha Qetana',
	'֪': 'Yerach ben Yomo',
	'֫': 'Galgal',
	'֬': 'Ole',
	'֭': 'Iluy', // Rare
	'֮': 'Dechi',
	'֯': 'Karne Parah (variant)',
	'.': 'Period',
	',': 'Comma',
	'?': 'Question Mark',
	'!': 'Exclamation Point',
}

// Track the last focused input field globally
let lastFocusedInput: HTMLInputElement | null = null

export default function HebrewKeyboard({
	onEnter,
	className = '',
	onKeyPress,
}: Props) {
	const [shiftActive, setShiftActive] = useState(false)
	const [altActive, setAltActive] = useState(false)

	function insertAtCaret(input: HTMLInputElement, char: string) {
		const { selectionStart, selectionEnd, value } = input
		const newValue =
			value.slice(0, selectionStart ?? 0) +
			char +
			value.slice(selectionEnd ?? 0)
		const newPos = (selectionStart ?? 0) + char.length

		input.value = newValue
		input.setSelectionRange(newPos, newPos)
		input.dispatchEvent(new Event('input', { bubbles: true }))
		input.focus()
	}

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

	function toggleShift() {
		setShiftActive((prev) => {
			if (!prev) setAltActive(false)
			return !prev
		})
	}

	function toggleAlt() {
		setAltActive((prev) => {
			if (!prev) setShiftActive(false)
			return !prev
		})
	}

	const keySet = shiftActive
		? HEBREW_SHIFT
		: altActive
		? HEBREW_ALT
		: HEBREW_CONSONANTS

	return (
		<div
			className={`flex flex-col gap-3 text-4xl p-4 bg-gray-100 rounded-lg shadow rtl ${className}`}
			dir="rtl"
			style={{ fontFamily: 'Times New Roman, serif' }}
		>
			{/* Key Grid */}
			<div className="grid grid-cols-11 gap-2">
				{keySet.map((char, index) => (
					<button
						key={`${char}-${index}`}
						tabIndex={-1}
						disabled={!char}
						title={char ? HEBREW_NAMES[char] || '' : ''}
						className={`text-center leading-none transition rounded shadow
    ${
			char
				? 'bg-white hover:bg-sky-100 active:bg-sky-200'
				: 'bg-transparent cursor-default shadow-none opacity-0 select-none'
		}
    w-6 h-10 text-3xl p-0
    sm:w-10 sm:h-14 sm:text-3xl sm:p-2
    md:w-12 md:h-16 md:text-4xl md:p-3
  `}
						dir="rtl"
						onClick={(e) => {
							e.preventDefault()
							e.stopPropagation()
							if (char) {
								onKeyPress(char)
								if (shiftActive) setShiftActive(false)
								if (altActive) setAltActive(false)
							}
						}}
					>
						<span dir="rtl">{char || ''}</span>
					</button>
				))}
			</div>

			{/* Modifier Row: Shift / Alt / Space */}
			<div className="flex gap-2 justify-center text-lg md:text-2xl">
				<button
					onClick={toggleShift}
					className={`w-1/4 py-3 border rounded shadow ${
						shiftActive ? 'bg-sky-300' : 'bg-gray-100 hover:bg-gray-200'
					}`}
				>
					Shift
				</button>
				<button
					onClick={() => {
						onKeyPress(' ')
						if (shiftActive) setShiftActive(false)
						if (altActive) setAltActive(false)
					}}
					className="w-1/2 py-3 border rounded shadow bg-gray-100 hover:bg-gray-200"
				>
					Space
				</button>
				<button
					onClick={toggleAlt}
					className={`w-1/4 py-3 border rounded shadow ${
						altActive ? 'bg-sky-300' : 'bg-gray-100 hover:bg-gray-200'
					}`}
				>
					Alt/Opt
				</button>
			</div>

			{/* Bottom Row: Backspace / Submit */}
			<div className="flex gap-2 justify-center text-lg md:text-2xl">
				<button
					tabIndex={-1}
					className="w-1/2 py-3 bg-green-200 hover:bg-green-300 rounded shadow"
					onClick={(e) => {
						e.preventDefault()
						e.stopPropagation()
						lastFocusedInput?.focus()
						onEnter?.()
					}}
				>
					✔️ Submit
				</button>
				<button
					tabIndex={-1}
					className="w-1/2 py-3 bg-red-100 hover:bg-red-200 rounded shadow"
					onClick={(e) => {
						e.preventDefault()
						e.stopPropagation()
						onKeyPress('\b') // backspace
					}}
				>
					→ Backspace
				</button>
			</div>
		</div>
	)
}
