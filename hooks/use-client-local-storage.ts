'use client'

import { useState, useEffect } from 'react'

export function useClientLocalStorage<T>(
	key: string,
	defaultValue: T
): [T, (v: T) => void, boolean] {
	const [value, setValue] = useState<T>(defaultValue)
	const [hydrated, setHydrated] = useState(false)

	// Load once after hydration — asynchronously
	useEffect(() => {
		const saved = localStorage.getItem(key)

		queueMicrotask(() => {
			if (saved !== null) {
				try {
					// Attempt JSON.parse
					setValue(JSON.parse(saved))
				} catch {
					// Fallback: raw string (legacy data)
					setValue(saved as T)
				}
			}
			setHydrated(true)
		})
	}, [key])

	// Persist updates back to storage (always JSON)
	useEffect(() => {
		if (hydrated) {
			localStorage.setItem(key, JSON.stringify(value))
		}
	}, [hydrated, key, value])

	return [value, setValue, hydrated]
}
