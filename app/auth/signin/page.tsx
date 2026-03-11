'use client'

import { signIn } from '@/components/providers/session-provider'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

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

export default function AuthPage() {
	const searchParams = useSearchParams()
	const callbackUrl = safeRedirect(searchParams.get('callbackUrl'))

	return (
		<div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-b from-white to-neutral-50">
			<div className="text-center mb-8">
				<h1 className="text-4xl font-bold text-neutral-800">
					Welcome to IdiomGo
				</h1>
				<p className="text-neutral-500 mt-2">
					Free language learning made fun with comprehensible input.
				</p>
			</div>

			<div className="bg-white shadow-md rounded-xl w-full max-w-md p-8 flex flex-col gap-6">
				<Button
					size="lg"
					variant="primary"
					className="w-full font-medium flex items-center justify-center gap-2"
					onClick={() => signIn('google', { callbackUrl })}
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

				<div className="relative text-center text-sm text-neutral-400 my-2">
					<hr className="absolute w-full border-t border-neutral-200 top-1/2 -translate-y-1/2" />
					<span className="relative bg-white px-3">or</span>
				</div>

				<Button
					variant="primary"
					className="w-full mt-2"
					onClick={() => {
						const guestId = crypto.randomUUID()

						// Default guest course (e.g., Hebrew = 6)
						const defaultCourseId = 6 // 💡 Change this if you want a different default

						localStorage.setItem('guestId', guestId)
						localStorage.setItem('guestPoints', '0')
						localStorage.setItem('guestActiveCourseId', String(defaultCourseId))

						// 🧩 Set cookie so middleware recognizes guest mode
						document.cookie = `guestId=${guestId}; path=/; max-age=31536000`
						document.cookie = `guestActiveCourseId=${defaultCourseId}; path=/; max-age=31536000`

						window.location.href = '/courses'
					}}
				>
					Continue as Guest
				</Button>
			</div>

			<p className="text-xs text-neutral-400 mt-6 text-center max-w-sm">
				By continuing, you agree to IdiomGo’s Terms of Service and Privacy
				Policy.
			</p>
		</div>
	)
}
