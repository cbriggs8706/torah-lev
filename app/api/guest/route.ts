import { NextResponse } from 'next/server'

export async function POST() {
	const guestId = crypto.randomUUID()
	const res = NextResponse.json({ success: true, guestId })
	res.cookies.set('guestId', guestId, {
		path: '/',
		maxAge: 60 * 60 * 24 * 365, // 1 year
		httpOnly: false,
		sameSite: 'lax',
	})
	return res
}
