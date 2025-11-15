'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function CourseQRModal({
	courseCode,
	locale,
}: {
	courseCode: string
	locale: string
}) {
	const autoLocale = navigator.language.startsWith('es')
		? 'es'
		: navigator.language.startsWith('he')
		? 'he'
		: 'en'
	const [url] = useState(() =>
		typeof window !== 'undefined'
			? `${window.location.origin}/${autoLocale}/${courseCode}/enroll`
			: ''
	)

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="outline" onClick={(e) => e.stopPropagation()}>
					Show Enrollment QR
				</Button>
			</DialogTrigger>

			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle className="text-center">
						Scan to Join this Course
					</DialogTitle>
				</DialogHeader>

				<div className="flex justify-center py-6">
					{url && (
						<QRCodeSVG
							value={url}
							size={260}
							level="H"
							bgColor="#ffffff"
							fgColor="#000000"
						/>
					)}
				</div>

				<p className="text-center text-sm text-muted-foreground">
					Students will be guided to sign in or create an account, then
					automatically enrolled.
				</p>

				<div className="flex justify-center mt-3">
					<Button
						variant="secondary"
						onClick={() => navigator.clipboard.writeText(url)}
					>
						Copy Link
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	)
}
