'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

export default function AuthPage() {
	const [mode, setMode] = useState<'signin' | 'signup'>('signin')
	const [username, setUsername] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)
	const router = useRouter()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)

		if (mode === 'signup') {
			const res = await fetch('/api/signup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, email, password }),
			})
			if (!res.ok) {
				alert(await res.text())
				setLoading(false)
				return
			}
		}

		const result = await signIn('credentials', {
			redirect: true,
			username,
			password,
			callbackUrl: '/courses',
		})

		if (!result?.ok) alert('Invalid credentials')
		setLoading(false)
	}

	const handleGuestContinue = () => {
		// 🧩 Generate or reuse guest ID
		let guestId = localStorage.getItem('guestId')
		if (!guestId) {
			guestId = crypto.randomUUID()
			localStorage.setItem('guestId', guestId)
			localStorage.setItem('guestPoints', '0')
		}

		localStorage.setItem('guestActive', 'true')
		router.push('/courses') // ✅ uses Next.js navigation (no reload)
	}

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
					onClick={() => signIn('google', { callbackUrl: '/courses' })}
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
					<span className="relative bg-white px-3">or sign in with:</span>
				</div>

				<form onSubmit={handleSubmit} className="flex flex-col gap-3">
					<input
						type="text"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						placeholder="Username"
						required
						className="border border-neutral-300 focus:border-neutral-500 rounded-md p-2 w-full"
					/>
					{mode === 'signup' && (
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="Email"
							required
							className="border border-neutral-300 focus:border-neutral-500 rounded-md p-2 w-full"
						/>
					)}
					<input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="Password"
						required
						className="border border-neutral-300 focus:border-neutral-500 rounded-md p-2 w-full"
					/>

					<Button
						type="submit"
						disabled={loading}
						variant="primaryOutline"
						className="w-full mt-2"
					>
						{loading
							? 'Please wait...'
							: mode === 'signin'
							? 'Sign In with Username'
							: 'Create Account'}
					</Button>
				</form>

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

				<div className="text-center text-sm text-neutral-600 mt-2">
					{mode === 'signin' ? (
						<>
							Don’t have an account?{' '}
							<button
								type="button"
								onClick={() => setMode('signup')}
								className="text-blue-600 hover:underline"
							>
								Create one
							</button>
						</>
					) : (
						<>
							Already have an account?{' '}
							<button
								type="button"
								onClick={() => setMode('signin')}
								className="text-blue-600 hover:underline"
							>
								Sign in
							</button>
						</>
					)}
				</div>
			</div>

			<p className="text-xs text-neutral-400 mt-6 text-center max-w-sm">
				By continuing, you agree to IdiomGo’s Terms of Service and Privacy
				Policy.
			</p>
		</div>
	)
}
