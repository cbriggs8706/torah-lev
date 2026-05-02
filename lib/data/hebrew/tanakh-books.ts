export type TanakhBook = {
	slug: string
	hebrew: string
	english: string
	audioSrc: string
}

export type TanakhSubgroup = {
	id: string
	title: string
	englishTitle: string
	audioSrc?: string
	books: TanakhBook[]
}

export type TanakhSection = {
	id: string
	title: string
	englishTitle: string
	audioSrc: string
	tintClassName: string
	subgroups: TanakhSubgroup[]
}

export const tanakhSections: TanakhSection[] = [
	{
		id: 'torah',
		title: 'תּוֹרָה',
		englishTitle: 'Torah',
		audioSrc: '/audio/tanakh-books/torah.mp3',
		tintClassName: 'bg-sky-100/85 border-sky-200',
		subgroups: [
			{
				id: 'torah',
				title: '',
				englishTitle: '',
				books: [
					{
						slug: 'bereshit',
						hebrew: 'בְּרֵאשִׁית',
						english: 'Genesis',
						audioSrc: '/audio/tanakh-books/bereshit.mp3',
					},
					{
						slug: 'shemot',
						hebrew: 'שְׁמוֹת',
						english: 'Exodus',
						audioSrc: '/audio/tanakh-books/shemot.mp3',
					},
					{
						slug: 'vayikra',
						hebrew: 'וַיִּקְרָא',
						english: 'Leviticus',
						audioSrc: '/audio/tanakh-books/vayikra.mp3',
					},
					{
						slug: 'bamidbar',
						hebrew: 'בַּמִּדְבָּר',
						english: 'Numbers',
						audioSrc: '/audio/tanakh-books/bamidbar.mp3',
					},
					{
						slug: 'devarim',
						hebrew: 'דְּבָרִים',
						english: 'Deuteronomy',
						audioSrc: '/audio/tanakh-books/devarim.mp3',
					},
				],
			},
		],
	},
	{
		id: 'neviim',
		title: 'נְבִיאִים',
		englishTitle: 'Neviim',
		audioSrc: '/audio/tanakh-books/neviim.mp3',
		tintClassName: 'bg-emerald-100/80 border-emerald-200',
		subgroups: [
			{
				id: 'rishonim',
				title: 'רִאשׁוֹנִים',
				englishTitle: 'Former Prophets',
				audioSrc: '/audio/tanakh-books/rishonim.mp3',
				books: [
					{
						slug: 'yehoshua',
						hebrew: 'יְהוֹשֻׁעַ',
						english: 'Joshua',
						audioSrc: '/audio/tanakh-books/yehoshua.mp3',
					},
					{
						slug: 'shofetim',
						hebrew: 'שֹׁפְטִים',
						english: 'Judges',
						audioSrc: '/audio/tanakh-books/shofetim.mp3',
					},
					{
						slug: 'shmuel',
						hebrew: 'שְׁמוּאֵל',
						english: 'Samuel',
						audioSrc: '/audio/tanakh-books/shmuel.mp3',
					},
					{
						slug: 'melakhim',
						hebrew: 'מְלָכִים',
						english: 'Kings',
						audioSrc: '/audio/tanakh-books/melakhim.mp3',
					},
				],
			},
			{
				id: 'acharonim',
				title: 'אַחֲרוֹנִים',
				englishTitle: 'Latter Prophets',
				audioSrc: '/audio/tanakh-books/acharonim.mp3',
				books: [
					{
						slug: 'yeshayahu',
						hebrew: 'יְשַׁעְיָהוּ',
						english: 'Isaiah',
						audioSrc: '/audio/tanakh-books/yeshayahu.mp3',
					},
					{
						slug: 'yirmeyahu',
						hebrew: 'יִרְמְיָהוּ',
						english: 'Jeremiah',
						audioSrc: '/audio/tanakh-books/yirmeyahu.mp3',
					},
					{
						slug: 'yechezkel',
						hebrew: 'יְחֶזְקֵאל',
						english: 'Ezekiel',
						audioSrc: '/audio/tanakh-books/yechezkel.mp3',
					},
				],
			},
			{
				id: 'shnei-asar',
				title: 'שְׁנֵים־עָשָׂר',
				englishTitle: 'The Twelve',
				audioSrc: '/audio/tanakh-books/shnei-asar.mp3',
				books: [
					{
						slug: 'hosea',
						hebrew: 'הוֹשֵׁעַ',
						english: 'Hosea',
						audioSrc: '/audio/tanakh-books/hosea.mp3',
					},
					{
						slug: 'yoel',
						hebrew: 'יוֹאֵל',
						english: 'Joel',
						audioSrc: '/audio/tanakh-books/yoel.mp3',
					},
					{
						slug: 'amos',
						hebrew: 'עָמוֹס',
						english: 'Amos',
						audioSrc: '/audio/tanakh-books/amos.mp3',
					},
					{
						slug: 'ovadyah',
						hebrew: 'עֹבַדְיָה',
						english: 'Obadiah',
						audioSrc: '/audio/tanakh-books/ovadyah.mp3',
					},
					{
						slug: 'yonah',
						hebrew: 'יוֹנָה',
						english: 'Jonah',
						audioSrc: '/audio/tanakh-books/yonah.mp3',
					},
					{
						slug: 'mikhah',
						hebrew: 'מִיכָה',
						english: 'Micah',
						audioSrc: '/audio/tanakh-books/mikhah.mp3',
					},
					{
						slug: 'nachum',
						hebrew: 'נַחוּם',
						english: 'Nahum',
						audioSrc: '/audio/tanakh-books/nachum.mp3',
					},
					{
						slug: 'chavakuk',
						hebrew: 'חֲבַקּוּק',
						english: 'Habakkuk',
						audioSrc: '/audio/tanakh-books/chavakuk.mp3',
					},
					{
						slug: 'tzefanyah',
						hebrew: 'צְפַנְיָה',
						english: 'Zephaniah',
						audioSrc: '/audio/tanakh-books/tzefanyah.mp3',
					},
					{
						slug: 'chaggai',
						hebrew: 'חַגַּי',
						english: 'Haggai',
						audioSrc: '/audio/tanakh-books/chaggai.mp3',
					},
					{
						slug: 'zekharyah',
						hebrew: 'זְכַרְיָה',
						english: 'Zechariah',
						audioSrc: '/audio/tanakh-books/zekharyah.mp3',
					},
					{
						slug: 'malakhi',
						hebrew: 'מַלְאָכִי',
						english: 'Malachi',
						audioSrc: '/audio/tanakh-books/malakhi.mp3',
					},
				],
			},
		],
	},
	{
		id: 'ketuvim',
		title: 'כְּתוּבִים',
		englishTitle: 'Ketuvim',
		audioSrc: '/audio/tanakh-books/ketuvim.mp3',
		tintClassName: 'bg-amber-100/80 border-amber-200',
		subgroups: [
			{
				id: 'sifrei-emet',
				title: 'סִפְרֵי אֱמֶת',
				englishTitle: 'Books of Truth',
				audioSrc: '/audio/tanakh-books/sifrei-emet.mp3',
				books: [
					{
						slug: 'tehillim',
						hebrew: 'תְּהִלִּים',
						english: 'Psalms',
						audioSrc: '/audio/tanakh-books/tehillim.mp3',
					},
					{
						slug: 'mishlei',
						hebrew: 'מִשְׁלֵי',
						english: 'Proverbs',
						audioSrc: '/audio/tanakh-books/mishlei.mp3',
					},
					{
						slug: 'iyov',
						hebrew: 'אִיּוֹב',
						english: 'Job',
						audioSrc: '/audio/tanakh-books/iyov.mp3',
					},
				],
			},
			{
				id: 'chamesh-megillot',
				title: 'חָמֵשׁ מְגִלּוֹת',
				englishTitle: 'Five Megillot',
				audioSrc: '/audio/tanakh-books/chamesh-megillot.mp3',
				books: [
					{
						slug: 'shir-hashirim',
						hebrew: 'שִׁיר הַשִּׁירִים',
						english: 'Song of Songs',
						audioSrc: '/audio/tanakh-books/shir-hashirim.mp3',
					},
					{
						slug: 'rut',
						hebrew: 'רוּת',
						english: 'Ruth',
						audioSrc: '/audio/tanakh-books/rut.mp3',
					},
					{
						slug: 'eikhah',
						hebrew: 'אֵיכָה',
						english: 'Lamentations',
						audioSrc: '/audio/tanakh-books/eikhah.mp3',
					},
					{
						slug: 'kohelet',
						hebrew: 'קֹהֶלֶת',
						english: 'Ecclesiastes',
						audioSrc: '/audio/tanakh-books/kohelet.mp3',
					},
					{
						slug: 'ester',
						hebrew: 'אֶסְתֵּר',
						english: 'Esther',
						audioSrc: '/audio/tanakh-books/ester.mp3',
					},
				],
			},
			{
				id: 'ketuvim-final',
				title: 'גָּלוּת',
				englishTitle: 'Exile',
				audioSrc: '/audio/tanakh-books/galut.mp3',
				books: [
					{
						slug: 'daniel',
						hebrew: 'דָּנִיֵּאל',
						english: 'Daniel',
						audioSrc: '/audio/tanakh-books/daniel.mp3',
					},
					{
						slug: 'ezra-nechemyah',
						hebrew: 'עֶזְרָא־נְחֶמְיָה',
						english: 'Ezra-Nehemiah',
						audioSrc: '/audio/tanakh-books/ezra-nechemyah.mp3',
					},
					{
						slug: 'divrei-hayamim',
						hebrew: 'דִּבְרֵי הַיָּמִים',
						english: 'Chronicles',
						audioSrc: '/audio/tanakh-books/divrei-hayamim.mp3',
					},
				],
			},
		],
	},
]
