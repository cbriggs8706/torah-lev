import Image from 'next/image'

import { DismissibleAlert } from '@/components/dismissible-alert'
import { FeedWrapper } from '@/components/feed-wrapper'
import HebrewHistoricVowelShifts from '@/components/hebrew/hebrew-historic-vowel-shifts'

export default function HebrewHistoricShortVowelsPage() {
	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/gameIcons/groupSort.png"
						alt="Historic Short Vowels"
						height={48}
						width={48}
					/>
					<h1 className="my-6 text-center font-cardo text-6xl text-neutral-800">
						שִׁנּוּיֵי תְּנוּעוֹת
					</h1>
					<p className="mb-2 text-center font-bold text-neutral-800">
						Historic Short Vowels
					</p>

					<DismissibleAlert
						storageKey="historic-short-vowels"
						className="mb-4 max-w-3xl"
					>
						Use this chart to practice what happens to historic short vowels.
						Switch between reduction and lengthening, then fill the chart from
						the answer bank.
					</DismissibleAlert>

					<HebrewHistoricVowelShifts />
				</div>
			</FeedWrapper>
		</div>
	)
}
