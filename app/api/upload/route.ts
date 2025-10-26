import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(req: Request) {
	const formData = await req.formData()
	const file = formData.get('file') as File
	if (!file)
		return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

	// Make sure uploads directory exists
	const uploadDir = path.join(process.cwd(), 'public', 'uploads')
	await mkdir(uploadDir, { recursive: true })

	// Save file
	const arrayBuffer = await file.arrayBuffer()
	const buffer = Buffer.from(arrayBuffer)
	const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`
	const filePath = path.join(uploadDir, fileName)
	await writeFile(filePath, buffer)

	const fileUrl = `/uploads/${fileName}`
	return NextResponse.json({ url: fileUrl })
}
