// app/api/custom-hebrew-preview/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { buildCustomHebrewIngestAnalysis } from '@/lib/hebrew/ingestCustomHebrewText'

export async function POST(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session || session.user.role !== 'admin') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const body = await req.json()
		const customHebrewBookId = Number(body.customHebrewBookId)
		const chapterNumber = Number(body.chapterNumber)
		const rawText = (body.rawText || '').toString()
		const segmentationOverrides = body.segmentationOverrides ?? {}

		if (!customHebrewBookId || !chapterNumber || !rawText.trim()) {
			return NextResponse.json(
				{ error: 'Missing required fields' },
				{ status: 400 }
			)
		}

		const analysis = await buildCustomHebrewIngestAnalysis({
			customHebrewBookId,
			chapterNumber,
			rawText,
			segmentationOverrides,
		})

		return NextResponse.json({ analysis })
	} catch (err) {
		console.error('Custom preview error:', err)
		return NextResponse.json(
			{ error: 'preview_failed', details: String(err) },
			{ status: 500 }
		)
	}
}
