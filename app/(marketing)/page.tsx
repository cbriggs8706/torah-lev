'use client'

import Image from 'next/image'
import { Loader } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { signIn, signOut, useSession } from '@/components/providers/session-provider'

export default function Home() {
	const { data: session, status } = useSession()

	const isLoading = status === 'loading'
	const isSignedIn = !!session?.user

	return (
		<div className="max-w-[988px] mx-auto flex-1 w-full flex flex-col lg:flex-row items-center justify-center p-4 gap-2">
			<div className="relative w-[180px] h-[180px] lg:w-[424px] lg:h-[424px] mb-8 lg:mb-0">
				<Image
					src="/icons/heroKids.png"
					fill
					alt="Hero"
					sizes="(min-width: 1024px) 424px, 180px"
					loading="eager"
				/>
			</div>

			<div className="flex flex-col items-center gap-y-8">
				<h1 className="text-xl lg:text-3xl font-bold text-neutral-600 max-w-[480px] text-center">
					&apos;Idiom&apos; is both a root of the word &apos;language&apos; and
					makes up over half of everyday speech. IdiomGo uses comprehensible
					input and engaging activities to help you hear, speak, read, and write
					naturally—so you can confidently &apos;go&apos; with the language.
				</h1>

				<div className="flex flex-col items-center gap-y-3 max-w-[330px] w-full">
					{isLoading ? (
						<Loader className="h-5 w-5 text-muted-foreground animate-spin" />
					) : !isSignedIn ? (
						<>
							<Button
								size="lg"
								variant="secondary"
								className="w-full"
								onClick={() => signIn(undefined, { callbackUrl: '/curriculum' })}
							>
								Start Learning{' '}
							</Button>
						</>
					) : (
						<Button size="lg" variant="secondary" className="w-full" asChild>
							<Link href="/curriculum">Continue Learning</Link>
						</Button>
					)}
				</div>
			</div>
		</div>
	)
}
