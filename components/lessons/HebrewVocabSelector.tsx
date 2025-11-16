// components/lessons/HebrewVocabSelector.tsx
'use client'

import { useEffect, useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'

type HebrewVocabItem = {
	id: string
	heb: string
}

export function HebrewVocabSelector({
	value,
	onChange,
	disabled,
}: {
	value: string[]
	onChange: (ids: string[]) => void
	disabled?: boolean
}) {
	const [items, setItems] = useState<HebrewVocabItem[]>([])

	useEffect(() => {
		fetch('/api/vocab') // You can implement this easily
			.then((res) => res.json())
			.then(setItems)
	}, [])

	function toggle(id: string) {
		if (value.includes(id)) {
			onChange(value.filter((v) => v !== id))
		} else {
			onChange([...value, id])
		}
	}

	return (
		<div className="space-y-1">
			{items.map((v) => (
				<label key={v.id} className="flex items-center gap-2">
					<Checkbox
						checked={value.includes(v.id)}
						onCheckedChange={() => toggle(v.id)}
						disabled={disabled}
					/>
					<span>{v.heb}</span>
				</label>
			))}
		</div>
	)
}
