export const englishLetters = [
	{
		char: 'a',
		nameAudio: '/audio/sound-alef-tsere.mp3',
		// nameAudio: '/audio/name-a.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/æ/',
					type: 'short',
					grapheme: 'ă',
					nameAudio: '/audio/name-short-a.mp3',
					audio: '/audio/sound-a-1.mp3',
					examples: ['cat', 'map', 'glass'],
				},
				{
					ipa: '/eɪ/',
					type: 'long',
					grapheme: 'ā',
					nameAudio: '/audio/name-long-a.mp3',
					audio: '/audio/sound-alef-tsere.mp3',
					// audio: '/audio/sound-a-3.mp3',
					examples: ['name', 'rain', 'paper'],
				},
			],

			complex: [
				{
					ipa: '/æ/',
					audio: '/audio/sound-a-1.mp3',
					examples: ['cat', 'map', 'glass'],
				},
				{
					ipa: '/ɑ/',
					audio: '/audio/sound-alef-qamats.mp3',
					// audio: '/audio/sound-a-2.mp3',
					examples: ['father', 'pasta', 'spa'],
				},
				{
					ipa: '/eɪ/',
					audio: '/audio/sound-alef-tsere.mp3',
					// audio: '/audio/sound-a-3.mp3',
					examples: ['name', 'rain', 'paper'],
				},
				{
					ipa: '/ɔ/',
					audio: '/audio/sound-a-4.mp3',
					examples: ['talk', 'walk', 'water'],
				},
				{
					ipa: '/ə/',
					audio: '/audio/sound-a-5.mp3',
					examples: ['about', 'sofa', 'comma'],
				},
				{
					ipa: '/ɛ/',
					audio: '/audio/sound-alef-chataf-segol.mp3',
					// audio: '/audio/sound-a-6.mp3',
					examples: ['any', 'many', 'said'],
				},
			],
		},
	},
	{
		char: 'b',
		nameAudio: '/audio/sound-alef-tsere.mp3',

		// nameAudio: '/audio/name-b.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/b/',
					audio: '/audio/sound-bet-base.mp3',
					nameAudio: '/audio/name-b.mp3',
					grapheme: 'b',
					// audio: '/audio/sound-b-1.mp3',
					examples: ['bat', 'big', 'blue'],
				},
			],
			complex: [
				{
					ipa: '/b/',
					audio: '/audio/sound-bet-base.mp3',
					// audio: '/audio/sound-b-1.mp3',
					examples: ['bat', 'big', 'blue'],
				},
				{
					ipa: '∅',
					audio: '/audio/sound-b-2.mp3',
					examples: ['lamb', 'dumb', 'thumb'],
				}, // silent b
			],
		},
	},
	{
		char: 'c',
		nameAudio: '/audio/sound-alef-tsere.mp3',

		// nameAudio: '/audio/name-c.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/k/',
					audio: '/audio/sound-kaf-base.mp3',
					nameAudio: '/audio/name-c.mp3',
					grapheme: 'c',
					// audio: '/audio/sound-c-1.mp3',
					examples: ['cat', 'cold', 'class'],
				},
			],
			complex: [
				{
					ipa: '/k/',
					audio: '/audio/sound-kaf-base.mp3',
					// audio: '/audio/sound-c-1.mp3',
					examples: ['cat', 'cold', 'class'],
				},
				{
					ipa: '/s/',
					audio: '/audio/sound-sin-base.mp3',
					// audio: '/audio/sound-c-2.mp3',
					examples: ['city', 'cent', 'face'],
				},
				{
					ipa: '/tʃ/',
					audio: '/audio/sound-c-3.mp3',
					examples: ['cello', 'celloist', 'duccio'],
				}, // loans
				{
					ipa: '∅',
					audio: '/audio/sound-c-4.mp3',
					examples: ['indict', 'Connecticut', 'czar'],
				}, // silent/irregular
			],
		},
	},
	{
		char: 'd',
		nameAudio: '/audio/sound-alef-tsere.mp3',
		// nameAudio: '/audio/name-d.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/d/',
					audio: '/audio/sound-dalet-base.mp3',
					nameAudio: '/audio/name-d.mp3',
					grapheme: 'd',
					// audio: '/audio/sound-d-1.mp3',
					examples: ['dog', 'door', 'day'],
				},
			],
			complex: [
				{
					ipa: '/d/',
					audio: '/audio/sound-dalet-base.mp3',
					// audio: '/audio/sound-d-1.mp3',
					examples: ['dog', 'door', 'day'],
				},
				{
					ipa: '/dʒ/',
					audio: '/audio/sound-d-2.mp3',
					examples: ['education', 'schedule (AmE)', 'gradual'],
				},
				{
					ipa: '[ɾ]',
					audio: '/audio/sound-d-3.mp3',
					examples: ['ladder', 'butter', 'rider'],
				}, // alveolar flap (allophone)
				{
					ipa: '∅',
					audio: '/audio/sound-d-4.mp3',
					examples: ['Wednesday', 'handkerchief', 'edge (often unreleased)'],
				},
			],
		},
	},
	{
		char: 'e',
		nameAudio: '/audio/sound-alef-tsere.mp3',
		// nameAudio: '/audio/name-e.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/ɛ/',
					type: 'short',
					grapheme: 'ĕ',
					nameAudio: '/audio/name-short-e.mp3',
					audio: '/audio/sound-alef-segol.mp3',
					examples: ['pen', 'get', 'seven'],
				},
				{
					ipa: '/iː/',
					type: 'long',
					grapheme: 'ē',
					nameAudio: '/audio/name-long-e.mp3',
					audio: '/audio/sound-alef-hiriq.mp3',
					// audio: '/audio/sound-a-3.mp3',
					examples: ['me', 'these', 'theme'],
				},
			],
			complex: [
				{
					ipa: '/iː/',
					audio: '/audio/sound-alef-hiriq.mp3',
					// audio: '/audio/sound-e-1.mp3',
					examples: ['me', 'these', 'theme'],
				},
				{
					ipa: '/ɛ/',
					audio: '/audio/sound-alef-segol.mp3',
					// audio: '/audio/sound-e-2.mp3',
					examples: ['pen', 'get', 'seven'],
				},
				{
					ipa: '/ə/',
					audio: '/audio/sound-e-3.mp3',
					examples: ['open', 'problem', 'garden'],
				},
				{
					ipa: '/ɪ/',
					audio: '/audio/sound-e-4.mp3',
					examples: ['pretty', 'England', 'give'],
				},
				{
					ipa: '/ɝ/',
					audio: '/audio/sound-e-5.mp3',
					examples: ['her', 'term', 'fern'],
				}, // r-colored in AmE
				{
					ipa: '∅',
					audio: '/audio/sound-e-6.mp3',
					examples: ['make (silent e)', 'bake', 'ride'],
				},
			],
		},
	},
	{
		char: 'f',
		nameAudio: '/audio/sound-alef-tsere.mp3',
		// nameAudio: '/audio/name-f.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/f/',
					audio: '/audio/sound-fe-base.mp3',
					nameAudio: '/audio/name-f.mp3',
					grapheme: 'f',
					// audio: '/audio/sound-f-1.mp3',
					examples: ['fan', 'coffee', 'after'],
				},
			],
			complex: [
				{
					ipa: '/f/',
					audio: '/audio/sound-fe-base.mp3',
					// audio: '/audio/sound-f-1.mp3',
					examples: ['fan', 'coffee', 'after'],
				},
				{
					ipa: '/v/',
					audio: '/audio/sound-vet-base.mp3',
					// audio: '/audio/sound-f-2.mp3',
					examples: ['of', 'Stephen', 'halves'],
				}, // spelling causes /v/
			],
		},
	},
	{
		char: 'g',
		nameAudio: '/audio/sound-alef-tsere.mp3',
		// nameAudio: '/audio/name-g.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/g/',
					audio: '/audio/sound-gimel-base.mp3',
					nameAudio: '/audio/name-g.mp3',
					grapheme: 'g',
					// audio: '/audio/sound-g-1.mp3',
					examples: ['go', 'get', 'game'],
				},
			],
			complex: [
				{
					ipa: '/g/',
					audio: '/audio/sound-gimel-base.mp3',
					// audio: '/audio/sound-g-1.mp3',
					examples: ['go', 'get', 'game'],
				},
				{
					ipa: '/dʒ/',
					audio: '/audio/sound-g-2.mp3',
					examples: ['giant', 'gem', 'logic'],
				},
				{
					ipa: '/ʒ/',
					audio: '/audio/sound-g-3.mp3',
					examples: ['genre', 'mirage', 'massage'],
				},
				{
					ipa: '∅',
					audio: '/audio/sound-g-4.mp3',
					examples: ['gnome', 'gnash', 'foreign'],
				},
			],
		},
	},
	{
		char: 'h',
		nameAudio: '/audio/sound-alef-tsere.mp3',
		// nameAudio: '/audio/name-h.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/h/',
					audio: '/audio/sound-he-base.mp3',
					nameAudio: '/audio/name-h.mp3',
					grapheme: 'h',
					// audio: '/audio/sound-h-1.mp3',
					examples: ['hat', 'help', 'happy'],
				},
			],
			complex: [
				{
					ipa: '/h/',
					audio: '/audio/sound-he-base.mp3',
					// audio: '/audio/sound-h-1.mp3',
					examples: ['hat', 'help', 'happy'],
				},
				{
					ipa: '∅',
					audio: '/audio/sound-h-2.mp3',
					examples: ['honest', 'hour', 'heir'],
				},
			],
		},
	},
	{
		char: 'i',
		nameAudio: '/audio/sound-alef-tsere.mp3',
		// nameAudio: '/audio/name-i.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/ɪ/',
					type: 'short',
					grapheme: 'ĭ',
					nameAudio: '/audio/name-short-i.mp3',
					audio: '/audio/sound-i-1.mp3',
					examples: ['sit', 'big', 'milk'],
				},
				{
					ipa: '/aɪ/',
					type: 'long',
					grapheme: 'ī',
					nameAudio: '/audio/name-long-i.mp3',
					audio: '/audio/sound-alef-patach-yod.mp3',
					// audio: '/audio/sound-a-3.mp3',
					examples: ['time', 'find', 'ice'],
				},
			],
			complex: [
				{
					ipa: '/ɪ/',
					audio: '/audio/sound-i-1.mp3',
					examples: ['sit', 'big', 'milk'],
				},
				{
					ipa: '/aɪ/',
					audio: '/audio/sound-alef-patach-yod.mp3',
					// audio: '/audio/sound-i-2.mp3',
					examples: ['time', 'find', 'ice'],
				},
				{
					ipa: '/iː/',
					audio: '/audio/sound-i-3.mp3',
					examples: ['machine', 'police', 'pizza (AmE)'],
				},
				{
					ipa: '/ɝ/',
					audio: '/audio/sound-i-4.mp3',
					examples: ['bird', 'shirt', 'first'],
				}, // r-colored
				{
					ipa: '/ə/',
					audio: '/audio/sound-i-5.mp3',
					examples: ['family', 'origin', 'cousin'],
				},
			],
		},
	},
	{
		char: 'j',
		nameAudio: '/audio/sound-alef-tsere.mp3',
		// nameAudio: '/audio/name-j.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/dʒ/',
					audio: '/audio/sound-j-1.mp3',
					nameAudio: '/audio/name-j.mp3',
					grapheme: 'j',
					examples: ['jam', 'job', 'jungle'],
				},
			],
			complex: [
				{
					ipa: '/dʒ/',
					audio: '/audio/sound-j-1.mp3',
					examples: ['jam', 'job', 'jungle'],
				},
			],
		},
	},
	{
		char: 'k',
		nameAudio: '/audio/sound-alef-tsere.mp3',
		// nameAudio: '/audio/name-k.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/k/',
					audio: '/audio/sound-kaf-base.mp3',
					nameAudio: '/audio/name-k.mp3',
					grapheme: 'k',
					// audio: '/audio/sound-k-1.mp3',
					examples: ['kit', 'key', 'book'],
				},
			],
			complex: [
				{
					ipa: '/k/',
					audio: '/audio/sound-kaf-base.mp3',
					// audio: '/audio/sound-k-1.mp3',
					examples: ['kit', 'key', 'book'],
				},
				{
					ipa: '∅',
					audio: '/audio/sound-k-2.mp3',
					examples: ['knight', 'knee', 'know'],
				},
			],
		},
	},
	{
		char: 'l',
		nameAudio: '/audio/sound-alef-tsere.mp3',
		// nameAudio: '/audio/name-l.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/l/',
					audio: '/audio/sound-lamed-base.mp3',
					nameAudio: '/audio/name-l.mp3',
					grapheme: 'l',
					// audio: '/audio/sound-l-1.mp3',
					examples: ['light', 'leaf', 'look'],
				},
			],
			complex: [
				{
					ipa: '/l/',
					audio: '/audio/sound-lamed-base.mp3',
					// audio: '/audio/sound-l-1.mp3',
					examples: ['light', 'leaf', 'look'],
				},
				{
					ipa: '[ɫ]',
					audio: '/audio/sound-l-2.mp3',
					examples: ['ball', 'full', 'milk'],
				}, // dark L allophone
				{
					ipa: '∅',
					audio: '/audio/sound-l-3.mp3',
					examples: ['walk', 'talk', 'calm'],
				},
			],
		},
	},
	{
		char: 'm',
		nameAudio: '/audio/sound-alef-tsere.mp3',
		// nameAudio: '/audio/name-m.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/m/',
					audio: '/audio/sound-mem-base.mp3',
					nameAudio: '/audio/name-m.mp3',
					grapheme: 'm',
					// audio: '/audio/sound-m-1.mp3',
					examples: ['man', 'make', 'ham'],
				},
			],
			complex: [
				{
					ipa: '/m/',
					audio: '/audio/sound-mem-base.mp3',
					// audio: '/audio/sound-m-1.mp3',
					examples: ['man', 'make', 'ham'],
				},
				{
					ipa: '[m̩]',
					audio: '/audio/sound-m-2.mp3',
					examples: ['prism', 'rhythm', 'chasm'],
				}, // syllabic m
				{
					ipa: '∅',
					audio: '/audio/sound-m-3.mp3',
					examples: [
						'mnemonic',
						'damn (historical)',
						'column (silent n, but m audible)',
					],
				},
			],
		},
	},
	{
		char: 'n',
		nameAudio: '/audio/sound-alef-tsere.mp3',
		// nameAudio: '/audio/name-n.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/n/',
					audio: '/audio/sound-nun-base.mp3',
					nameAudio: '/audio/name-n.mp3',
					grapheme: 'n',
					// audio: '/audio/sound-n-1.mp3',
					examples: ['no', 'nine', 'need'],
				},
			],
			complex: [
				{
					ipa: '/n/',
					audio: '/audio/sound-nun-base.mp3',
					// audio: '/audio/sound-n-1.mp3',
					examples: ['no', 'nine', 'need'],
				},
				{
					ipa: '[ŋ]',
					audio: '/audio/sound-n-2.mp3',
					examples: ['bank', 'thank', 'uncle'],
				}, // allophone before /k,g/
				{
					ipa: '∅',
					audio: '/audio/sound-n-3.mp3',
					examples: ['autumn', 'column', 'hymn'],
				},
			],
		},
	},
	{
		char: 'o',
		nameAudio: '/audio/sound-alef-tsere.mp3',
		// nameAudio: '/audio/name-o.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/ɑ/',
					type: 'short',
					grapheme: 'ŏ',
					nameAudio: '/audio/name-short-o.mp3',
					audio: '/audio/sound-alef-patach.mp3',
					examples: ['pot', 'lot', 'shock'],
				},
				{
					ipa: '/oʊ/',
					type: 'long',
					grapheme: 'ō',
					nameAudio: '/audio/name-long-o.mp3',
					audio: '/audio/sound-alef-holam-male.mp3',
					// audio: '/audio/sound-a-3.mp3',
					examples: ['go', 'home', 'open'],
				},
			],
			complex: [
				{
					ipa: '/oʊ/',
					audio: '/audio/sound-alef-holam-male.mp3',
					// audio: '/audio/sound-o-1.mp3',
					examples: ['go', 'home', 'open'],
				},
				{
					ipa: '/ɑ/',
					audio: '/audio/sound-alef-patach.mp3',
					// audio: '/audio/sound-o-2.mp3',
					examples: ['pot', 'lot', 'shock'],
				},
				{
					ipa: '/o/',
					audio: '/audio/sound-o-3.mp3',
					examples: ['oasis', 'obey', 'donate'],
				},
				{
					ipa: '/uː/',
					audio: '/audio/sound-alef-shuruk.mp3',
					// audio: '/audio/sound-o-4.mp3',
					examples: ['move', 'do', 'to'],
				},
				{
					ipa: '/ʌ/',
					audio: '/audio/sound-o-5.mp3',
					examples: ['son', 'love', 'wonder'],
				},
				{
					ipa: '/ə/',
					audio: '/audio/sound-o-6.mp3',
					examples: ['lemon', 'button', 'harmony'],
				},
			],
		},
	},
	{
		char: 'p',
		nameAudio: '/audio/sound-alef-tsere.mp3',
		// nameAudio: '/audio/name-p.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/p/',
					audio: '/audio/sound-pe-base.mp3',
					nameAudio: '/audio/name-p.mp3',
					grapheme: 'p',
					// audio: '/audio/sound-p-1.mp3',
					examples: ['pen', 'paper', 'open'],
				},
			],
			complex: [
				{
					ipa: '/p/',
					audio: '/audio/sound-pe-base.mp3',
					// audio: '/audio/sound-p-1.mp3',
					examples: ['pen', 'paper', 'open'],
				},
				{
					ipa: '∅',
					audio: '/audio/sound-p-2.mp3',
					examples: ['cupboard', 'raspberry', 'psychology'],
				},
			],
		},
	},
	{
		char: 'q',
		nameAudio: '/audio/sound-alef-tsere.mp3',
		// nameAudio: '/audio/name-q.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/kw/',
					audio: '/audio/sound-q-1.mp3',
					nameAudio: '/audio/name-q.mp3',
					grapheme: 'q',
					examples: ['queen', 'quick', 'equal'],
				},
			],
			complex: [
				{
					ipa: '/kw/',
					audio: '/audio/sound-q-1.mp3',
					examples: ['queen', 'quick', 'equal'],
				},
				{
					ipa: '/k/',
					audio: '/audio/sound-kaf-base.mp3',
					// audio: '/audio/sound-q-2.mp3',
					examples: ['Iraq', 'Qatar (Anglicized)', 'burqa'],
				},
			],
		},
	},
	{
		char: 'r',
		nameAudio: '/audio/sound-alef-tsere.mp3',
		// nameAudio: '/audio/name-r.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/ɹ/',
					audio: '/audio/sound-r-1.mp3',
					nameAudio: '/audio/name-r.mp3',
					grapheme: 'r',
					examples: ['red', 'ring', 'river'],
				},
			],
			complex: [
				{
					ipa: '/ɹ/',
					audio: '/audio/sound-r-1.mp3',
					examples: ['red', 'ring', 'river'],
				},
				{
					ipa: '[ɚ]',
					audio: '/audio/sound-r-2.mp3',
					examples: ['butter', 'mother', 'paper'],
				}, // r-colored schwa (AmE)
			],
		},
	},
	{
		char: 's',
		nameAudio: '/audio/sound-alef-tsere.mp3',
		// nameAudio: '/audio/name-s.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/s/',
					audio: '/audio/sound-sin-base.mp3',
					nameAudio: '/audio/name-s.mp3',
					grapheme: 's',
					// audio: '/audio/sound-s-1.mp3',
					examples: ['sun', 'see', 'class'],
				},
			],
			complex: [
				{
					ipa: '/s/',
					audio: '/audio/sound-sin-base.mp3',
					// audio: '/audio/sound-s-1.mp3',
					examples: ['sun', 'see', 'class'],
				},
				{
					ipa: '/z/',
					audio: '/audio/sound-zayin-base.mp3',
					// audio: '/audio/sound-s-2.mp3',
					examples: ['dogs', 'rose', 'was'],
				},
				{
					ipa: '/ʃ/',
					audio: '/audio/sound-shin-base.mp3',
					// audio: '/audio/sound-s-3.mp3',
					examples: ['sure', 'sugar', 'Asia (1st s)'],
				},
				{
					ipa: '/ʒ/',
					audio: '/audio/sound-s-4.mp3',
					examples: ['measure', 'vision', 'usual'],
				},
				{
					ipa: '∅',
					audio: '/audio/sound-s-5.mp3',
					examples: ['island', 'Aisle (s silent via digraph)', 'debris'],
				},
			],
		},
	},
	{
		char: 't',
		nameAudio: '/audio/sound-alef-tsere.mp3',
		// nameAudio: '/audio/name-t.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/t/',
					audio: '/audio/sound-tav-base.mp3',
					nameAudio: '/audio/name-t.mp3',
					grapheme: 't',
					// audio: '/audio/sound-t-1.mp3',
					examples: ['top', 'ten', 'time'],
				},
			],
			complex: [
				{
					ipa: '/t/',
					audio: '/audio/sound-tav-base.mp3',
					// audio: '/audio/sound-t-1.mp3',
					examples: ['top', 'ten', 'time'],
				},
				{
					ipa: '[ɾ]',
					audio: '/audio/sound-t-2.mp3',
					examples: ['water', 'city', 'butter'],
				}, // flap
				{
					ipa: '/tʃ/',
					audio: '/audio/sound-t-3.mp3',
					examples: ['future', 'nature', 'virtue'],
				},
				{
					ipa: '/ʃ/',
					audio: '/audio/sound-shin-base.mp3',
					// audio: '/audio/sound-t-4.mp3',
					examples: ['nation', 'patient', 'motion'],
				},
				{
					ipa: '∅',
					audio: '/audio/sound-t-5.mp3',
					examples: ['castle', 'whistle', 'fasten'],
				},
			],
		},
	},
	{
		char: 'u',
		nameAudio: '/audio/sound-alef-tsere.mp3',
		// nameAudio: '/audio/name-u.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/ʊ/',
					type: 'short',
					grapheme: 'ŭ',
					nameAudio: '/audio/name-short-u.mp3',
					audio: '/audio/sound-u-4.mp3',
					examples: ['put', 'push', 'pull'],
				},
				{
					ipa: '/juː/',
					type: 'long',
					grapheme: 'ū',
					nameAudio: '/audio/name-long-u.mp3',
					audio: '/audio/sound-alef-shuruk.mp3',
					// audio: '/audio/sound-a-3.mp3',
					examples: ['use', 'uniform', 'music'],
				},
			],
			complex: [
				{
					ipa: '/ʌ/',
					audio: '/audio/sound-alef-qubutz.mp3',
					// audio: '/audio/sound-u-1.mp3',
					examples: ['cup', 'sun', 'lunch'],
				},
				{
					ipa: '/uː/',
					audio: '/audio/sound-alef-shuruk.mp3',
					// audio: '/audio/sound-u-2.mp3',
					examples: ['flute', 'rule', 'truth'],
				},
				{
					ipa: '/juː/',
					audio: '/audio/sound-u-3.mp3',
					examples: ['use', 'uniform', 'music'],
				},
				{
					ipa: '/ʊ/',
					audio: '/audio/sound-u-4.mp3',
					examples: ['put', 'push', 'pull'],
				},
				{
					ipa: '/ɝ/',
					audio: '/audio/sound-u-5.mp3',
					examples: ['turn', 'burn', 'nurse'],
				},
				{
					ipa: '/ə/',
					audio: '/audio/sound-u-6.mp3',
					examples: ['supply', 'autumnal', 'medium'],
				},
			],
		},
	},
	{
		char: 'v',
		nameAudio: '/audio/sound-alef-tsere.mp3',
		// nameAudio: '/audio/name-v.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/v/',
					audio: '/audio/sound-vet-base.mp3',
					nameAudio: '/audio/name-v.mp3',
					grapheme: 'v',
					// audio: '/audio/sound-v-1.mp3',
					examples: ['van', 'move', 'seven'],
				},
			],
			complex: [
				{
					ipa: '/v/',
					audio: '/audio/sound-vet-base.mp3',
					// audio: '/audio/sound-v-1.mp3',
					examples: ['van', 'move', 'seven'],
				},
			],
		},
	},
	{
		char: 'w',
		nameAudio: '/audio/sound-alef-tsere.mp3',
		// nameAudio: '/audio/name-w.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/w/',
					audio: '/audio/sound-w-1.mp3',
					nameAudio: '/audio/name-w.mp3',
					grapheme: 'w',
					examples: ['we', 'win', 'water'],
				},
			],
			complex: [
				{
					ipa: '/w/',
					audio: '/audio/sound-w-1.mp3',
					examples: ['we', 'win', 'water'],
				},
				{
					ipa: '∅',
					audio: '/audio/sound-w-2.mp3',
					examples: ['write', 'wrist', 'answer'],
				},
			],
		},
	},
	{
		char: 'x',
		nameAudio: '/audio/sound-alef-tsere.mp3',
		// nameAudio: '/audio/name-x.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/ks/',
					audio: '/audio/sound-x-1.mp3',
					nameAudio: '/audio/name-x.mp3',
					grapheme: 'x',
					examples: ['box', 'fix', 'six'],
				},
			],
			complex: [
				{
					ipa: '/ks/',
					audio: '/audio/sound-x-1.mp3',
					examples: ['box', 'fix', 'six'],
				},
				{
					ipa: '/gz/',
					audio: '/audio/sound-x-2.mp3',
					examples: ['exam', 'example', 'exhaust'],
				},
				{
					ipa: '/z/',
					audio: '/audio/sound-zayin-base.mp3',
					// audio: '/audio/sound-x-3.mp3',
					examples: ['xylophone', 'Xenia', 'Xerox'],
				},
				{
					ipa: '/kʃ/',
					audio: '/audio/sound-x-4.mp3',
					examples: ['anxious', 'luxury', 'sexual'],
				},
				{
					ipa: '∅',
					audio: '/audio/sound-x-5.mp3',
					examples: [
						'faux',
						'auxiliary (Fr. loans)',
						'Hors d’oeuvres (x absent)',
					],
				},
			],
		},
	},
	{
		char: 'y',
		nameAudio: '/audio/sound-alef-tsere.mp3',
		// nameAudio: '/audio/name-y.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/j/',
					audio: '/audio/sound-yod-base.mp3',
					nameAudio: '/audio/name-y.mp3',
					grapheme: 'y',
					// audio: '/audio/sound-y-1.mp3',
					examples: ['yes', 'yellow', 'yoga'],
				},
			],
			complex: [
				{
					ipa: '/j/',
					audio: '/audio/sound-yod-base.mp3',
					// audio: '/audio/sound-y-1.mp3',
					examples: ['yes', 'yellow', 'yoga'],
				},
				{
					ipa: '/aɪ/',
					audio: '/audio/sound-alef-patach-yod.mp3',
					// audio: '/audio/sound-y-2.mp3',
					examples: ['my', 'try', 'fly'],
				},
				{
					ipa: '/ɪ/',
					audio: '/audio/sound-y-3.mp3',
					examples: ['myth', 'gym', 'symbol'],
				},
				{
					ipa: '/iː/',
					audio: '/audio/sound-alef-hiriq.mp3',
					// audio: '/audio/sound-y-4.mp3',
					examples: ['happy', 'city', 'candy'],
				},
				{
					ipa: '/ɝ/',
					audio: '/audio/sound-y-5.mp3',
					examples: ['myrrh', 'syrup (AmE varies)', 'Smyrna (rhotic)'],
				},
			],
		},
	},
	{
		char: 'z',
		nameAudio: '/audio/sound-alef-tsere.mp3',
		// nameAudio: '/audio/name-z.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/z/',
					audio: '/audio/sound-zayin-base.mp3',
					nameAudio: '/audio/name-z.mp3',
					grapheme: 'z',
					// audio: '/audio/sound-z-1.mp3',
					examples: ['zoo', 'zero', 'lazy'],
				},
			],
			complex: [
				{
					ipa: '/z/',
					audio: '/audio/sound-zayin-base.mp3',
					// audio: '/audio/sound-z-1.mp3',
					examples: ['zoo', 'zero', 'lazy'],
				},
				{
					ipa: '/ʒ/',
					audio: '/audio/sound-z-2.mp3',
					examples: ['azure', 'seizure', 'vizier (var.)'],
				},
				{
					ipa: '/ts/',
					audio: '/audio/sound-tsadi-base.mp3',
					// audio: '/audio/sound-z-3.mp3',
					examples: ['pizza', 'mozzarella', 'piazza'],
				}, // loan/zz
				{
					ipa: '∅',
					audio: '/audio/sound-z-4.mp3',
					examples: ['rendezvous', 'chez', 'faux pas (Fr.)'],
				},
			],
		},
	},
]
