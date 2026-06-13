import { NextResponse } from 'next/server'

import {
	ensurePublicBucket,
	sanitizeFileName,
} from '@/lib/course-image-storage'
import { isAdmin } from '@/lib/admin'

const bucketName =
	process.env.NEXT_PUBLIC_SUPABASE_VIDEO_BUCKET?.trim() || 'video-media'

function sanitizeFolder(value: string) {
	return value
		.toLowerCase()
		.replace(/[^\w/-]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/\/+/g, '/')
		.replace(/^[-/]+|[-/]+$/g, '')
}

export const POST = async (req: Request) => {
	if (!(await isAdmin())) {
		return new NextResponse('Unauthorized', { status: 401 })
	}

	const formData = await req.formData()
	const file = formData.get('file')
	const kind = String(formData.get('kind') || '').trim()
	const folderValue = String(formData.get('folder') || '').trim()

	if (!(file instanceof File)) {
		return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
	}

	if (kind !== 'image' && kind !== 'audio') {
		return NextResponse.json({ error: 'Invalid media type' }, { status: 400 })
	}

	if (kind === 'image' && !file.type.startsWith('image/')) {
		return NextResponse.json({ error: 'Please upload an image file.' }, { status: 400 })
	}

	if (kind === 'audio' && !file.type.startsWith('audio/')) {
		return NextResponse.json({ error: 'Please upload an audio file.' }, { status: 400 })
	}

	const supabase = await ensurePublicBucket(bucketName)
	const folder = sanitizeFolder(folderValue || `videos/${kind}`)
	const storagePath = `${folder}/${Date.now()}-${sanitizeFileName(file.name)}`

	const { error } = await supabase.storage
		.from(bucketName)
		.upload(storagePath, file, { upsert: true })

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 })
	}

	const { data: publicUrl } = supabase.storage
		.from(bucketName)
		.getPublicUrl(storagePath)

	return NextResponse.json({
		url: publicUrl.publicUrl,
		storagePath,
		bucket: bucketName,
	})
}
