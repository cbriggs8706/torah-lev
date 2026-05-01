import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function proxy(req: NextRequest) {
	let token = null

	try {
		token = await getToken({ req })
	} catch (error) {
		if (
			!(error instanceof Error) ||
			(error.name !== 'JWEDecryptionFailed' &&
				!error.message.includes('decryption operation failed'))
		) {
			throw error
		}
	}

	const { pathname } = req.nextUrl

	if (
		pathname.startsWith('/auth') ||
		pathname.startsWith('/_next') ||
		pathname.startsWith('/api') ||
		pathname.startsWith('/favicon') ||
		pathname === '/'
	) {
		return NextResponse.next()
	}

	const guestId = req.cookies.get('guestId')?.value

	if (token || guestId) {
		return NextResponse.next()
	}

	if (pathname.startsWith('/admin')) {
		const signInUrl = new URL('/auth/signin', req.url)
		signInUrl.searchParams.set('callbackUrl', req.url)
		return NextResponse.redirect(signInUrl)
	}

	return NextResponse.next()
}

export const config = {
	matcher: [
		'/((?!_next/static|_next/image|favicon.ico|api|public).*)',
		'/courses/:path*', // ✅ ensure middleware runs for /courses
	],
}
