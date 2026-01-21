import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'

import { FeedWrapper } from '@/components/feed-wrapper'
import setsData from '@/lib/data/english/scattergories.json'
import ScattergoriesHub from '@/components/english/english-scattergories'

export default async function ScattergoriesPage() {
	const session = await getServerSession(options)

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<ScattergoriesHub data={setsData} />
				</div>
			</FeedWrapper>
		</div>
	)
}
