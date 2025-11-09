import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
	const formData = await req.formData()
	const file = formData.get('file') as File
	if (!file)
		return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

	const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`
	const { data, error } = await supabase.storage
		.from('avatars')
		.upload(fileName, file, {
			upsert: true,
		})
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })

	const { data: publicUrl } = supabase.storage
		.from('avatars')
		.getPublicUrl(fileName)
	return NextResponse.json({ url: publicUrl.publicUrl })
}
