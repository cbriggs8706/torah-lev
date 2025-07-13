import { cn } from '@/lib/utils'
import { challengeOptions, challenges } from '@/db/schema'

import { Card } from './card'

type Props = {
	options: (typeof challengeOptions.$inferSelect)[]
	onSelect: (id: number) => void
	status: 'correct' | 'wrong' | 'none'
	selectedOption?: number
	disabled?: boolean
	type: (typeof challenges.$inferSelect)['type']
}

export const Challenge = ({
	options,
	onSelect,
	status,
	selectedOption,
	disabled,
	type,
}: Props) => {
	console.log('Options:', options)

	return (
		// TODO only reverse if in hebrew
		// <div className={cn('flex flex-row gap-2 flex-wrap')}>
		<div
			className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
			dir="rtl"
		>
			{options.map((option, i) => (
				<Card
					key={option.id}
					{...option}
					shortcut={`${i + 1}`}
					selected={selectedOption === option.id}
					onClick={() => onSelect(option.id)}
					status={status}
					disabled={disabled}
					type={type}
				/>
			))}
		</div>
	)
}
