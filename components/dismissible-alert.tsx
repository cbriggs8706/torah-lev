'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface DismissibleAlertProps {
	children: React.ReactNode
	className?: string
	storageKey: string // unique key for this alert
}

export function DismissibleAlert({
	children,
	className,
	storageKey,
}: DismissibleAlertProps) {
	const [visible, setVisible] = useState(true)

	useEffect(() => {
		// Check if user already dismissed this alert
		const dismissed = localStorage.getItem(storageKey)
		if (dismissed === 'true') {
			setVisible(false)
		}
	}, [storageKey])

	const handleDismiss = () => {
		localStorage.setItem(storageKey, 'true')
		setVisible(false)
	}

	if (!visible) return null

	return (
		<Card
			className={`relative p-4 text-center text-muted-foreground ${
				className || ''
			}`}
		>
			<Button
				variant="ghost"
				size="icon"
				className="absolute right-2 top-2 h-6 w-6"
				onClick={handleDismiss}
			>
				<X className="h-4 w-4" />
			</Button>
			{children}
		</Card>
	)
}
