'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface DismissibleAlertProps {
	children: React.ReactNode
	className?: string
}

export function DismissibleAlert({
	children,
	className,
}: DismissibleAlertProps) {
	const [visible, setVisible] = useState(true)

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
				onClick={() => setVisible(false)}
			>
				<X className="h-4 w-4" />
			</Button>
			{children}
		</Card>
	)
}
