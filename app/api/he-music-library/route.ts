import { asc } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import db from '@/db/drizzle'
import { hebrewMusicLibrary } from '@/db/schema'
import { isAdmin } from '@/lib/admin'

export async function GET() {
	if (!(await isAdmin())) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
	}

	const songs = await db.query.hebrewMusicLibrary.findMany({
		orderBy: [asc(hebrewMusicLibrary.category), asc(hebrewMusicLibrary.order)],
		columns: {
			id: true,
			title: true,
			hebTitle: true,
			titleTransliteration: true,
			category: true,
			order: true,
		},
	})

	return NextResponse.json({ songs })
}
