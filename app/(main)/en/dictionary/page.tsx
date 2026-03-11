import Image from 'next/image'
import { getSession } from '@/lib/auth'
import { FeedWrapper } from '@/components/feed-wrapper'
import { DismissibleAlert } from '@/components/dismissible-alert'
import { getUserProgress, getUserSubscription } from '@/db/queries'
import EnglishDictionary from '@/components/english/english-dictionary'
import { EnglishVocab } from '@/lib/vocab'

// --- vocab sets ---
import efwEnglishVocab from '@/lib/data/vocab/efwVocab.json'
import ewbEnglishVocab from '@/lib/data/vocab/ewbVocab.json'
import lrEnglishVocab from '@/lib/data/vocab/lrVocab.json'
import ec1EnglishVocab from '@/lib/data/vocab/ec1Vocab.json'
import ec2EnglishVocab from '@/lib/data/vocab/ec2Vocab.json'

const EnglishDictionaryPage = async () => {
	// Session may be null for guests
	const session = await getSession()

	// Always try to get user data
	const [userProgress, userSubscription] = await Promise.all([
		getUserProgress(),
		getUserSubscription(),
	])

	const isPro = !!userSubscription?.isActive
	const activeCourseId = userProgress?.activeCourseId ?? 3 // ✅ Default to EC1 (or whichever course should show for guests)

	// ✅ Choose correct vocab dataset
	const englishData: EnglishVocab[] =
		activeCourseId === 16
			? (efwEnglishVocab as EnglishVocab[])
			: activeCourseId === 13
			? (ewbEnglishVocab as EnglishVocab[])
			: activeCourseId === 17
			? (lrEnglishVocab as EnglishVocab[])
			: activeCourseId === 3
			? (ec1EnglishVocab as EnglishVocab[])
			: activeCourseId === 4
			? (ec2EnglishVocab as EnglishVocab[])
			: (ec1EnglishVocab as EnglishVocab[]) // ✅ default fallback

	const filteredData = englishData.filter((entry) => entry.type === 'word')
	console.log(filteredData[0])
	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/open-book-svgrepo-com.svg"
						alt="Dictionary"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						Dictionary
					</h1>
					<DismissibleAlert storageKey="dictionary" className="mb-4">
						Make sure to look up words that you don&apos;t recognize in any
						lesson. Filter alphabetically or by lesson number. Click on any
						entry to view more information.
					</DismissibleAlert>

					<EnglishDictionary data={filteredData} />
				</div>
			</FeedWrapper>
		</div>
	)
}

export default EnglishDictionaryPage
