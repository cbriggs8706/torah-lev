import Image from 'next/image'
import { FeedWrapper } from '@/components/feed-wrapper'
import HebrewTanakhBooks from '@/components/hebrew/hebrew-tanakh-books'

const HebrewTanakhBooksPage = () => {
	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/books-svgrepo-com.svg"
						alt="Books of the TaNaK"
						height={48}
						width={48}
					/>
					<h1 className="text-center font-cardo text-neutral-800 text-6xl my-6">
						סִפְרֵי תָּנָ״ךְ
					</h1>
					<p className="text-center font-bold text-neutral-800 mb-6">
						Books of the TaNaK
					</p>
				</div>

				<HebrewTanakhBooks />
			</FeedWrapper>
		</div>
	)
}

export default HebrewTanakhBooksPage
