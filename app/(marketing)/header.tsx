'use client'

import Image from 'next/image'
import { Loader } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signIn, signOut, useSession } from '@/components/providers/session-provider'

export const Header = () => {
	const { data: session, status } = useSession()
	const isLoading = status === 'loading'
	const isSignedIn = !!session?.user

	return (
		<header className="h-20 w-full border-b-2 border-slate-200 px-4">
			<div className="lg:max-w-screen-lg mx-auto flex items-center justify-between h-full">
				<div className="pt-8 pl-4 pb-7 flex items-center gap-x-3">
					<Image src="/icons/iconBoy.png" height={40} width={40} alt="Mascot" />
					<h1 className="text-2xl font-extrabold text-sky-600 tracking-wide">
						Idiom Go
					</h1>
				</div>

				{/* Loading state */}
				{isLoading && (
					<Loader className="h-5 w-5 text-muted-foreground animate-spin" />
				)}

				{/* Auth state */}
				{!isLoading && (
					<>
						{isSignedIn ? (
							<div className="flex items-center gap-x-3">
								{/* Profile avatar */}
								{session.user?.image && (
									<Image
										src={session.user.image}
										alt={session.user.name || 'User'}
										width={40}
										height={40}
										className="rounded-full border"
									/>
								)}
								<Button
									size="lg"
									variant="ghost"
									onClick={() => signOut({ callbackUrl: '/' })}
								>
									Logout
								</Button>
							</div>
						) : (
							<Button
								size="lg"
								variant="ghost"
								onClick={() => signIn(undefined, { callbackUrl: '/courses' })}
							>
								Login
							</Button>
						)}
					</>
				)}
			</div>
		</header>
	)
}
