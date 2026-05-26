'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useNotify } from 'react-admin'
import { useFormContext, useWatch } from 'react-hook-form'
import { normalizeVocabStoragePath, resolveVocabMediaUrl } from '@/lib/vocab-media'

const AUDIO_MIME_OPTIONS = [
	{ mimeType: 'audio/webm;codecs=opus', extension: 'webm' },
	{ mimeType: 'audio/ogg;codecs=opus', extension: 'ogg' },
	{ mimeType: 'audio/mp4', extension: 'm4a' },
	{ mimeType: 'audio/webm', extension: 'webm' },
]

const AUDIO_BITS_PER_SECOND = 32000

type Props = {
	source: string
	label: string
}

function slugifySegment(value?: string | null) {
	if (!value) return ''

	return normalizeVocabStoragePath(value)
		.toLowerCase()
		.replace(/[^\w.-]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '')
}

function formatDuration(seconds: number) {
	const mins = Math.floor(seconds / 60)
	const secs = seconds % 60
	return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function formatFileSize(bytes: number) {
	if (bytes < 1024) return `${bytes} B`
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function getFolderFromPath(value?: string | null) {
	if (!value) return ''
	const normalized = value.trim().replace(/^\/+/, '')
	const parts = normalized.split('/')
	parts.pop()
	return parts.join('/')
}

function getBaseName(value?: string | null) {
	if (!value) return ''
	const normalized = value.trim().replace(/^\/+/, '')
	const fileName = normalized.split('/').pop() ?? ''
	return fileName.replace(/\.[^.]+$/, '')
}

function getPrimaryTerm(values: Array<string | undefined>) {
	return values.find((value) => value?.trim())?.trim() ?? ''
}

function getPreferredFileBaseName(
	gloss?: string,
	englishTransliteration?: string,
	fallback?: string
) {
	const parts = [gloss?.trim(), englishTransliteration?.trim()].filter(Boolean)
	return parts.join(' ') || fallback || 'clip audio'
}

function getPreferredMimeOption() {
	if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
		return null
	}

	return AUDIO_MIME_OPTIONS.find((option) =>
		MediaRecorder.isTypeSupported(option.mimeType)
	)
}

export function VocabAudioRecorderInput({ source, label }: Props) {
	const notify = useNotify()
	const { control, setValue } = useFormContext()
	const [isRecording, setIsRecording] = useState(false)
	const [isUploading, setIsUploading] = useState(false)
	const [secondsElapsed, setSecondsElapsed] = useState(0)
	const [previewUrl, setPreviewUrl] = useState('')
	const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
	const [isSupported, setIsSupported] = useState(true)
	const mediaRecorderRef = useRef<MediaRecorder | null>(null)
	const streamRef = useRef<MediaStream | null>(null)
	const chunksRef = useRef<Blob[]>([])
	const timerRef = useRef<number | null>(null)

	const sourceKey = useWatch({ control, name: 'sourceKey' }) as string | undefined
	const language = useWatch({ control, name: 'language' }) as string | undefined
	const lessonsText = useWatch({ control, name: 'lessonsText' }) as string | undefined
	const gloss = useWatch({ control, name: 'gloss' }) as string | undefined
	const englishTransliteration = useWatch({
		control,
		name: 'engTransliteration',
	}) as string | undefined
	const recordId = useWatch({ control, name: 'id' }) as string | number | undefined
	const currentValue = useWatch({ control, name: source }) as string | undefined

	const savedAudioUrl = useMemo(
		() => resolveVocabMediaUrl(currentValue),
		[currentValue]
	)

	useEffect(() => {
		setIsSupported(
			typeof window !== 'undefined' &&
				typeof navigator !== 'undefined' &&
				!!navigator.mediaDevices?.getUserMedia &&
				typeof MediaRecorder !== 'undefined'
		)
	}, [])

	useEffect(() => {
		return () => {
			if (timerRef.current) window.clearInterval(timerRef.current)
			if (streamRef.current) {
				streamRef.current.getTracks().forEach((track) => track.stop())
			}
		}
	}, [])

	useEffect(() => {
		return () => {
			if (previewUrl) {
				URL.revokeObjectURL(previewUrl)
			}
		}
	}, [previewUrl])

	const stopTimer = () => {
		if (timerRef.current) {
			window.clearInterval(timerRef.current)
			timerRef.current = null
		}
	}

	const resetPreview = () => {
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl)
			setPreviewUrl('')
		}
		setRecordedBlob(null)
	}

	const startRecording = async () => {
		if (!isSupported) {
			notify('This browser does not support audio recording.', {
				type: 'warning',
			})
			return
		}

		try {
			resetPreview()
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					channelCount: 1,
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true,
				},
			})
			const preferred = getPreferredMimeOption()
			const recorder = preferred?.mimeType
				? new MediaRecorder(stream, {
						mimeType: preferred.mimeType,
						audioBitsPerSecond: AUDIO_BITS_PER_SECOND,
					})
				: new MediaRecorder(stream, {
						audioBitsPerSecond: AUDIO_BITS_PER_SECOND,
					})

			streamRef.current = stream
			mediaRecorderRef.current = recorder
			chunksRef.current = []
			setSecondsElapsed(0)

			recorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					chunksRef.current.push(event.data)
				}
			}

			recorder.onstop = () => {
				stopTimer()
				setIsRecording(false)

				const nextBlob = new Blob(chunksRef.current, {
					type: recorder.mimeType || preferred?.mimeType || 'audio/webm',
				})

				if (nextBlob.size > 0) {
					setRecordedBlob(nextBlob)
					setPreviewUrl(URL.createObjectURL(nextBlob))
				}

				if (streamRef.current) {
					streamRef.current.getTracks().forEach((track) => track.stop())
					streamRef.current = null
				}
			}

			recorder.start()
			setIsRecording(true)
			timerRef.current = window.setInterval(() => {
				setSecondsElapsed((value) => value + 1)
			}, 1000)
		} catch (error) {
			notify(
				error instanceof Error
					? error.message
					: 'Microphone access was denied.',
				{ type: 'error' }
			)
		}
	}

	const stopRecording = () => {
		if (mediaRecorderRef.current?.state === 'recording') {
			mediaRecorderRef.current.stop()
		}
	}

	const handleUpload = async () => {
		if (!recordedBlob) {
			notify('Record a clip first.', { type: 'warning' })
			return
		}

		const preferred = getPreferredMimeOption()
		const lessonToken =
			lessonsText
				?.split(/\r?\n|,/)
				.map((value) => value.trim())
				.find(Boolean) ?? ''
		const existingFolder = getFolderFromPath(currentValue)
		const fallbackFolder = [
			slugifySegment(sourceKey) || 'vocab',
			slugifySegment(lessonToken) || slugifySegment(language) || 'misc',
		].join('/')
		const folder = existingFolder || fallbackFolder
			const existingBaseName = getBaseName(currentValue)
			const fallbackBaseName = getPrimaryTerm([
				recordId ? `entry ${recordId}` : undefined,
				source.replace(/Audio$/i, ' audio'),
			])
			const nextBaseName =
				existingBaseName ||
				getPreferredFileBaseName(
					gloss,
					englishTransliteration,
					fallbackBaseName
				)
			const extension =
			preferred?.extension ||
			(recordedBlob.type.includes('mp4')
				? 'm4a'
				: recordedBlob.type.includes('ogg')
				? 'ogg'
				: 'webm')
		const fileName = `${nextBaseName}.${extension}`
		const file = new File([recordedBlob], fileName, {
			type: recordedBlob.type || preferred?.mimeType || 'audio/webm',
		})

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

			setValue(source, result.storagePath, {
				shouldDirty: true,
				shouldTouch: true,
			})
			notify(`${label} saved to Supabase`, { type: 'success' })
		} catch (error) {
			notify(error instanceof Error ? error.message : 'Upload failed', {
				type: 'error',
			})
		} finally {
			setIsUploading(false)
		}
	}

	if (!isSupported) {
		return (
			<div style={{ marginTop: 8, marginBottom: 16, color: '#666' }}>
				Recording is not supported in this browser.
			</div>
		)
	}

	return (
		<div
			style={{
				marginTop: 8,
				marginBottom: 16,
				padding: 12,
				border: '1px solid #d9d9d9',
				borderRadius: 8,
				background: '#fafafa',
			}}
		>
			<div
				style={{
					display: 'flex',
					flexWrap: 'wrap',
					gap: 8,
					alignItems: 'center',
				}}
			>
				<button
					type="button"
					onClick={isRecording ? stopRecording : startRecording}
					disabled={isUploading}
					style={{
						padding: '8px 12px',
						border: '1px solid #c7c7c7',
						borderRadius: 6,
						background: isRecording ? '#fee2e2' : '#fff',
						cursor: isUploading ? 'progress' : 'pointer',
					}}
				>
					{isRecording ? `Stop ${label}` : `Record ${label}`}
				</button>
				<button
					type="button"
					onClick={handleUpload}
					disabled={!recordedBlob || isRecording || isUploading}
					style={{
						padding: '8px 12px',
						border: '1px solid #c7c7c7',
						borderRadius: 6,
						background: '#fff',
						cursor:
							!recordedBlob || isRecording || isUploading ? 'not-allowed' : 'pointer',
					}}
				>
					{isUploading ? 'Uploading...' : 'Upload Recording'}
				</button>
				<button
					type="button"
					onClick={resetPreview}
					disabled={!recordedBlob || isRecording || isUploading}
					style={{
						padding: '8px 12px',
						border: '1px solid #c7c7c7',
						borderRadius: 6,
						background: '#fff',
						cursor:
							!recordedBlob || isRecording || isUploading ? 'not-allowed' : 'pointer',
					}}
				>
					Discard Take
				</button>
				<span style={{ color: '#555', fontSize: 14 }}>
					{isRecording
						? `Recording ${formatDuration(secondsElapsed)}`
						: recordedBlob
						? `${formatFileSize(recordedBlob.size)} ready`
						: 'Opus/AAC recording tuned for short vocab clips'}
				</span>
			</div>
			{previewUrl ? (
				<div style={{ marginTop: 12 }}>
					<div style={{ marginBottom: 6, fontSize: 13, color: '#666' }}>
						New take
					</div>
					<audio controls src={previewUrl} style={{ width: '100%' }} />
				</div>
			) : null}
			{savedAudioUrl ? (
				<div style={{ marginTop: 12 }}>
					<div style={{ marginBottom: 6, fontSize: 13, color: '#666' }}>
						Current saved audio
					</div>
					<audio controls src={savedAudioUrl} style={{ width: '100%' }} />
				</div>
			) : null}
		</div>
	)
}
