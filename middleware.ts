import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
	const token = await getToken({ req })
	const { pathname } = req.nextUrl

	// ✅ Always allow public routes
	if (
		pathname.startsWith('/auth') ||
		pathname.startsWith('/_next') ||
		pathname.startsWith('/api') ||
		pathname.startsWith('/favicon') ||
		pathname === '/'
	) {
		return NextResponse.next()
	}

	// ✅ Check for guest mode cookie (set in browser)
	const guestId = req.cookies.get('guestId')?.value

	// ✅ Allow normal users or guests
	if (token || guestId) {
		return NextResponse.next()
	}

	// 🚫 Block admin routes if not signed in
	if (pathname.startsWith('/admin')) {
		const signInUrl = new URL('/auth/signin', req.url)
		signInUrl.searchParams.set('callbackUrl', req.url)
		return NextResponse.redirect(signInUrl)
	}

	console.log('🧭 Middleware hit:', req.nextUrl.pathname, {
		token: !!token,
		guest: req.cookies.get('guestId')?.value,
	})

	// ✅ Everyone else (guest or user) can access public content
	return NextResponse.next()
}

export const config = {
	matcher: [
		'/((?!_next/static|_next/image|favicon.ico|api|public).*)',
		'/courses/:path*', // ✅ ensure middleware runs for /courses
	],
}
