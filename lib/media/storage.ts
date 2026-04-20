import { randomUUID } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import {
	getBucketForMediaKind,
	type MediaKind,
	sanitizeFileName,
} from './utils'

function getAdminClient() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY

	if (!url || !key) {
		throw new Error(
			'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for media uploads.'
		)
	}

	return createClient(url, key)
}

export function getPublicMediaUrl(bucket: string, objectPath: string) {
	const supabase = getAdminClient()
	const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath)
	return data.publicUrl
}

export async function uploadMediaObject(input: {
	kind: MediaKind
	fileName: string
	contentType: string
	buffer: Buffer
	folderPath?: string
}) {
	const supabase = getAdminClient()
	const bucket = getBucketForMediaKind(input.kind)
	const safeFileName = sanitizeFileName(input.fileName)
	const objectPath = `${input.folderPath ? `${input.folderPath}/` : ''}${randomUUID()}-${safeFileName}`

	const { error } = await supabase.storage
		.from(bucket)
		.upload(objectPath, input.buffer, {
			contentType: input.contentType,
			upsert: false,
		})

	if (error) {
		throw new Error(`Media upload failed: ${error.message}`)
	}

	const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath)

	return {
		bucket,
		objectPath,
		url: data.publicUrl,
	}
}

export async function deleteMediaObject(bucket: string, objectPath: string) {
	const supabase = getAdminClient()
	const { error } = await supabase.storage.from(bucket).remove([objectPath])
	if (error) {
		throw new Error(`Media delete failed: ${error.message}`)
	}
}
