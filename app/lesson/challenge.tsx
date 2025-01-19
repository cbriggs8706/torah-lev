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
	return (
		// TODO only reverse if in hebrew
		<div className={cn('flex flex-row-reverse gap-2 flex-wrap')}>
			{options.map((option, i) => {
				return (
					<div key={option.id} className="grow w-1/3 md:w-1/4">
						<Card
							key={option.id}
							id={option.id}
							text={option.text}
							imageSrc={option.imageSrc}
							shortcut={`${i + 1}`}
							selected={selectedOption === option.id}
							onClick={() => onSelect(option.id)}
							status={status}
							audioSrc={option.audioSrc}
							disabled={disabled}
							type={type}
						/>
					</div>
				)
			})}
		</div>
	)
}
