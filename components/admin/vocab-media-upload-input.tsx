'use client'

import type { ChangeEvent } from 'react'
import { useRef, useState } from 'react'
import { useNotify } from 'react-admin'
import { useFormContext, useWatch } from 'react-hook-form'

type Mode = 'replace' | 'append'

type Props = {
	source: string
	label: string
	accept: string
	mode: Mode
}

function getFolderFromPath(value?: string) {
	if (!value) return ''
	const normalized = value.trim().replace(/^\/+/, '')
	const parts = normalized.split('/')
	parts.pop()
	return parts.join('/')
}

export function VocabMediaUploadInput({
	source,
	label,
	accept,
	mode,
}: Props) {
	const inputRef = useRef<HTMLInputElement | null>(null)
	const notify = useNotify()
	const { setValue, control } = useFormContext()
	const [isUploading, setIsUploading] = useState(false)

	const sourceKey = useWatch({ control, name: 'sourceKey' }) as string | undefined
	const currentValue = useWatch({ control, name: source }) as string | undefined

	const handlePick = () => inputRef.current?.click()

	const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file) return

		const existingValue = currentValue ?? ''
		const existingLines = existingValue
			.split(/\r?\n/)
			.map((value) => value.trim())
			.filter(Boolean)
		const folder =
			getFolderFromPath(existingLines[0]) ||
			getFolderFromPath(existingValue) ||
			sourceKey ||
			'uploads'

		const formData = new FormData()
		formData.append('file', file)
		formData.append('folder', folder)

		setIsUploading(true)

		try {
			const response = await fetch('/api/vocab-media-upload', {
				method: 'POST',
				body: formData,
			})
			const result = await response.json()

			if (!response.ok) {
				throw new Error(result.error || 'Upload failed')
			}

			if (mode === 'append') {
				const nextValue = [...existingLines, result.storagePath].join('\n')
				setValue(source, nextValue, { shouldDirty: true, shouldTouch: true })
			} else {
				setValue(source, result.storagePath, {
					shouldDirty: true,
					shouldTouch: true,
				})
			}

			notify(`${label} uploaded`, { type: 'success' })
		} catch (error) {
			notify(error instanceof Error ? error.message : 'Upload failed', {
				type: 'error',
			})
		} finally {
			setIsUploading(false)
			event.target.value = ''
		}
	}

	return (
		<div style={{ marginTop: 8, marginBottom: 16 }}>
			<input
				ref={inputRef}
				type="file"
				accept={accept}
				onChange={handleChange}
				style={{ display: 'none' }}
			/>
			<button
				type="button"
				onClick={handlePick}
				disabled={isUploading}
				style={{
					padding: '8px 12px',
					border: '1px solid #c7c7c7',
					borderRadius: 6,
					background: '#fff',
					cursor: isUploading ? 'progress' : 'pointer',
				}}
			>
				{isUploading ? `Uploading ${label}...` : `Upload ${label}`}
			</button>
		</div>
	)
}
