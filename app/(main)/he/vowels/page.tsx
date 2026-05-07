import Image from 'next/image'
import Link from 'next/link'

import { DismissibleAlert } from '@/components/dismissible-alert'
import { FeedWrapper } from '@/components/feed-wrapper'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'

export default function HebrewVowelsPage() {
	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/gameIcons/groupSort.png"
						alt="Vowels"
						height={90}
						width={90}
					/>
					<h1 className="my-6 text-center font-cardo text-6xl text-neutral-800">
						תְּנוּעוֹת
					</h1>
					<p className="mb-2 text-center font-bold text-neutral-800">Vowels</p>

					<DismissibleAlert storageKey="vowels-topic" className="mb-6 max-w-3xl">
						Choose a vowels activity from here. The Niqqud quiz, syllables
						quiz, sorting drill, and historic short vowel chart each have
						their own route now.
					</DismissibleAlert>

					<div className="grid w-full max-w-5xl gap-5 md:grid-cols-2 xl:grid-cols-3">
						<Card className="border-sidebar-border bg-white/85 shadow-sm">
							<CardHeader className="space-y-3">
								<div className="flex items-center gap-3">
									<div className="rounded-2xl bg-sidebar-accent/70 p-3">
										<Image
											src="/gameIcons/groupSort.png"
											alt=""
											aria-hidden="true"
											width={34}
											height={34}
										/>
									</div>
									<div>
										<CardTitle className="text-2xl font-cardo text-neutral-800">
											חִידוֹן הֲבָרוֹת
										</CardTitle>
										<CardDescription className="text-sm font-semibold text-neutral-600">
											Syllables
										</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-5">
								<p className="text-sm leading-6 text-neutral-700">
									Practice syllable sounds with the same study and timed quiz
									flow that used to live inside Letter Quiz.
								</p>
								<Button asChild variant="primary" className="w-full">
									<Link href="/he/syllables">Start Syllables Quiz</Link>
								</Button>
							</CardContent>
						</Card>

						<Card className="border-sidebar-border bg-white/85 shadow-sm">
							<CardHeader className="space-y-3">
								<div className="flex items-center gap-3">
									<div className="rounded-2xl bg-sidebar-accent/70 p-3">
										<Image
											src="/icons/iconLetter.png"
											alt=""
											aria-hidden="true"
											width={34}
											height={34}
										/>
									</div>
									<div>
										<CardTitle className="text-2xl font-cardo text-neutral-800">
											חִידוֹן תְּנוּעוֹת
										</CardTitle>
										<CardDescription className="text-sm font-semibold text-neutral-600">
											Vowels Quiz
										</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-5">
								<p className="text-sm leading-6 text-neutral-700">
									Practice Niqqud Names with the same timed quiz feel that used
									to live inside Letter Quiz.
								</p>
								<Button asChild variant="primary" className="w-full">
									<Link href="/he/vowel-quiz">Start Vowels Quiz</Link>
								</Button>
							</CardContent>
						</Card>

						<Card className="border-sidebar-border bg-white/85 shadow-sm">
							<CardHeader className="space-y-3">
								<div className="flex items-center gap-3">
									<div className="rounded-2xl bg-sidebar-accent/70 p-3">
										<Image
											src="/gameIcons/groupSort.png"
											alt=""
											aria-hidden="true"
											width={34}
											height={34}
										/>
									</div>
									<div>
										<CardTitle className="text-2xl font-cardo text-neutral-800">
											מִיּוּן תְּנוּעוֹת
										</CardTitle>
										<CardDescription className="text-sm font-semibold text-neutral-600">
											Sorting Activity
										</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-5">
								<p className="text-sm leading-6 text-neutral-700">
									Choose length or class, then drag vowels from the shared bank
									into the right category.
								</p>
								<Button asChild variant="primary" className="w-full">
									<Link href="/he/vowels/sorting">Start Sorting Activity</Link>
								</Button>
							</CardContent>
						</Card>

						<Card className="border-sidebar-border bg-white/85 shadow-sm">
							<CardHeader className="space-y-3">
								<div className="flex items-center gap-3">
									<div className="rounded-2xl bg-sidebar-accent/70 p-3">
										<Image
											src="/gameIcons/groupSort.png"
											alt=""
											aria-hidden="true"
											width={34}
											height={34}
										/>
									</div>
									<div>
										<CardTitle className="text-2xl font-cardo text-neutral-800">
											שִׁנּוּיֵי תְּנוּעוֹת
										</CardTitle>
										<CardDescription className="text-sm font-semibold text-neutral-600">
											Historic Short Vowels
										</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-5">
								<p className="text-sm leading-6 text-neutral-700">
									Practice reducing or lengthening the historic short vowels in a
									chart-style activity based on the vowel change pattern.
								</p>
								<Button asChild variant="primary" className="w-full">
									<Link href="/he/vowels/historic-short">Start Chart Activity</Link>
								</Button>
							</CardContent>
						</Card>
					</div>
				</div>
			</FeedWrapper>
		</div>
	)
}
