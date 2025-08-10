// middleware.ts (Next.js 13/14, Clerk v5+)
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// public routes (sign-in/up MUST be public to avoid loops)
const isPublicRoute = createRouteMatcher([
	'/',
	'/sign-in(.*)',
	'/sign-up(.*)',
	'/api/webhooks/stripe',
])

export default clerkMiddleware(
	async (auth, req) => {
		if (!isPublicRoute(req)) {
			// ✅ v5 style: protect non-public routes
			await auth.protect()
		}
	},
	{
		/* optional */
		/* debug: true */
	}
)

export const config = {
	matcher: [
		// Run on all paths except static files and _next
		'/((?!.+\\.[\\w]+$|_next).*)',
		'/',
		'/(api|trpc)(.*)',
	],
}
