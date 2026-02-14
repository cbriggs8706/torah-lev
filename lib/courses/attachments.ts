import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const bucket = process.env.SUPABASE_COURSE_ATTACHMENTS_BUCKET || 'course-attachments'

function getAdminClient() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY
	if (!url || !key) {
		throw new Error(
			'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for attachment uploads.'
		)
	}

	return createClient(url, key)
}

export type StoredAttachment = {
	path: string
	url: string
	name: string
	size: number
	mimeType: string
}

export async function uploadCourseAttachment(input: {
	courseId: string
	fileName: string
	contentType: string
	buffer: Buffer
}) {
	const supabase = getAdminClient()
	const safeFileName = input.fileName.replace(/[^\w.\-]/g, '_')
	const path = `${input.courseId}/${randomUUID()}-${safeFileName}`

	const { error } = await supabase.storage.from(bucket).upload(path, input.buffer, {
		contentType: input.contentType,
		upsert: false,
	})

	if (error) {
		throw new Error(`Attachment upload failed: ${error.message}`)
	}

	const { data } = supabase.storage.from(bucket).getPublicUrl(path)
	return {
		path,
		url: data.publicUrl,
	}
}
