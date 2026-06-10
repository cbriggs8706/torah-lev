'use client'

import Image from 'next/image'
import { useSearchParams } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { signIn } from '@/components/providers/session-provider'

function safeRedirect(path: string | null) {
	if (!path) return '/courses'

	try {
		const decoded = decodeURIComponent(path)
		if (!decoded.startsWith('/')) return '/courses'
		if (decoded.startsWith('//')) return '/courses'
		return decoded
	} catch {
		return '/courses'
	}
}

export default function SignInClient() {
	const searchParams = useSearchParams()
	const callbackUrl = safeRedirect(searchParams.get('callbackUrl'))

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white to-neutral-50 p-6">
			<div className="mb-8 text-center">
				<h1 className="text-4xl font-bold text-neutral-800">
					Welcome to TorahLev
				</h1>
				<p className="mt-2 text-neutral-500">
					Free language learning made fun with comprehensible input.
				</p>
			</div>

			<div className="flex w-full max-w-md flex-col gap-6 rounded-xl bg-white p-8 shadow-md">
				<Button
					size="lg"
					variant="primary"
					className="flex w-full items-center justify-center gap-2 font-medium"
					onClick={() => signIn('google', { callbackUrl })}
					type="button"
				>
					<Image
						src="/icons/google.svg"
						alt="Google logo"
						width={20}
						height={20}
					/>
					Sign In with Google
				</Button>

				<p>
					Why sign in with Google? It will keep you signed in longer and removes
					the need for passwords.
				</p>

				<div className="relative my-2 text-center text-sm text-neutral-400">
					<hr className="absolute top-1/2 w-full -translate-y-1/2 border-t border-neutral-200" />
					<span className="relative bg-white px-3">or</span>
				</div>

				<Button
					type="button"
					variant="primary"
					className="mt-2 w-full"
					onClick={() => {
						const guestId = crypto.randomUUID()

						// Default guest course (e.g., Hebrew = 6)
						const defaultCourseId = 6 // Change this if you want a different default

						localStorage.setItem('guestId', guestId)
						localStorage.setItem('guestPoints', '0')
						localStorage.setItem('guestActiveCourseId', String(defaultCourseId))

						// Set cookie so middleware recognizes guest mode
						document.cookie = `guestId=${guestId}; path=/; max-age=31536000`
						document.cookie = `guestActiveCourseId=${defaultCourseId}; path=/; max-age=31536000`

						window.location.href = '/courses'
					}}
				>
					Continue as Guest
				</Button>
			</div>

			<p className="mt-6 max-w-sm text-center text-xs text-neutral-400">
				By continuing, you agree to TorahLev&apos;s Terms of Service and Privacy
				Policy.
			</p>
		</div>
	)
}
