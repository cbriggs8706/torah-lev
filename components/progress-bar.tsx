interface ProgressBarProps {
	currentIndex: number
	total: number
}

export default function ProgressBar({ currentIndex, total }: ProgressBarProps) {
	if (total === 0) return null
	return (
		<>
			<div className="text-sm font-medium text-gray-600 mb-1">
				{currentIndex + 1} / {total}
			</div>
			<div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
				<div
					className="bg-sky-600 h-full transition-all duration-300"
					style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
				></div>
			</div>
		</>
	)
}
