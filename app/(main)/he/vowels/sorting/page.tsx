import Image from 'next/image'

import { DismissibleAlert } from '@/components/dismissible-alert'
import { FeedWrapper } from '@/components/feed-wrapper'
import HebrewVowelsSorting from '@/components/hebrew/hebrew-vowels-sorting'

export default function HebrewVowelsSortingPage() {
	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/gameIcons/groupSort.png"
						alt="Vowel Sorting"
						height={48}
						width={48}
					/>
					<h1 className="my-6 text-center font-cardo text-6xl text-neutral-800">
						מִיּוּן תְּנוּעוֹת
					</h1>
					<p className="mb-2 text-center font-bold text-neutral-800">
						Vowel Sorting
					</p>

					<DismissibleAlert storageKey="vowels-sorting" className="mb-4 max-w-3xl">
						Choose a sorting mode first, then drag from the same vowel bank used
						in Letter Quiz and the construct conversion game.
					</DismissibleAlert>

					<HebrewVowelsSorting />
				</div>
			</FeedWrapper>
		</div>
	)
}
