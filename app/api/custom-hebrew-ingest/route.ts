// app/api/custom-hebrew-ingest/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ingestCustomHebrewText } from '@/lib/hebrew/ingestCustomHebrewText'

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
		const analysisDigest = (body.analysisDigest || '').toString()
		const overrides = body.overrides ?? {}
		const segmentationOverrides = body.segmentationOverrides ?? {}

		if (!customHebrewBookId || !chapterNumber || !rawText.trim() || !analysisDigest) {
			return NextResponse.json(
				{ error: 'Missing required fields' },
				{ status: 400 }
			)
		}

		const result = await ingestCustomHebrewText({
			customHebrewBookId,
			chapterNumber,
			rawText,
			actorUserId: session.user.id,
			analysisDigest,
			overrides,
			segmentationOverrides,
		})

		return NextResponse.json({ ok: true, ...result })
	} catch (err) {
		console.error('Custom ingest error:', err)
		return NextResponse.json(
			{ error: 'ingest_failed', details: String(err) },
			{ status: 500 }
		)
	}
}
