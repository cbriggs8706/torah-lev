export type MediaKind = 'image' | 'audio' | 'video' | 'document' | 'other'

export const MEDIA_BUCKETS: Record<MediaKind, string> = {
	image: 'media-images',
	audio: 'media-audio',
	video: 'media-video',
	document: 'media-documents',
	other: 'media-documents',
}

export function getBucketForMediaKind(kind: MediaKind) {
	return MEDIA_BUCKETS[kind]
}

export function slugifyMediaLabel(value: string) {
	return value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
}

export function sanitizeFileName(fileName: string) {
	return fileName.replace(/[^\w.\-]/g, '_')
}

export function inferMediaKind(mimeType: string, fileName: string): MediaKind {
	if (mimeType.startsWith('image/')) return 'image'
	if (mimeType.startsWith('audio/')) return 'audio'
	if (mimeType.startsWith('video/')) return 'video'
	if (
		mimeType === 'application/pdf' ||
		mimeType.startsWith('text/') ||
		/\.(pdf|doc|docx|ppt|pptx|xls|xlsx|txt|md)$/i.test(fileName)
	) {
		return 'document'
	}

	return 'other'
}
