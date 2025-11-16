import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
	const formData = await req.formData()
	const file = formData.get('file') as File | null

	if (!file) {
		return NextResponse.json({ error: 'No file received' }, { status: 400 })
	}

	const bytes = await file.arrayBuffer()
	const buffer = Buffer.from(bytes)

	// Ensure uploads directory exists
	const uploadDir = path.join(process.cwd(), 'public/uploads')
	await fs.mkdir(uploadDir, { recursive: true })

	const fileName =
		crypto.randomBytes(12).toString('hex') + path.extname(file.name)
	const filePath = path.join(uploadDir, fileName)

	await fs.writeFile(filePath, buffer)

	return NextResponse.json({
		url: `/uploads/${fileName}`,
	})
}
