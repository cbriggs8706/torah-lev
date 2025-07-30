import type { Metadata } from 'next'
import {
	Nunito,
	Frank_Ruhl_Libre,
	Tinos,
	Cardo,
	Noto_Rashi_Hebrew,
	Suez_One,
} from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from '@/components/ui/sonner'
import { ExitModal } from '@/components/modals/exit-modal'
import { HeartsModal } from '@/components/modals/hearts-modal'
import { PracticeModal } from '@/components/modals/practice-modal'
import './globals.css'
import { Analytics } from '@vercel/analytics/next'
import { updateLastSeen } from '@/actions/update-last-seen'

const frank = Frank_Ruhl_Libre({
	subsets: ['hebrew'],
	variable: '--font-frank',
	display: 'swap',
})
const tinos = Tinos({
	subsets: ['latin'],
	variable: '--font-tinos',
	weight: '400',
})
const font = Nunito({ subsets: ['latin'], variable: '--font-nunito' })
const cardo = Cardo({
	subsets: ['latin'],
	variable: '--font-cardo',
	weight: '400',
})
const rashi = Noto_Rashi_Hebrew({
	subsets: ['hebrew'],
	variable: '--font-rashi',
	weight: '400',
})
const suez = Suez_One({
	subsets: ['hebrew'],
	variable: '--font-suez',
	weight: '400',
})

export const metadata: Metadata = {
	title: 'Idiom Go',
	description: 'Free Language Learning Made Fun With Comprehensible Input',
}

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	await updateLastSeen()
	return (
		<ClerkProvider>
			<html lang="en">
				<head>
					<Analytics />
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
				<body
					className={`${font.className} ${frank.variable} ${tinos.variable} ${cardo.variable} ${rashi.variable} ${suez.variable}`}
				>
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
