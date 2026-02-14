'use client'

import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip'

interface InfoTooltipProps {
	text: string | React.ReactNode
	side?: 'top' | 'right' | 'bottom' | 'left'
}

export function InfoTooltip({ text, side = 'top' }: InfoTooltipProps) {
	return (
		<TooltipProvider delayDuration={0}>
			<Tooltip>
				<TooltipTrigger asChild>
					<button
						type="button"
						className="
              inline-flex items-center justify-center
              w-4 h-4 rounded-full bg-gray-300 
              text-[10px] font-bold text-gray-700 
              hover:bg-gray-400 transition
            "
					>
						i
					</button>
				</TooltipTrigger>

				<TooltipContent side={side} className="max-w-xs text-sm leading-snug">
					{text}
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	)
}
