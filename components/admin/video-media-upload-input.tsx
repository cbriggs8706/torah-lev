'use client'

import type { ChangeEvent } from 'react'
import { useRef, useState } from 'react'
import { useNotify, useRecordContext } from 'react-admin'
import { useFormContext, useWatch } from 'react-hook-form'

type Props = {
	source: string
	label: string
	accept: string
	kind: 'image' | 'audio'
}

function slugify(value?: string | null) {
	return (value || '')
		.toLowerCase()
		.replace(/[^\w]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '')
}

export function VideoMediaUploadInput({
	source,
	label,
	accept,
	kind,
}: Props) {
	const inputRef = useRef<HTMLInputElement | null>(null)
	const notify = useNotify()
	const record = useRecordContext()
	const { setValue, control } = useFormContext()
	const [isUploading, setIsUploading] = useState(false)

	const title = useWatch({ control, name: 'title' }) as string | undefined
	const type = useWatch({ control, name: 'type' }) as string | undefined

	const handlePick = () => inputRef.current?.click()

	const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file) return

		const folderParts = [
			'videos',
			slugify(type) || 'uncategorized',
			record?.id ? String(record.id) : slugify(title) || 'new',
			kind,
		]

		const formData = new FormData()
		formData.append('file', file)
		formData.append('kind', kind)
		formData.append('folder', folderParts.join('/'))

		setIsUploading(true)

		try {
			const response = await fetch('/api/video-media-upload', {
				method: 'POST',
				body: formData,
			})
			const result = await response.json()

			if (!response.ok) {
				throw new Error(result.error || 'Upload failed')
			}

			setValue(source, result.url, {
				shouldDirty: true,
				shouldTouch: true,
			})

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
		<div style={{ marginTop: -8, marginBottom: 16 }}>
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
