import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

export const fallbackCourseImageUrl = '/mascot.svg'

export function parseDateInput(value?: string) {
	if (!value?.trim()) return null

	const parsed = new Date(`${value}T00:00:00`)
	return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function sanitizeFileName(fileName: string) {
	const ext = path.extname(fileName)
	const base = path.basename(fileName, ext)
	const normalizedBase = base
		.toLowerCase()
		.replace(/[^\w.-]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '')
	const normalizedExt = ext.toLowerCase().replace(/[^\w.]+/g, '')

	return `${normalizedBase || 'course-image'}${normalizedExt || ''}`
}

export async function ensurePublicBucket(bucketName: string) {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
	const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

	if (!supabaseUrl || !serviceRoleKey) {
		throw new Error('Supabase storage env vars are missing.')
	}

	const supabase = createClient(supabaseUrl, serviceRoleKey)
	const { data: buckets, error: listError } = await supabase.storage.listBuckets()

	if (listError) {
		throw listError
	}

	if (!buckets.some((bucket) => bucket.name === bucketName)) {
		const { error: createError } = await supabase.storage.createBucket(bucketName, {
			public: true,
		})

		if (createError && !/already exists/i.test(createError.message)) {
			throw createError
		}
	}

	return supabase
}

export async function uploadCourseImage(options: {
	bucketName: string
	folder: string
	file: File
}) {
	const supabase = await ensurePublicBucket(options.bucketName)
	const storagePath = `${options.folder}/${Date.now()}-${sanitizeFileName(
		options.file.name
	)}`

	const { error: uploadError } = await supabase.storage
		.from(options.bucketName)
		.upload(storagePath, options.file, { upsert: true })

	if (uploadError) {
		throw uploadError
	}

	const { data: publicUrl } = supabase.storage
		.from(options.bucketName)
		.getPublicUrl(storagePath)

	return publicUrl.publicUrl
}

