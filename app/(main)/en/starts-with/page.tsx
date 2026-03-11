import Image from 'next/image'
import { getSession } from '@/lib/auth'

import { FeedWrapper } from '@/components/feed-wrapper'
import startsWithData from '@/lib/data/english/startsWith.json'
import StartsWithGame from '@/components/english/english-starts-with'

export default async function StartsWithPage() {
	const session = await getSession()

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						Starts With...
					</h1>

					<StartsWithGame data={startsWithData} />
				</div>
			</FeedWrapper>
		</div>
	)
}
