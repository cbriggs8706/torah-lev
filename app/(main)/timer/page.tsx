import { FeedWrapper } from '@/components/feed-wrapper'
import CountdownTimer from '@/components/timer'

export default function TimerPage() {
	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<CountdownTimer />
			</FeedWrapper>
		</div>
	)
}
