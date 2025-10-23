import { FeedWrapper } from '@/components/feed-wrapper'
import HebrewVerbChart from '@/components/hebrew/hebrew-verb-chart'

const HebrewVerbChartPage = () => {
	return (
		<div className="flex flex-col items-center gap-6 px-6">
			<FeedWrapper>
				{/* The Client Component that handles verb selection and tense rendering */}
				<HebrewVerbChart />
			</FeedWrapper>
		</div>
	)
}

export default HebrewVerbChartPage
