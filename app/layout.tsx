import type { Metadata } from 'next'
import {
	Nunito,
	Frank_Ruhl_Libre,
	Tinos,
	Cardo,
	Noto_Rashi_Hebrew,
	Suez_One,
	EB_Garamond,
	Eczar,
	Mansalva,
	Alegreya_SC,
	MonteCarlo,
	UnifrakturMaguntia,
	Reenie_Beanie,
} from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { ExitModal } from '@/components/modals/exit-modal'
import { HeartsModal } from '@/components/modals/hearts-modal'
import { PracticeModal } from '@/components/modals/practice-modal'
import './globals.css'
import { Analytics } from '@vercel/analytics/next'
import { updateLastSeen } from '@/actions/update-last-seen'
import { getSession } from '@/lib/auth'
import Script from 'next/script'
import SessionProvider from '@/components/providers/session-provider'

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
const garamond = EB_Garamond({
	subsets: ['greek'],
	variable: '--font-garamond',
	weight: '400',
})
const eczar = Eczar({
	subsets: ['greek'],
	variable: '--font-eczar',
	weight: '400',
})
const manslava = Mansalva({
	subsets: ['greek'],
	variable: '--font-manslava',
	weight: '400',
})
const alegreya = Alegreya_SC({
	subsets: ['greek'],
	variable: '--font-alegreya',
	weight: '400',
})
const montecarlo = MonteCarlo({
	subsets: ['latin'],
	variable: '--font-montecarlo',
	weight: '400',
})
const maguntia = UnifrakturMaguntia({
	subsets: ['latin'],
	variable: '--font-maguntia',
	weight: '400',
})
const reeniebeanie = Reenie_Beanie({
	subsets: ['latin'],
	variable: '--font-reeniebeanie',
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
	const session = await getSession()

	if (session?.user?.id) {
		try {
			await updateLastSeen({
				id: session.user.id,
				email: session.user.email,
				name: session.user.name,
				image: session.user.image,
			})
		} catch (error) {
			console.error('Failed to update last seen in RootLayout:', error)
		}
	}
	return (
		<SessionProvider>
			<html lang="en">
				<head>
					<Script
						src={`https://cdn.tiny.cloud/1/${process.env.NEXT_PUBLIC_TINYMCE_API_KEY}/tinymce/6/tinymce.min.js`}
						referrerPolicy="origin"
						strategy="afterInteractive"
					/>
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
					className={`${font.className} ${frank.variable}  ${tinos.variable} ${cardo.variable} ${rashi.variable} ${suez.variable} ${garamond.variable} ${eczar.variable} ${manslava.variable} ${alegreya.variable} ${montecarlo.variable} ${maguntia.variable} ${reeniebeanie.variable}`}
				>
					<Toaster />
					<ExitModal />
					<HeartsModal />
					<PracticeModal />
					{children}
				</body>
			</html>
		</SessionProvider>
	)
}
