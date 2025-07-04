import type { Metadata } from 'next'
import { Nunito, Frank_Ruhl_Libre } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from '@/components/ui/sonner'
import { ExitModal } from '@/components/modals/exit-modal'
import { HeartsModal } from '@/components/modals/hearts-modal'
import { PracticeModal } from '@/components/modals/practice-modal'
import './globals.css'

const frank = Frank_Ruhl_Libre({
	subsets: ['hebrew'],
	variable: '--font-frank',
})
const font = Nunito({ subsets: ['latin'], variable: '--font-nunito' })

export const metadata: Metadata = {
	title: 'Idiom Go',
	description: 'Free Language Learning Made Fun With Comprehensible Input',
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<ClerkProvider>
			<html lang="en">
				<head>
					<link rel="icon" href="/favicon.ico" />
					<link
						rel="android-chrome"
						sizes="192x192"
						href="/android-chrome-192x192.png"
					/>
					<link
						rel="android-chrome"
						sizes="512x512"
						href="/android-chrome-512x512.png"
					/>
					<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
					<link
						rel="icon"
						type="image/png"
						sizes="16x16"
						href="/favicon-16x16.png"
					/>
					<link
						rel="icon"
						type="image/png"
						sizes="32x32"
						href="/favicon-32x32.png"
					/>
				</head>
				<body className={`${font.className} ${frank.className}`}>
					<Toaster />
					<ExitModal />
					<HeartsModal />
					<PracticeModal />
					{children}
				</body>
			</html>
		</ClerkProvider>
	)
}
