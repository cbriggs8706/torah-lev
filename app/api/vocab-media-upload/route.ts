import path from 'node:path'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdmin } from '@/lib/admin'
import { normalizeVocabStoragePath } from '@/lib/vocab-media'

const bucketName =
	process.env.NEXT_PUBLIC_SUPABASE_VOCAB_BUCKET?.trim() || 'vocab-media'

function sanitizeFileName(fileName: string) {
	const ext = path.extname(fileName)
	const base = path.basename(fileName, ext)
	const normalizedBase = normalizeVocabStoragePath(base)
		.replace(/[^\w./-]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '')

	const normalizedExt = normalizeVocabStoragePath(ext).replace(/[^\w.]+/g, '')
	return `${normalizedBase || 'upload'}${normalizedExt || ''}`
}

async function ensureBucket(supabase: ReturnType<typeof createClient>) {
	const { data: buckets, error: listError } = await supabase.storage.listBuckets()
	if (listError) throw listError

	if (buckets.some((bucket) => bucket.name === bucketName)) return

	const { error: createError } = await supabase.storage.createBucket(bucketName, {
		public: true,
	})

	if (createError && !/already exists/i.test(createError.message)) {
		throw createError
	}
}

export const POST = async (req: Request) => {
	if (!(await isAdmin())) {
		return new NextResponse('Unauthorized', { status: 401 })
	}

	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
	const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

	if (!supabaseUrl || !serviceRoleKey) {
		return NextResponse.json(
			{ error: 'Supabase storage env vars are missing.' },
			{ status: 500 }
		)
	}

	const formData = await req.formData()
	const file = formData.get('file')
	const folderValue = String(formData.get('folder') || '').trim()

	if (!(file instanceof File)) {
		return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
	}

	const supabase = createClient(supabaseUrl, serviceRoleKey)
	await ensureBucket(supabase)

	const folder = normalizeVocabStoragePath(folderValue || 'uploads')
	const fileName = sanitizeFileName(file.name)
	const storagePath = folder ? `${folder}/${fileName}` : fileName

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
		storagePath,
		url: publicUrl.publicUrl,
		bucket: bucketName,
	})
}
